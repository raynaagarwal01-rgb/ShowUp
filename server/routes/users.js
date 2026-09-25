import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { mapEvent, mapProfile, mapWinner } from "../mappers.js";
import { escapeLike, notFound } from "../util.js";
import { registrationsWithEvents } from "./registrations.js";

export const usersRouter = Router();

// Events created by a given organizer: their published events, plus drafts if
// that organizer is the one asking.
usersRouter.get("/users/:id/events", async (req, res) => {
  const rows = await query(
    `SELECT * FROM events
      WHERE created_by = ? AND (status = 'published' OR created_by = ?)
      ORDER BY start_at ASC`,
    [req.params.id, req.user?.id ?? null],
  );
  res.json(rows.map(mapEvent));
});

// Public-profile page data. Requires sign-in, like reading profiles always did.
usersRouter.get("/users/:id/public-profile", requireAuth, async (req, res) => {
  const [row] = await query("SELECT * FROM profiles WHERE id = ?", [req.params.id]);
  if (!row) throw notFound("Profile not found.");
  const profile = mapProfile(row);

  const registrations = await registrationsWithEvents(profile.id, req.user.id);

  let wonEvents = [];
  if (profile.name.trim()) {
    const winners = await query(
      `SELECT * FROM event_winners
        WHERE LOWER(team_or_participant_name) LIKE CONCAT('%', LOWER(?), '%')
        ORDER BY created_at DESC`,
      [escapeLike(profile.name.trim())],
    );
    wonEvents = winners.map(mapWinner);
  }

  res.json({ profile, registrations, wonEvents });
});
