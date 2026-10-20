import { Router } from "express";
import { pool, transaction } from "../db.js";
import { requireAuth, requireOrganizer, requireStudent } from "../auth.js";
import { HttpError, idParam } from "../helpers.js";

export const registrationsRouter = Router();

// --- Shared steps (also used by routes/teams.js) --------------------------------
// Every registration path runs inside a transaction and starts by locking the
// event row with SELECT ... FOR UPDATE. Two people registering for the same
// event at the same moment therefore run one after the other, so the seat
// count can't be exceeded.

/** Locks the event row and checks that registration is still open. */
export async function lockOpenEvent(conn, eventId) {
  const [[event]] = await conn.query("SELECT * FROM events WHERE id = ? FOR UPDATE", [eventId]);
  if (!event) throw new HttpError(404, "Event not found.");
  if (new Date(event.registration_deadline) < new Date()) {
    throw new HttpError(400, "Registration for this event has closed.");
  }
  return event;
}

/** Returns the user's earlier (cancelled) registration if there is one, and
 * rejects a duplicate confirmed registration. */
export async function findPreviousRegistration(conn, userId, eventId) {
  const [[existing]] = await conn.query(
    "SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?",
    [userId, eventId],
  );
  if (existing?.status === "confirmed") throw new HttpError(409, "You're already registered for this event.");
  return existing ?? null;
}

/** Capacity counts people: every confirmed row, solo or team member. */
export async function ensureSeatAvailable(conn, event) {
  const [[{ taken }]] = await conn.query(
    "SELECT COUNT(*) AS taken FROM registrations WHERE event_id = ? AND status = 'confirmed'",
    [event.id],
  );
  if (taken >= event.capacity) throw new HttpError(409, "Sorry, this event is full.");
}

/** Inserts the registration, or re-activates a cancelled one. UNIQUE(user_id,
 * event_id) allows only one row per person per event, so re-registering
 * updates that row instead of inserting a second one. */
export async function saveRegistration(conn, { userId, eventId, teamId, previous }) {
  if (previous) {
    await conn.query(
      `UPDATE registrations
          SET status = 'confirmed', team_id = ?, checked_in_at = NULL, registered_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [teamId, previous.id],
    );
    return previous.id;
  }
  const [result] = await conn.query(
    "INSERT INTO registrations (user_id, event_id, team_id, status) VALUES (?, ?, ?, 'confirmed')",
    [userId, eventId, teamId],
  );
  return result.insertId;
}

export async function getRegistration(conn, id) {
  const [[row]] = await conn.query("SELECT * FROM registrations WHERE id = ?", [id]);
  return row;
}

// --- Routes ------------------------------------------------------------------------

// POST /api/events/:id/register — solo events only (team events use /teams)
registrationsRouter.post("/events/:id/register", requireAuth, requireStudent, async (req, res) => {
  const eventId = idParam(req.params.id);
  const registration = await transaction(async (conn) => {
    const event = await lockOpenEvent(conn, eventId);
    if (event.team_max > 1) throw new HttpError(400, "This is a team event — create a team or join one with a code.");
    const previous = await findPreviousRegistration(conn, req.user.id, event.id);
    await ensureSeatAvailable(conn, event);
    const id = await saveRegistration(conn, { userId: req.user.id, eventId: event.id, teamId: null, previous });
    return getRegistration(conn, id);
  });
  res.status(201).json(registration);
});

// GET /api/my-registrations — the signed-in user's confirmed registrations,
// each with its event, organizer and (if any) team.
registrationsRouter.get("/my-registrations", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.user_id, r.event_id, r.team_id, r.status, r.checked_in_at, r.registered_at,
            e.organizer_id, e.title, e.description, e.category, e.venue, e.event_date,
            e.registration_deadline, e.capacity, e.fee, e.team_min, e.team_max, e.created_at,
            u.name AS organizer_name, u.college AS organizer_college,
            t.name AS team_name, t.join_code, t.leader_id
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u  ON u.id = e.organizer_id
       LEFT JOIN teams t ON t.id = r.team_id
      WHERE r.user_id = ? AND r.status = 'confirmed'
      ORDER BY e.event_date ASC`,
    [req.user.id],
  );

  // Reshape each flat row into { ...registration, event: {...}, team: {...} }.
  res.json(
    rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      event_id: r.event_id,
      team_id: r.team_id,
      status: r.status,
      checked_in_at: r.checked_in_at,
      registered_at: r.registered_at,
      event: {
        id: r.event_id, organizer_id: r.organizer_id, organizer_name: r.organizer_name,
        organizer_college: r.organizer_college, title: r.title, description: r.description,
        category: r.category, venue: r.venue, event_date: r.event_date,
        registration_deadline: r.registration_deadline, capacity: r.capacity, fee: r.fee,
        team_min: r.team_min, team_max: r.team_max, created_at: r.created_at,
      },
      team: r.team_id ? { id: r.team_id, name: r.team_name, join_code: r.join_code, leader_id: r.leader_id } : null,
    })),
  );
});

// DELETE /api/registrations/:id — cancel (by the participant or the event's
// organizer). The row is kept with status 'cancelled'; if the person was in a
// team they leave it, and the team is deleted if nobody is left.
registrationsRouter.delete("/registrations/:id", requireAuth, async (req, res) => {
  const id = idParam(req.params.id);
  await transaction(async (conn) => {
    const [[reg]] = await conn.query(
      `SELECT r.*, e.organizer_id FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.id = ?`,
      [id],
    );
    if (!reg) throw new HttpError(404, "Registration not found.");
    if (reg.user_id !== req.user.id && reg.organizer_id !== req.user.id) {
      throw new HttpError(403, "You can only cancel your own registration.");
    }
    if (reg.status === "cancelled") return;

    await conn.query("SELECT id FROM events WHERE id = ? FOR UPDATE", [reg.event_id]);
    await conn.query("UPDATE registrations SET status = 'cancelled', team_id = NULL WHERE id = ?", [reg.id]);

    if (reg.team_id) {
      await conn.query("DELETE FROM team_members WHERE team_id = ? AND user_id = ?", [reg.team_id, reg.user_id]);
      const [[{ remaining }]] = await conn.query(
        "SELECT COUNT(*) AS remaining FROM team_members WHERE team_id = ?",
        [reg.team_id],
      );
      if (remaining === 0) {
        await conn.query("DELETE FROM teams WHERE id = ?", [reg.team_id]);
      } else {
        // If the leader left, the earliest remaining member becomes leader.
        await conn.query(
          `UPDATE teams
              SET leader_id = (SELECT user_id FROM team_members WHERE team_id = ? ORDER BY joined_at, user_id LIMIT 1)
            WHERE id = ? AND leader_id = ?`,
          [reg.team_id, reg.team_id, reg.user_id],
        );
      }
    }
  });
  res.json({ ok: true });
});

// GET /api/events/:id/registrations — the participant list, for the event's organizer
registrationsRouter.get("/events/:id/registrations", requireAuth, requireOrganizer, async (req, res) => {
  const eventId = idParam(req.params.id);
  const [[event]] = await pool.query("SELECT organizer_id FROM events WHERE id = ?", [eventId]);
  if (!event) throw new HttpError(404, "Event not found.");
  if (event.organizer_id !== req.user.id) throw new HttpError(403, "Only this event's organizer can see its participants.");

  const [rows] = await pool.query(
    `SELECT r.id, r.user_id, r.team_id, r.status, r.checked_in_at, r.registered_at,
            u.name, u.email, u.college, u.reg_no,
            t.name AS team_name, t.join_code, t.leader_id
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN teams t ON t.id = r.team_id
      WHERE r.event_id = ? AND r.status = 'confirmed'
      ORDER BY t.name IS NULL, t.name, r.registered_at`,
    [eventId],
  );
  res.json(rows);
});

// POST /api/registrations/:id/check-in  { event_id }
// Only the event's organizer, only confirmed and not-yet-checked-in tickets.
registrationsRouter.post("/registrations/:id/check-in", requireAuth, requireOrganizer, async (req, res) => {
  const id = idParam(req.params.id);
  const [[reg]] = await pool.query(
    `SELECT r.id, r.event_id, r.status, r.checked_in_at, e.organizer_id, u.name
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u  ON u.id = r.user_id
      WHERE r.id = ?`,
    [id],
  );
  if (!reg || reg.organizer_id !== req.user.id) throw new HttpError(404, "That ticket isn't for one of your events.");
  if (req.body.event_id && Number(req.body.event_id) !== reg.event_id) {
    throw new HttpError(400, "That ticket belongs to a different event.");
  }
  if (reg.status !== "confirmed") throw new HttpError(409, `${reg.name}'s registration was cancelled.`);
  if (reg.checked_in_at) throw new HttpError(409, `${reg.name} is already checked in.`);

  // The WHERE clause repeats the rule, so two scanners can't check in twice.
  const [result] = await pool.query(
    "UPDATE registrations SET checked_in_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'confirmed' AND checked_in_at IS NULL",
    [id],
  );
  if (result.affectedRows === 0) throw new HttpError(409, `${reg.name} is already checked in.`);
  res.json({ ok: true, name: reg.name });
});
