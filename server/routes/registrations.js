import { Router } from "express";
import { pool, transaction } from "../db.js";
import { requireAuth, requireOrganizer, requireStudent } from "../auth.js";
import { HttpError, idParam } from "../helpers.js";

export const registrationsRouter = Router();

export async function lockOpenEvent(conn, eventId) {
  const [[event]] = await conn.query("SELECT * FROM events WHERE id = ? FOR UPDATE", [eventId]);
  if (!event) throw new HttpError(404, "Event not found.");
  if (new Date(event.registration_deadline) < new Date()) {
    throw new HttpError(400, "Registration for this event has closed.");
  }
  return event;
}

export async function findPreviousRegistration(conn, userId, eventId) {
  const [[existing]] = await conn.query(
    "SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?",
    [userId, eventId],
  );
  if (existing?.status === "confirmed") throw new HttpError(409, "You're already registered for this event.");
  return existing ?? null;
}

export async function ensureSeatAvailable(conn, event) {
  const [[{ taken }]] = await conn.query(
    "SELECT COUNT(*) AS taken FROM registrations WHERE event_id = ? AND status = 'confirmed'",
    [event.id],
  );
  if (taken >= event.capacity) throw new HttpError(409, "Sorry, this event is full.");
}

async function saveRegistration(conn, userId, eventId, previous) {
  if (previous) {
    await conn.query(
      `UPDATE registrations
          SET status = 'confirmed', checked_in_at = NULL, registered_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [previous.id],
    );
    return previous.id;
  }
  const [result] = await conn.query(
    "INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, 'confirmed')",
    [userId, eventId],
  );
  return result.insertId;
}

async function getRegistration(conn, id) {
  const [[row]] = await conn.query("SELECT * FROM registrations WHERE id = ?", [id]);
  return row;
}

registrationsRouter.post("/events/:id/register", requireAuth, requireStudent, async (req, res) => {
  const eventId = idParam(req.params.id);
  const registration = await transaction(async (conn) => {
    const event = await lockOpenEvent(conn, eventId);
    const previous = await findPreviousRegistration(conn, req.user.id, event.id);
    await ensureSeatAvailable(conn, event);
    const id = await saveRegistration(conn, req.user.id, event.id, previous);
    return getRegistration(conn, id);
  });
  res.status(201).json(registration);
});

registrationsRouter.get("/my-registrations", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.user_id, r.event_id, r.status, r.checked_in_at, r.registered_at,
            e.organizer_id, e.title, e.description, e.category, e.venue, e.event_date,
            e.registration_deadline, e.capacity, e.fee, e.created_at,
            u.name AS organizer_name, u.college AS organizer_college
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u ON u.id = e.organizer_id
      WHERE r.user_id = ? AND r.status = 'confirmed'
      ORDER BY e.event_date ASC`,
    [req.user.id],
  );
  res.json(rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    event_id: r.event_id,
    status: r.status,
    checked_in_at: r.checked_in_at,
    registered_at: r.registered_at,
    event: {
      id: r.event_id,
      organizer_id: r.organizer_id,
      organizer_name: r.organizer_name,
      organizer_college: r.organizer_college,
      title: r.title,
      description: r.description,
      category: r.category,
      venue: r.venue,
      event_date: r.event_date,
      registration_deadline: r.registration_deadline,
      capacity: r.capacity,
      fee: r.fee,
      created_at: r.created_at,
    },
  })));
});

registrationsRouter.delete("/registrations/:id", requireAuth, async (req, res) => {
  const id = idParam(req.params.id);
  await transaction(async (conn) => {
    const [[initial]] = await conn.query("SELECT event_id FROM registrations WHERE id = ?", [id]);
    if (!initial) throw new HttpError(404, "Registration not found.");
    await conn.query("SELECT id FROM events WHERE id = ? FOR UPDATE", [initial.event_id]);
    // Use a current read because the initial lookup established a REPEATABLE READ snapshot.
    const [[reg]] = await conn.query(
      `SELECT r.*, e.organizer_id
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE r.id = ? FOR UPDATE`,
      [id],
    );
    if (!reg) throw new HttpError(404, "Registration not found.");
    const isStudent = req.user.role === "student" && reg.user_id === req.user.id;
    const isOrganizer = req.user.role === "organizer" && reg.organizer_id === req.user.id;
    if (!isStudent && !isOrganizer) throw new HttpError(403, "You can only cancel your own registration.");
    if (reg.status === "cancelled") return;
    if (reg.checked_in_at) throw new HttpError(409, "Checked-in registrations can't be cancelled.");
    await conn.query("UPDATE registrations SET status = 'cancelled' WHERE id = ?", [id]);
  });
  res.json({ ok: true });
});

registrationsRouter.get("/events/:id/registrations", requireAuth, requireOrganizer, async (req, res) => {
  const eventId = idParam(req.params.id);
  const [[event]] = await pool.query("SELECT organizer_id FROM events WHERE id = ?", [eventId]);
  if (!event) throw new HttpError(404, "Event not found.");
  if (event.organizer_id !== req.user.id) throw new HttpError(403, "Only this event's organizer can see its participants.");

  const [rows] = await pool.query(
    `SELECT r.id, r.user_id, r.status, r.checked_in_at, r.registered_at,
            u.name, u.email, u.college, u.reg_no
       FROM registrations r JOIN users u ON u.id = r.user_id
      WHERE r.event_id = ? AND r.status = 'confirmed'
      ORDER BY r.registered_at`,
    [eventId],
  );
  res.json(rows);
});

registrationsRouter.post("/registrations/:id/check-in", requireAuth, requireOrganizer, async (req, res) => {
  const id = idParam(req.params.id);
  const eventId = Number(req.body?.event_id);
  if (!Number.isInteger(eventId) || eventId < 1) throw new HttpError(400, "Event id is required.");
  const [[reg]] = await pool.query(
    `SELECT r.id, r.event_id, r.status, r.checked_in_at, e.organizer_id, u.name
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u ON u.id = r.user_id
      WHERE r.id = ?`,
    [id],
  );
  if (!reg || reg.organizer_id !== req.user.id) throw new HttpError(404, "That ticket isn't for one of your events.");
  if (eventId !== reg.event_id) throw new HttpError(400, "That ticket belongs to a different event.");
  if (reg.status !== "confirmed") throw new HttpError(409, `${reg.name}'s registration was cancelled.`);
  if (reg.checked_in_at) throw new HttpError(409, `${reg.name} is already checked in.`);

  const [result] = await pool.query(
    "UPDATE registrations SET checked_in_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'confirmed' AND checked_in_at IS NULL",
    [id],
  );
  if (result.affectedRows === 0) throw new HttpError(409, `${reg.name} is already checked in.`);
  res.json({ ok: true, name: reg.name });
});
