// Announcements, event Q&A, winners, and "looking for teammates" listings.
import { Router } from "express";
import { query } from "../db.js";
import { isOrganizerRole, rateLimit, requireAuth } from "../auth.js";
import { mapAnnouncement, mapListing, mapQuestion, mapWinner } from "../mappers.js";
import { forbidden, newId, notFound, optionalString, requireString } from "../util.js";

export const communityRouter = Router();

async function requireEvent(eventId) {
  const [event] = await query("SELECT id, created_by FROM events WHERE id = ?", [eventId]);
  if (!event) throw notFound("Event not found.");
  return event;
}

/** Organizers (by role) and the event's own creator may post updates. */
function assertCanManage(user, event) {
  if (!user) throw forbidden("Please sign in.");
  if (!isOrganizerRole(user) && event.created_by !== user.id) {
    throw forbidden("Only organizers can do that.");
  }
}

// --- Announcements -------------------------------------------------------------

communityRouter.get("/events/:id/announcements", async (req, res) => {
  const rows = await query("SELECT * FROM announcements WHERE event_id = ? ORDER BY created_at DESC", [req.params.id]);
  res.json(rows.map(mapAnnouncement));
});

communityRouter.post("/events/:id/announcements", requireAuth, async (req, res) => {
  const event = await requireEvent(req.params.id);
  assertCanManage(req.user, event);
  const id = newId();
  await query(
    "INSERT INTO announcements (id, event_id, title, content, author_name, is_urgent) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      event.id,
      requireString(req.body.title, "Title", 255),
      requireString(req.body.content, "Content", 10000),
      optionalString(req.body.authorName, 255) ?? req.user.name,
      req.body.isUrgent ? 1 : 0,
    ],
  );
  const [row] = await query("SELECT * FROM announcements WHERE id = ?", [id]);
  res.status(201).json(mapAnnouncement(row));
});

// --- Q&A -----------------------------------------------------------------------

communityRouter.get("/events/:id/questions", async (req, res) => {
  const rows = await query("SELECT * FROM event_questions WHERE event_id = ? ORDER BY created_at DESC", [req.params.id]);
  res.json(rows.map(mapQuestion));
});

// Signed-in users are attributed by account; guests may ask under a display name.
const questionLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });

communityRouter.post("/events/:id/questions", questionLimit, async (req, res) => {
  const event = await requireEvent(req.params.id);
  const id = newId();
  await query("INSERT INTO event_questions (id, event_id, user_id, user_name, question) VALUES (?, ?, ?, ?, ?)", [
    id,
    event.id,
    req.user?.id ?? null,
    req.user?.name ?? requireString(req.body.userName, "Name", 255),
    requireString(req.body.question, "Question", 5000),
  ]);
  const [row] = await query("SELECT * FROM event_questions WHERE id = ?", [id]);
  res.status(201).json(mapQuestion(row));
});

communityRouter.post("/questions/:id/answer", requireAuth, async (req, res) => {
  const [question] = await query(
    `SELECT q.id, e.created_by FROM event_questions q JOIN events e ON e.id = q.event_id WHERE q.id = ?`,
    [req.params.id],
  );
  if (!question) throw notFound("Question not found.");
  assertCanManage(req.user, question);

  await query("UPDATE event_questions SET answer = ?, answered_by = ?, answered_at = UTC_TIMESTAMP(3) WHERE id = ?", [
    requireString(req.body.answer, "Answer", 5000),
    optionalString(req.body.answeredBy, 255) ?? req.user.name,
    question.id,
  ]);
  res.json({ ok: true });
});

// --- Winners -------------------------------------------------------------------

communityRouter.get("/events/:id/winners", async (req, res) => {
  const rows = await query("SELECT * FROM event_winners WHERE event_id = ? ORDER BY position ASC", [req.params.id]);
  res.json(rows.map(mapWinner));
});

communityRouter.post("/events/:id/winners", requireAuth, async (req, res) => {
  const event = await requireEvent(req.params.id);
  assertCanManage(req.user, event);
  const position = Number.parseInt(req.body.position, 10);
  const id = newId();
  await query(
    `INSERT INTO event_winners
       (id, event_id, position, winner_title, team_or_participant_name, college,
        prize_amount, project_title, project_link, announced_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      event.id,
      Number.isInteger(position) ? position : 1,
      requireString(req.body.winner_title, "Winner title", 255),
      requireString(req.body.team_or_participant_name, "Winner name", 255),
      optionalString(req.body.college, 255) ?? "VIT Vellore",
      optionalString(req.body.prize_amount, 255) ?? "",
      optionalString(req.body.project_title, 255) ?? "",
      optionalString(req.body.project_link, 512) ?? "",
      optionalString(req.body.announced_by, 255) ?? "Event Organizing Committee",
    ],
  );
  const [row] = await query("SELECT * FROM event_winners WHERE id = ?", [id]);
  res.status(201).json(mapWinner(row));
});

// --- Teammate listings -----------------------------------------------------------

communityRouter.get("/events/:id/teammate-listings", async (req, res) => {
  const rows = await query("SELECT * FROM teammate_listings WHERE event_id = ? ORDER BY created_at DESC", [
    req.params.id,
  ]);
  res.json(rows.map(mapListing));
});

// One listing per person per event: posting again edits the existing one.
communityRouter.put("/events/:id/teammate-listings", requireAuth, async (req, res) => {
  const event = await requireEvent(req.params.id);
  await query(
    `INSERT INTO teammate_listings (id, event_id, user_id, user_name, user_college, looking_for, message, contact)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) AS incoming
     ON DUPLICATE KEY UPDATE
       looking_for = incoming.looking_for, message = incoming.message, contact = incoming.contact`,
    [
      newId(),
      event.id,
      req.user.id,
      requireString(req.body.userName ?? req.user.name, "Name", 255),
      optionalString(req.body.userCollege, 255) ?? "",
      requireString(req.body.lookingFor, "Looking for", 512),
      String(req.body.message ?? "").trim().slice(0, 5000),
      String(req.body.contact ?? "").trim().slice(0, 255),
    ],
  );
  const [row] = await query("SELECT * FROM teammate_listings WHERE event_id = ? AND user_id = ?", [
    event.id,
    req.user.id,
  ]);
  res.json(mapListing(row));
});

communityRouter.delete("/teammate-listings/:id", requireAuth, async (req, res) => {
  await query("DELETE FROM teammate_listings WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  res.json({ ok: true });
});
