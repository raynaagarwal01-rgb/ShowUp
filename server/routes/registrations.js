import { Router } from "express";
import { query, tx } from "../db.js";
import { requireAuth } from "../auth.js";
import { mapEvent, mapProfile, mapRegistration } from "../mappers.js";
import { getVisibleEvent, loadTeam, loadTeams, seatStats } from "../queries.js";
import {
  badRequest,
  conflict,
  forbidden,
  isDuplicateKey,
  joinCode,
  newId,
  normalizeEmail,
  notFound,
  optionalString,
  requireString,
} from "../util.js";

export const registrationsRouter = Router();

/** Insert a registration, or — since a person has at most one registration per
 * event — replace their previous one (this is what the app always did). The
 * existing row id is kept so an already-issued QR ticket stays valid. */
export async function upsertRegistration(conn, { eventId, userId, teamId, status }) {
  await query(
    `INSERT INTO registrations (id, event_id, user_id, team_id, status, checked_in_at, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, UTC_TIMESTAMP(3)) AS incoming
     ON DUPLICATE KEY UPDATE
       team_id = incoming.team_id, status = incoming.status,
       checked_in_at = NULL, created_at = incoming.created_at`,
    [newId("reg"), eventId, userId, teamId, status],
    conn,
  );
  const [row] = await query(
    "SELECT * FROM registrations WHERE event_id = ? AND user_id = ?",
    [eventId, userId],
    conn,
  );
  return row;
}

// --- Read paths --------------------------------------------------------------

registrationsRouter.get("/events/:id/my-registration", requireAuth, async (req, res) => {
  const [row] = await query(
    "SELECT * FROM registrations WHERE event_id = ? AND user_id = ? AND status <> 'cancelled'",
    [req.params.id, req.user.id],
  );
  res.json(row ? mapRegistration(row) : null);
});

/** Registrations of `userId`, each with its event (and team). You can read your
 * own; an organizer additionally sees other people's registrations for events
 * they created — the same rule the old row-level-security policy expressed. */
export async function registrationsWithEvents(userId, viewerId) {
  const rows = await query(
    `SELECT r.* FROM registrations r
       JOIN events e ON e.id = r.event_id
      WHERE r.user_id = ? AND r.status <> 'cancelled'
        AND (r.user_id = ? OR e.created_by = ?)
      ORDER BY r.created_at DESC`,
    [userId, viewerId, viewerId],
  );
  if (!rows.length) return [];
  const events = await query("SELECT * FROM events WHERE id IN (?)", [[...new Set(rows.map((r) => r.event_id))]]);
  const eventById = new Map(events.map((e) => [e.id, mapEvent(e)]));
  const teams = await loadTeams(rows.map((r) => r.team_id));
  return rows.map((r) => ({
    ...mapRegistration(r),
    event: eventById.get(r.event_id),
    team: r.team_id ? teams.get(r.team_id) : undefined,
  }));
}

registrationsRouter.get("/users/:id/registrations", requireAuth, async (req, res) => {
  res.json(await registrationsWithEvents(req.params.id, req.user.id));
});

registrationsRouter.get("/events/:id/registrants", requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT r.*,
            p.id AS p_id, p.email AS p_email, p.name AS p_name, p.role AS p_role, p.state AS p_state,
            p.city AS p_city, p.college AS p_college, p.branch AS p_branch, p.year AS p_year,
            p.phone AS p_phone, p.reg_no AS p_reg_no, p.bio AS p_bio, p.github AS p_github,
            p.linkedin AS p_linkedin
       FROM registrations r
       JOIN events e   ON e.id = r.event_id
       JOIN profiles p ON p.id = r.user_id
       LEFT JOIN teams t ON t.id = r.team_id
      WHERE r.event_id = ? AND r.status <> 'cancelled'
        AND (e.created_by = ? OR r.user_id = ?)
      ORDER BY r.created_at ASC, (t.created_by = r.user_id) DESC, r.user_id ASC`,
    [req.params.id, req.user.id, req.user.id],
  );
  const teams = await loadTeams(rows.map((r) => r.team_id));
  res.json(
    rows.map((r) => ({
      ...mapRegistration(r),
      profile: mapProfile({
        id: r.p_id,
        email: r.p_email,
        name: r.p_name,
        role: r.p_role,
        state: r.p_state,
        city: r.p_city,
        college: r.p_college,
        branch: r.p_branch,
        year: r.p_year,
        phone: r.p_phone,
        reg_no: r.p_reg_no,
        bio: r.p_bio,
        github: r.p_github,
        linkedin: r.p_linkedin,
      }),
      team: r.team_id ? teams.get(r.team_id) : undefined,
    })),
  );
});

// --- Registering ---------------------------------------------------------------

registrationsRouter.post("/events/:id/register", requireAuth, async (req, res) => {
  const registration = await tx(async (conn) => {
    // Locking the event row serialises concurrent sign-ups for the same event,
    // so the seat count we read below can't change under us.
    const event = await getVisibleEvent(req.params.id, req.user, conn, { lock: true });

    const [existing] = await query(
      "SELECT * FROM registrations WHERE event_id = ? AND user_id = ? FOR UPDATE",
      [event.id, req.user.id],
      conn,
    );
    if (existing && existing.status !== "cancelled") return existing;

    const stats = await seatStats(event.id, conn, event.capacity);
    return upsertRegistration(conn, {
      eventId: event.id,
      userId: req.user.id,
      teamId: null,
      status: stats.full ? "waitlisted" : "confirmed",
    });
  });
  res.status(201).json(mapRegistration(registration));
});

/** Find a teammate's account by email, or create a placeholder for them. A
 * placeholder has no password, so it can't be signed into — the person claims
 * it later through "Forgot password", which proves they own the email. */
async function findOrCreateTeammate(conn, t) {
  const email = t.email.trim().toLowerCase();
  const [existing] = await query("SELECT id FROM profiles WHERE email = ?", [email], conn);
  if (existing) return existing.id;

  const id = newId();
  await query(
    `INSERT INTO profiles (id, email, password_hash, name, role, phone, college, reg_no, branch)
     VALUES (?, ?, NULL, ?, 'student', ?, ?, ?, ?)`,
    [
      id,
      email,
      t.name.trim().slice(0, 255),
      optionalString(t.phone, 50),
      optionalString(t.college, 255) ?? "VIT Vellore",
      optionalString(t.reg_no, 50),
      optionalString(t.branch, 255) ?? "Engineering",
    ],
    conn,
  );
  return id;
}

registrationsRouter.post("/events/:id/teams", requireAuth, async (req, res) => {
  const teamName = requireString(req.body.teamName, "Team name", 255);
  const projectIdea = optionalString(req.body.projectIdea, 5000);
  const teammates = Array.isArray(req.body.teammates) ? req.body.teammates.slice(0, 50) : [];

  const { teamId, registration } = await tx(async (conn) => {
    const event = await getVisibleEvent(req.params.id, req.user, conn, { lock: true });
    const stats = await seatStats(event.id, conn, event.capacity);
    const status = stats.full ? "waitlisted" : "confirmed";

    // Insert the team, retrying with a fresh join code if one collides.
    const teamId = newId("team");
    for (let attempt = 0; ; attempt++) {
      try {
        await query(
          "INSERT INTO teams (id, event_id, name, join_code, project_idea, created_by) VALUES (?, ?, ?, ?, ?, ?)",
          [teamId, event.id, teamName, joinCode(), projectIdea, req.user.id],
          conn,
        );
        break;
      } catch (err) {
        if (!isDuplicateKey(err) || attempt >= 5) throw err;
      }
    }

    const memberIds = [req.user.id];
    for (const t of teammates) {
      if (!t?.name?.trim() || !t?.email?.trim()) continue;
      let memberId;
      try {
        normalizeEmail(t.email);
        memberId = await findOrCreateTeammate(conn, t);
      } catch (err) {
        if (err.status === 400) throw badRequest(`"${t.email}" is not a valid email address.`);
        throw err;
      }
      if (!memberIds.includes(memberId)) memberIds.push(memberId);
    }

    let leaderRegistration;
    for (const userId of memberIds) {
      await query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [teamId, userId], conn);
      const reg = await upsertRegistration(conn, { eventId: event.id, userId, teamId, status });
      if (userId === req.user.id) leaderRegistration = reg;
    }
    return { teamId, registration: leaderRegistration };
  });

  res.status(201).json({ team: await loadTeam(teamId), registration: mapRegistration(registration) });
});

registrationsRouter.post("/events/:id/teams/join", requireAuth, async (req, res) => {
  const code = String(req.body.code ?? "").trim().toUpperCase();

  const { teamId, registration } = await tx(async (conn) => {
    const event = await getVisibleEvent(req.params.id, req.user, conn);
    const [team] = await query(
      "SELECT * FROM teams WHERE event_id = ? AND join_code = ? FOR UPDATE",
      [event.id, code],
      conn,
    );
    if (!team) throw notFound("No team found with that join code for this event.");

    const members = await query("SELECT user_id FROM team_members WHERE team_id = ?", [team.id], conn);
    if (members.some((m) => m.user_id === req.user.id)) throw conflict("You're already on this team.");
    if (members.length >= event.team_max) throw conflict("This team is already full.");

    await query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [team.id, req.user.id], conn);
    const reg = await upsertRegistration(conn, {
      eventId: event.id,
      userId: req.user.id,
      teamId: team.id,
      status: "confirmed",
    });
    return { teamId: team.id, registration: reg };
  });

  res.status(201).json({ team: await loadTeam(teamId), registration: mapRegistration(registration) });
});

// --- Cancelling, waitlist promotion, check-in ------------------------------------

registrationsRouter.post("/registrations/:id/cancel", requireAuth, async (req, res) => {
  await tx(async (conn) => {
    const [reg] = await query(
      `SELECT r.*, e.created_by AS event_owner, e.capacity
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE r.id = ? FOR UPDATE`,
      [req.params.id],
      conn,
    );
    if (!reg) throw notFound("Registration not found.");
    if (reg.user_id !== req.user.id && reg.event_owner !== req.user.id) {
      throw forbidden("You can only cancel your own registration.");
    }
    if (reg.status === "cancelled") return;

    await query("UPDATE registrations SET status = 'cancelled' WHERE id = ?", [reg.id], conn);

    // Only a freed *confirmed* seat can be handed to the waitlist. Promote in
    // sign-up order while there's room.
    if (reg.status === "confirmed") {
      await query("SELECT id FROM events WHERE id = ? FOR UPDATE", [reg.event_id], conn);
      const stats = await seatStats(reg.event_id, conn, reg.capacity);
      const room = reg.capacity - stats.confirmed;
      if (room > 0) {
        await query(
          `UPDATE registrations SET status = 'confirmed'
            WHERE id IN (SELECT id FROM (
              SELECT id FROM registrations
               WHERE event_id = ? AND status = 'waitlisted'
               ORDER BY created_at ASC LIMIT ?) AS next_up)`,
          [reg.event_id, room],
          conn,
        );
      }
    }
  });
  res.json({ ok: true });
});

registrationsRouter.post("/registrations/:id/check-in", requireAuth, async (req, res) => {
  const [reg] = await query(
    `SELECT r.id, e.created_by AS event_owner
       FROM registrations r JOIN events e ON e.id = r.event_id
      WHERE r.id = ?`,
    [req.params.id],
  );
  if (!reg) throw notFound("Registration not found.");
  if (reg.event_owner !== req.user.id) throw forbidden("Only the event's organizer can check people in.");

  await query("UPDATE registrations SET checked_in_at = UTC_TIMESTAMP(3) WHERE id = ?", [reg.id]);
  const [row] = await query("SELECT * FROM registrations WHERE id = ?", [reg.id]);
  res.json(mapRegistration(row));
});
