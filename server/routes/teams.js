import crypto from "node:crypto";
import { Router } from "express";
import { pool, transaction } from "../db.js";
import { requireAuth, requireStudent } from "../auth.js";
import { HttpError, idParam, requireText } from "../helpers.js";
import {
  ensureSeatAvailable,
  findPreviousRegistration,
  getRegistration,
  lockOpenEvent,
  saveRegistration,
} from "./registrations.js";

export const teamsRouter = Router();

/** 6-character code without look-alike characters (no 0/O, 1/I). */
function newJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(alphabet.length)];
  return code;
}

async function teamWithMembers(conn, teamId) {
  const [[team]] = await conn.query("SELECT * FROM teams WHERE id = ?", [teamId]);
  const [members] = await conn.query(
    `SELECT u.id, u.name, u.college, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at, u.id`,
    [teamId],
  );
  return { ...team, members };
}

// POST /api/events/:id/teams  { name } — create a team; the creator is its
// leader, first member and first registration.
teamsRouter.post("/events/:id/teams", requireAuth, requireStudent, async (req, res) => {
  const eventId = idParam(req.params.id);
  const name = requireText(req.body.name, "Team name", 100);

  const result = await transaction(async (conn) => {
    const event = await lockOpenEvent(conn, eventId);
    if (event.team_max <= 1) throw new HttpError(400, "This is a solo event — just register.");
    const previous = await findPreviousRegistration(conn, req.user.id, event.id);
    await ensureSeatAvailable(conn, event);

    // Pick a join code nobody is using (the UNIQUE constraint is the backstop).
    let joinCode = newJoinCode();
    while ((await conn.query("SELECT id FROM teams WHERE join_code = ?", [joinCode]))[0].length) {
      joinCode = newJoinCode();
    }

    let teamId;
    try {
      const [insert] = await conn.query(
        "INSERT INTO teams (event_id, name, join_code, leader_id) VALUES (?, ?, ?, ?)",
        [event.id, name, joinCode, req.user.id],
      );
      teamId = insert.insertId;
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") throw new HttpError(409, "A team with that name already exists for this event.");
      throw err;
    }
    await conn.query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [teamId, req.user.id]);
    const regId = await saveRegistration(conn, { userId: req.user.id, eventId: event.id, teamId, previous });

    return { team: await teamWithMembers(conn, teamId), registration: await getRegistration(conn, regId) };
  });
  res.status(201).json(result);
});

// POST /api/teams/join  { join_code } — join a team and register for its event.
teamsRouter.post("/teams/join", requireAuth, requireStudent, async (req, res) => {
  const joinCode = requireText(req.body.join_code, "Join code", 10).toUpperCase();

  const result = await transaction(async (conn) => {
    const [[team]] = await conn.query("SELECT * FROM teams WHERE join_code = ?", [joinCode]);
    if (!team) throw new HttpError(404, "No team has that join code.");

    const event = await lockOpenEvent(conn, team.event_id);
    const previous = await findPreviousRegistration(conn, req.user.id, event.id);

    const [[{ size }]] = await conn.query("SELECT COUNT(*) AS size FROM team_members WHERE team_id = ?", [team.id]);
    if (size >= event.team_max) throw new HttpError(409, `This team is full (maximum ${event.team_max} members).`);
    await ensureSeatAvailable(conn, event);

    await conn.query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [team.id, req.user.id]);
    const regId = await saveRegistration(conn, { userId: req.user.id, eventId: event.id, teamId: team.id, previous });

    return { team: await teamWithMembers(conn, team.id), registration: await getRegistration(conn, regId) };
  });
  res.status(201).json(result);
});

// GET /api/teams/:id — team details and member names, for its members and the
// event's organizer.
teamsRouter.get("/teams/:id", requireAuth, async (req, res) => {
  const teamId = idParam(req.params.id);
  const [[row]] = await pool.query(
    `SELECT t.id, e.organizer_id, e.title AS event_title, e.team_min, e.team_max
       FROM teams t JOIN events e ON e.id = t.event_id
      WHERE t.id = ?`,
    [teamId],
  );
  if (!row) throw new HttpError(404, "Team not found.");

  const team = await teamWithMembers(pool, teamId);
  const isMember = team.members.some((m) => m.id === req.user.id);
  if (!isMember && row.organizer_id !== req.user.id) throw new HttpError(403, "Only team members can see this team.");

  res.json({ ...team, event_title: row.event_title, team_min: row.team_min, team_max: row.team_max });
});
