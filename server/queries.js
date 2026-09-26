// Shared lookups used by more than one route file.
import { query } from "./db.js";
import { mapTeam } from "./mappers.js";
import { notFound } from "./util.js";

/** Fetch an event the caller is allowed to see: published, or their own draft. */
export async function getVisibleEvent(id, user, conn, { lock = false } = {}) {
  const rows = await query(
    `SELECT * FROM events WHERE id = ?${lock ? " FOR UPDATE" : ""}`,
    [id],
    conn,
  );
  const event = rows[0];
  if (!event || (event.status !== "published" && event.created_by !== user?.id)) {
    throw notFound("Event not found.");
  }
  return event;
}

/** Current confirmed/waitlisted counts for an event. Pass a transaction
 * connection (with the event row already locked) for race-free registration. */
export async function seatStats(eventId, conn, capacity) {
  let cap = capacity;
  if (cap === undefined) {
    const rows = await query("SELECT capacity FROM events WHERE id = ?", [eventId], conn);
    if (!rows.length) return { confirmed: 0, waitlisted: 0, capacity: 0, full: true };
    cap = rows[0].capacity;
  }
  const rows = await query(
    `SELECT status, COUNT(*) AS n FROM registrations
      WHERE event_id = ? AND status IN ('confirmed', 'waitlisted')
      GROUP BY status`,
    [eventId],
    conn,
  );
  const count = (status) => Number(rows.find((r) => r.status === status)?.n ?? 0);
  const confirmed = count("confirmed");
  return { confirmed, waitlisted: count("waitlisted"), capacity: cap, full: confirmed >= cap };
}

/** Load teams (with member ids, leader first) keyed by team id. */
export async function loadTeams(teamIds, conn) {
  const ids = [...new Set(teamIds.filter(Boolean))];
  const map = new Map();
  if (!ids.length) return map;

  const teams = await query("SELECT * FROM teams WHERE id IN (?)", [ids], conn);
  const members = await query(
    "SELECT team_id, user_id FROM team_members WHERE team_id IN (?) ORDER BY joined_at ASC, user_id ASC",
    [ids],
    conn,
  );
  for (const team of teams) {
    const memberIds = members.filter((m) => m.team_id === team.id).map((m) => m.user_id);
    // The leader always sorts first, whatever the join timestamps say.
    memberIds.sort((a, b) => (a === team.created_by ? -1 : b === team.created_by ? 1 : 0));
    map.set(team.id, mapTeam(team, memberIds));
  }
  return map;
}

export async function loadTeam(teamId, conn) {
  return (await loadTeams([teamId], conn)).get(teamId) ?? null;
}
