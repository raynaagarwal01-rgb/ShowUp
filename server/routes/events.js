import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireOrganizer } from "../auth.js";
import { mapEvent } from "../mappers.js";
import { getVisibleEvent, seatStats } from "../queries.js";
import { badRequest, forbidden, newId, notFound, parseDate, requireString } from "../util.js";

export const eventsRouter = Router();

const oneOf = (label, allowed) => (value) => {
  if (!allowed.includes(value)) throw badRequest(`${label} must be one of: ${allowed.join(", ")}.`);
  return value;
};

const integer = (label, { min, max = 2_147_483_647 }) => (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return n;
};

const text = (label, max) => (value) => requireString(value, label, max);
const date = (label) => (value) => parseDate(value, label);

const rules = (value) => {
  if (!Array.isArray(value)) throw badRequest("Rules must be a list.");
  const cleaned = value.map((r) => String(r).trim()).filter(Boolean).slice(0, 50);
  return JSON.stringify(cleaned);
};

// column -> converter. Anything not listed here can't be written by a client
// (in particular: id, created_by, created_at).
const EVENT_FIELDS = {
  club_id: text("Club id", 64),
  club_name: text("Club name", 255),
  title: text("Title", 255),
  tagline: text("Tagline", 512),
  description: text("Description", 20000),
  rules,
  category: text("Category", 50),
  scope: oneOf("Scope", ["internal", "external", "both"]),
  state: text("State", 100),
  city: text("City", 100),
  college: text("College", 255),
  venue: text("Venue", 512),
  start_at: date("Start time"),
  end_at: date("End time"),
  registration_deadline: date("Registration deadline"),
  capacity: integer("Capacity", { min: 1 }),
  fee: integer("Fee", { min: 0 }),
  team_min: integer("Minimum team size", { min: 1, max: 1000 }),
  team_max: integer("Maximum team size", { min: 1, max: 1000 }),
  banner_hue: integer("Banner hue", { min: 0, max: 360 }),
  status: oneOf("Status", ["draft", "published"]),
};

const REQUIRED_ON_CREATE = Object.keys(EVENT_FIELDS).filter(
  (f) => !["team_min", "team_max", "banner_hue", "status", "fee"].includes(f),
);
const DEFAULTS_ON_CREATE = { fee: 0, team_min: 1, team_max: 1, banner_hue: 200, status: "published" };

function convert(body, fields) {
  const out = {};
  for (const field of fields) {
    if (body[field] === undefined) continue;
    out[field] = EVENT_FIELDS[field](body[field]);
  }
  return out;
}

// Public: published events, soonest first.
eventsRouter.get("/events", async (_req, res) => {
  const rows = await query("SELECT * FROM events WHERE status = 'published' ORDER BY start_at ASC");
  res.json(rows.map(mapEvent));
});

eventsRouter.get("/events/:id", async (req, res) => {
  res.json(mapEvent(await getVisibleEvent(req.params.id, req.user)));
});

eventsRouter.get("/events/:id/stats", async (req, res) => {
  res.json(await seatStats(req.params.id));
});

eventsRouter.post("/events", requireOrganizer, async (req, res) => {
  for (const field of REQUIRED_ON_CREATE) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
      throw badRequest(`${field} is required.`);
    }
  }
  const values = { ...DEFAULTS_ON_CREATE, ...convert(req.body, Object.keys(EVENT_FIELDS)) };
  if (values.team_max < values.team_min) throw badRequest("Maximum team size can't be below the minimum.");

  const id = newId("evt");
  const columns = ["id", "created_by", ...Object.keys(values)];
  await query(`INSERT INTO events (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, [
    id,
    req.user.id,
    ...Object.values(values),
  ]);
  const [row] = await query("SELECT * FROM events WHERE id = ?", [id]);
  res.status(201).json(mapEvent(row));
});

async function ownedEvent(req) {
  const [event] = await query("SELECT * FROM events WHERE id = ?", [req.params.id]);
  if (!event) throw notFound("Event not found.");
  if (event.created_by !== req.user.id) throw forbidden("Only the organizer who created this event can change it.");
  return event;
}

eventsRouter.patch("/events/:id", requireAuth, async (req, res) => {
  const event = await ownedEvent(req);
  const values = convert(req.body, Object.keys(EVENT_FIELDS));
  const keys = Object.keys(values);
  if (keys.length) {
    const teamMin = values.team_min ?? event.team_min;
    const teamMax = values.team_max ?? event.team_max;
    if (teamMax < teamMin) throw badRequest("Maximum team size can't be below the minimum.");
    await query(`UPDATE events SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`, [
      ...Object.values(values),
      event.id,
    ]);
  }
  const [row] = await query("SELECT * FROM events WHERE id = ?", [event.id]);
  res.json(mapEvent(row));
});

// Registrations, teams, announcements, questions, winners and teammate listings
// all reference events with ON DELETE CASCADE, so this one statement removes
// the whole tree.
eventsRouter.delete("/events/:id", requireAuth, async (req, res) => {
  const event = await ownedEvent(req);
  await query("DELETE FROM events WHERE id = ?", [event.id]);
  res.json({ ok: true });
});
