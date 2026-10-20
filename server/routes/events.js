import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireOrganizer } from "../auth.js";
import { HttpError, idParam, requireDate, requireInt, requireText } from "../helpers.js";

export const eventsRouter = Router();

const CATEGORIES = ["Hackathon", "Workshop", "Competition", "Cultural", "Talk"];

// Each event with its organizer (INNER JOIN users) and its number of confirmed
// participants (LEFT JOIN registrations + COUNT + GROUP BY). LEFT JOIN keeps
// events that have no registrations yet; COUNT(r.id) is 0 for them.
const EVENT_SELECT = `
  SELECT e.*,
         u.name    AS organizer_name,
         u.college AS organizer_college,
         COUNT(r.id) AS registered_count
    FROM events e
    JOIN users u ON u.id = e.organizer_id
    LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'`;

async function findEvent(id) {
  const [[event]] = await pool.query(`${EVENT_SELECT} WHERE e.id = ? GROUP BY e.id`, [id]);
  if (!event) throw new HttpError(404, "Event not found.");
  return event;
}

/** Validates the fields an organizer can set on an event. */
function readEventBody(body) {
  const event = {
    title: requireText(body.title, "Title", 200),
    description: requireText(body.description, "Description", 5000),
    category: requireText(body.category, "Category", 50),
    venue: requireText(body.venue, "Venue", 200),
    event_date: requireDate(body.event_date, "Event date"),
    registration_deadline: requireDate(body.registration_deadline, "Registration deadline"),
    capacity: requireInt(body.capacity, "Capacity", 1, 100000),
    fee: requireInt(body.fee ?? 0, "Fee", 0, 100000),
    team_min: requireInt(body.team_min ?? 1, "Minimum team size", 1, 50),
    team_max: requireInt(body.team_max ?? 1, "Maximum team size", 1, 50),
  };
  if (!CATEGORIES.includes(event.category)) throw new HttpError(400, `Category must be one of: ${CATEGORIES.join(", ")}.`);
  if (event.team_max < event.team_min) throw new HttpError(400, "Maximum team size can't be below the minimum.");
  if (event.registration_deadline > event.event_date) {
    throw new HttpError(400, "The registration deadline must be before the event starts.");
  }
  return event;
}

/** Loads an event and checks that the signed-in organizer created it. */
async function findOwnEvent(req) {
  const event = await findEvent(idParam(req.params.id));
  if (event.organizer_id !== req.user.id) throw new HttpError(403, "Only the organizer who created this event can change it.");
  return event;
}

// GET /api/events — every event, soonest first
eventsRouter.get("/events", async (_req, res) => {
  const [events] = await pool.query(`${EVENT_SELECT} GROUP BY e.id ORDER BY e.event_date ASC`);
  res.json(events);
});

// GET /api/events/:id
eventsRouter.get("/events/:id", async (req, res) => {
  res.json(await findEvent(idParam(req.params.id)));
});

// POST /api/events — organizers only
eventsRouter.post("/events", requireAuth, requireOrganizer, async (req, res) => {
  const e = readEventBody(req.body);
  const [result] = await pool.query(
    `INSERT INTO events (organizer_id, title, description, category, venue, event_date,
                         registration_deadline, capacity, fee, team_min, team_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, e.title, e.description, e.category, e.venue, e.event_date,
     e.registration_deadline, e.capacity, e.fee, e.team_min, e.team_max],
  );
  res.status(201).json(await findEvent(result.insertId));
});

// PUT /api/events/:id — only the organizer who created it
eventsRouter.put("/events/:id", requireAuth, requireOrganizer, async (req, res) => {
  const old = await findOwnEvent(req);
  const e = readEventBody(req.body);
  if (e.capacity < old.registered_count) {
    throw new HttpError(400, `${old.registered_count} people are already registered, so capacity can't be lower than that.`);
  }
  if (old.registered_count > 0 && (e.team_max > 1) !== (old.team_max > 1)) {
    throw new HttpError(400, "People have already registered, so the event can't switch between solo and team.");
  }

  await pool.query(
    `UPDATE events
        SET title = ?, description = ?, category = ?, venue = ?, event_date = ?,
            registration_deadline = ?, capacity = ?, fee = ?, team_min = ?, team_max = ?
      WHERE id = ?`,
    [e.title, e.description, e.category, e.venue, e.event_date,
     e.registration_deadline, e.capacity, e.fee, e.team_min, e.team_max, old.id],
  );
  res.json(await findEvent(old.id));
});

// DELETE /api/events/:id — ON DELETE CASCADE removes the event's teams,
// team members, registrations, announcements, questions and winners too.
eventsRouter.delete("/events/:id", requireAuth, requireOrganizer, async (req, res) => {
  const event = await findOwnEvent(req);
  await pool.query("DELETE FROM events WHERE id = ?", [event.id]);
  res.json({ ok: true });
});
