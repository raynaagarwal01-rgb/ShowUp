import { Router } from "express";
import { pool, transaction } from "../db.js";
import { requireAuth, requireOrganizer } from "../auth.js";
import { HttpError, idParam, requireDate, requireInt, requireText } from "../helpers.js";

export const eventsRouter = Router();

const CATEGORIES = ["Hackathon", "Workshop", "Competition", "Cultural", "Talk"];
const EVENT_SELECT = `
  SELECT e.*, u.name AS organizer_name, u.college AS organizer_college,
         COUNT(r.id) AS registered_count
    FROM events e
    JOIN users u ON u.id = e.organizer_id
    LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'`;

async function findEvent(id) {
  const [[event]] = await pool.query(`${EVENT_SELECT} WHERE e.id = ? GROUP BY e.id`, [id]);
  if (!event) throw new HttpError(404, "Event not found.");
  return event;
}

function readEventBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Invalid request body.");
  const event = {
    title: requireText(body.title, "Title", 200),
    description: requireText(body.description, "Description", 5000),
    category: requireText(body.category, "Category", 50),
    venue: requireText(body.venue, "Venue", 200),
    event_date: requireDate(body.event_date, "Event date"),
    registration_deadline: requireDate(body.registration_deadline, "Registration deadline"),
    capacity: requireInt(body.capacity, "Capacity", 1, 100000),
    fee: requireInt(body.fee ?? 0, "Fee", 0, 100000),
  };
  if (!CATEGORIES.includes(event.category)) throw new HttpError(400, `Category must be one of: ${CATEGORIES.join(", ")}.`);
  if (event.registration_deadline > event.event_date) {
    throw new HttpError(400, "The registration deadline must be before the event starts.");
  }
  return event;
}

async function findOwnEvent(req) {
  const event = await findEvent(idParam(req.params.id));
  if (event.organizer_id !== req.user.id) throw new HttpError(403, "Only the organizer who created this event can change it.");
  return event;
}

eventsRouter.get("/events", async (_req, res) => {
  const [events] = await pool.query(`${EVENT_SELECT} GROUP BY e.id ORDER BY e.event_date ASC`);
  res.json(events);
});

eventsRouter.get("/events/:id", async (req, res) => {
  res.json(await findEvent(idParam(req.params.id)));
});

eventsRouter.post("/events", requireAuth, requireOrganizer, async (req, res) => {
  const e = readEventBody(req.body);
  const [result] = await pool.query(
    `INSERT INTO events (organizer_id, title, description, category, venue, event_date,
                         registration_deadline, capacity, fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, e.title, e.description, e.category, e.venue, e.event_date,
      e.registration_deadline, e.capacity, e.fee],
  );
  res.status(201).json(await findEvent(result.insertId));
});

eventsRouter.put("/events/:id", requireAuth, requireOrganizer, async (req, res) => {
  const id = idParam(req.params.id);
  const e = readEventBody(req.body);
  await transaction(async (conn) => {
    const [[event]] = await conn.query("SELECT id, organizer_id FROM events WHERE id = ? FOR UPDATE", [id]);
    if (!event) throw new HttpError(404, "Event not found.");
    if (event.organizer_id !== req.user.id) throw new HttpError(403, "Only the organizer who created this event can change it.");
    const [[{ registered_count: count }]] = await conn.query(
      "SELECT COUNT(*) AS registered_count FROM registrations WHERE event_id = ? AND status = 'confirmed'",
      [id],
    );
    if (e.capacity < count) throw new HttpError(400, `${count} people are already registered, so capacity can't be lower than that.`);
    await conn.query(
      `UPDATE events
          SET title = ?, description = ?, category = ?, venue = ?, event_date = ?,
              registration_deadline = ?, capacity = ?, fee = ?
        WHERE id = ?`,
      [e.title, e.description, e.category, e.venue, e.event_date,
        e.registration_deadline, e.capacity, e.fee, id],
    );
  });
  res.json(await findEvent(id));
});

eventsRouter.delete("/events/:id", requireAuth, requireOrganizer, async (req, res) => {
  const event = await findOwnEvent(req);
  await pool.query("DELETE FROM events WHERE id = ?", [event.id]);
  res.json({ ok: true });
});
