// Announcements, Q&A and winners for an event. Anyone can read them; only the
// organizer who created the event can post announcements, answer questions
// and add winners.
import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";
import { HttpError, idParam, optionalText, requireInt, requireText } from "../helpers.js";

export const communityRouter = Router();

/** Checks that the signed-in user is the organizer of event `eventId`. */
async function requireEventOrganizer(eventId, user) {
  const [[event]] = await pool.query("SELECT id, organizer_id FROM events WHERE id = ?", [eventId]);
  if (!event) throw new HttpError(404, "Event not found.");
  if (event.organizer_id !== user.id) throw new HttpError(403, "Only this event's organizer can do that.");
  return event;
}

// --- Announcements ---------------------------------------------------------------

// GET /api/events/:id/announcements — newest first
communityRouter.get("/events/:id/announcements", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM announcements WHERE event_id = ? ORDER BY created_at DESC, id DESC",
    [idParam(req.params.id)],
  );
  res.json(rows);
});

// POST /api/events/:id/announcements  { title, content }
communityRouter.post("/events/:id/announcements", requireAuth, async (req, res) => {
  const event = await requireEventOrganizer(idParam(req.params.id), req.user);
  const title = requireText(req.body.title, "Title", 150);
  const content = requireText(req.body.content, "Content", 5000);
  const [result] = await pool.query(
    "INSERT INTO announcements (event_id, title, content) VALUES (?, ?, ?)",
    [event.id, title, content],
  );
  const [[row]] = await pool.query("SELECT * FROM announcements WHERE id = ?", [result.insertId]);
  res.status(201).json(row);
});

// --- Questions -------------------------------------------------------------------

// GET /api/events/:id/questions — JOIN users to show who asked
communityRouter.get("/events/:id/questions", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT q.*, u.name AS user_name
       FROM event_questions q
       JOIN users u ON u.id = q.user_id
      WHERE q.event_id = ?
      ORDER BY q.created_at DESC, q.id DESC`,
    [idParam(req.params.id)],
  );
  res.json(rows);
});

// POST /api/events/:id/questions  { question } — any signed-in user
communityRouter.post("/events/:id/questions", requireAuth, async (req, res) => {
  const eventId = idParam(req.params.id);
  const question = requireText(req.body.question, "Question", 2000);
  const [[event]] = await pool.query("SELECT id FROM events WHERE id = ?", [eventId]);
  if (!event) throw new HttpError(404, "Event not found.");

  const [result] = await pool.query(
    "INSERT INTO event_questions (event_id, user_id, question) VALUES (?, ?, ?)",
    [eventId, req.user.id, question],
  );
  const [[row]] = await pool.query(
    "SELECT q.*, u.name AS user_name FROM event_questions q JOIN users u ON u.id = q.user_id WHERE q.id = ?",
    [result.insertId],
  );
  res.status(201).json(row);
});

// PUT /api/questions/:id/answer  { answer } — the event's organizer only
communityRouter.put("/questions/:id/answer", requireAuth, async (req, res) => {
  const questionId = idParam(req.params.id);
  const answer = requireText(req.body.answer, "Answer", 2000);
  const [[question]] = await pool.query("SELECT id, event_id FROM event_questions WHERE id = ?", [questionId]);
  if (!question) throw new HttpError(404, "Question not found.");
  await requireEventOrganizer(question.event_id, req.user);

  await pool.query("UPDATE event_questions SET answer = ? WHERE id = ?", [answer, questionId]);
  res.json({ ok: true });
});

// --- Winners ---------------------------------------------------------------------

// GET /api/events/:id/winners
communityRouter.get("/events/:id/winners", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM event_winners WHERE event_id = ? ORDER BY position ASC, id ASC",
    [idParam(req.params.id)],
  );
  res.json(rows);
});

// POST /api/events/:id/winners  { position, winner_name, prize }
communityRouter.post("/events/:id/winners", requireAuth, async (req, res) => {
  const event = await requireEventOrganizer(idParam(req.params.id), req.user);
  const position = requireInt(req.body.position, "Position", 1, 100);
  const winnerName = requireText(req.body.winner_name, "Winner name", 150);
  const prize = optionalText(req.body.prize, "Prize", 100);

  const [result] = await pool.query(
    "INSERT INTO event_winners (event_id, position, winner_name, prize) VALUES (?, ?, ?, ?)",
    [event.id, position, winnerName, prize],
  );
  const [[row]] = await pool.query("SELECT * FROM event_winners WHERE id = ?", [result.insertId]);
  res.status(201).json(row);
});
