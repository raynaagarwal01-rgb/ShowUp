import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { mapEvent, mapProfile } from "../mappers.js";
import { loadTeam } from "../queries.js";
import { badRequest, forbidden, notFound } from "../util.js";

export const teamsRouter = Router();

async function requireTeam(id) {
  const team = await loadTeam(id);
  if (!team) throw notFound("Team not found.");
  return team;
}

teamsRouter.get("/teams/:id", requireAuth, async (req, res) => {
  const team = await requireTeam(req.params.id);
  const [event] = await query("SELECT * FROM events WHERE id = ?", [team.event_id]);
  if (!event) throw notFound("Event not found.");

  const rows = await query(
    `SELECT p.* FROM team_members tm JOIN profiles p ON p.id = tm.user_id
      WHERE tm.team_id = ? ORDER BY tm.joined_at ASC`,
    [team.id],
  );
  const members = rows.map(mapProfile);
  members.sort((a, b) => (a.id === team.leader_id ? -1 : b.id === team.leader_id ? 1 : 0));

  res.json({ team, members, event: mapEvent(event) });
});

// The project pitch can be edited by the team's leader or any member.
teamsRouter.patch("/teams/:id", requireAuth, async (req, res) => {
  const team = await requireTeam(req.params.id);
  if (!team.member_ids.includes(req.user.id) && team.created_by !== req.user.id) {
    throw forbidden("Only members of this team can edit it.");
  }
  if (typeof req.body.project_idea !== "string") throw badRequest("project_idea is required.");
  await query("UPDATE teams SET project_idea = ? WHERE id = ?", [req.body.project_idea.trim().slice(0, 5000), team.id]);
  res.json(await requireTeam(team.id));
});

// The leader can remove anyone else; any member can remove themselves (leave).
teamsRouter.delete("/teams/:id/members/:userId", requireAuth, async (req, res) => {
  const team = await requireTeam(req.params.id);
  const targetId = req.params.userId;
  if (targetId === team.created_by) throw badRequest("The team leader can't be removed from their own team.");
  if (team.created_by !== req.user.id && targetId !== req.user.id) {
    throw forbidden("Only the team leader can remove other members.");
  }
  await query("DELETE FROM team_members WHERE team_id = ? AND user_id = ?", [team.id, targetId]);
  res.json({ ok: true });
});
