import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  QrCode,
  Search,
  Users,
  Lightbulb,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  UserCheck,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { deleteEvent, getEvent, listEventRegistrants } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { EventRecord, RegistrantView, Team } from "../../types";
import { StatusPill, registrationTone } from "../../components/StatusPill";

function downloadCsv(eventTitle: string, rows: RegistrantView[]) {
  const header = [
    "Ticket ID",
    "Full Name",
    "Email Address",
    "Phone Number",
    "College",
    "State",
    "City",
    "Branch / Dept",
    "Academic Year",
    "Team Name",
    "Team Code",
    "Team Project Idea / Pitch",
    "Registration Status",
    "Registered At",
    "Attendance / Check-In",
    "Check-In Time",
  ];

  const lines = rows.map((r) =>
    [
      r.id,
      r.profile.name || "N/A",
      r.profile.email || "N/A",
      r.profile.phone || "N/A",
      r.profile.college || "N/A",
      r.profile.state || "",
      r.profile.city || "",
      r.profile.branch || "",
      r.profile.year || "",
      r.team?.name || "Solo",
      r.team?.join_code || "-",
      r.team?.project_idea || "N/A",
      r.status.toUpperCase(),
      r.created_at ? new Date(r.created_at).toLocaleString("en-IN") : "",
      r.checked_in_at ? "CHECKED IN" : "PENDING",
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString("en-IN") : "-",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeTitle = eventTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `${safeTitle}_attendees_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface TeamGroup {
  team: Team | null;
  members: RegistrantView[];
}

export const EventRegistrantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [registrants, setRegistrants] = useState<RegistrantView[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"teams" | "table">("teams");

  const handleDeleteEvent = async () => {
    if (!event || !id) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${event.title}"?\n\nThis will remove the event, registrations, teams, and tickets permanently.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteEvent(id, user?.id);
      navigate("/organizer");
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event.");
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getEvent(id), listEventRegistrants(id)]).then(([ev, regs]) => {
      setEvent(ev);
      setRegistrants(regs);
      setLoading(false);
    });
  }, [id]);

  // Filter registrants
  const filteredRegistrants = useMemo(() => {
    if (!searchQuery.trim()) return registrants;
    const q = searchQuery.toLowerCase();
    return registrants.filter((r) => {
      const name = r.profile.name?.toLowerCase() || "";
      const email = r.profile.email?.toLowerCase() || "";
      const college = r.profile.college?.toLowerCase() || "";
      const teamName = r.team?.name?.toLowerCase() || "";
      const idea = r.team?.project_idea?.toLowerCase() || "";
      return (
        name.includes(q) ||
        email.includes(q) ||
        college.includes(q) ||
        teamName.includes(q) ||
        idea.includes(q)
      );
    });
  }, [registrants, searchQuery]);

  // Group by team
  const teamGroups = useMemo(() => {
    const map = new Map<string, TeamGroup>();
    const soloMembers: RegistrantView[] = [];

    filteredRegistrants.forEach((r) => {
      if (r.team) {
        if (!map.has(r.team.id)) {
          map.set(r.team.id, { team: r.team, members: [] });
        }
        map.get(r.team.id)!.members.push(r);
      } else {
        soloMembers.push(r);
      }
    });

    const list = Array.from(map.values());
    if (soloMembers.length > 0) {
      list.push({ team: null, members: soloMembers });
    }
    return list;
  }, [filteredRegistrants]);

  if (loading) return <div className="px-6 py-16 text-center text-muted">Loading participants...</div>;
  if (!event) return <div className="px-6 py-16 text-center text-cream/80">Event not found.</div>;

  const totalRegistrations = registrants.length;
  const confirmed = registrants.filter((r) => r.status === "confirmed").length;
  const waitlisted = registrants.filter((r) => r.status === "waitlisted").length;
  const checkedIn = registrants.filter((r) => r.checked_in_at).length;
  const teamsCount = new Set(registrants.map((r) => r.team_id).filter(Boolean)).size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-6">
      <Link to="/organizer" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-cream transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Organizer Studio
      </Link>

      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 border border-coral/30 px-2.5 py-0.5 text-xs font-semibold text-coral">
            {event.category}
          </span>
          <h1 className="font-display text-2xl font-bold text-cream sm:text-3xl">{event.title}</h1>
          <p className="text-xs text-muted">
            Organizer Attendance &amp; Team Pitch Dashboard · {event.venue}, {event.college}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/organizer/events/${event.id}/checkin`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
          >
            <QrCode className="h-4 w-4 text-coral" /> Check-in
          </Link>
          <Link
            to={`/organizer/events/${event.id}/edit`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
          >
            <Pencil className="h-4 w-4 text-muted" /> Edit
          </Link>
          <button
            onClick={() => downloadCsv(event.title, registrants)}
            className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2.5 text-xs font-bold text-ink hover:scale-[1.02] transition-transform shadow-md"
          >
            <Download className="h-4 w-4" /> Export OD &amp; Teams (CSV)
          </button>
          <button
            type="button"
            onClick={handleDeleteEvent}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-colors disabled:opacity-50"
            title="Delete this event"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
            <span>{deleting ? "Deleting..." : "Delete Event"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Participants</span>
            <Users className="h-4 w-4 text-coral" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-cream">{totalRegistrations}</div>
          <p className="mt-0.5 text-[11px] text-muted">Capacity: {event.capacity} seats</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Confirmed Attendees</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-emerald-400">{confirmed}</div>
          <p className="mt-0.5 text-[11px] text-muted">{waitlisted} on waitlist</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Teams Formed</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-amber-400">{teamsCount}</div>
          <p className="mt-0.5 text-[11px] text-muted">{event.team_min}-{event.team_max} members/team</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Checked In at Door</span>
            <UserCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-sky-400">{checkedIn}</div>
          <p className="mt-0.5 text-[11px] text-muted">
            {totalRegistrations > 0 ? Math.round((checkedIn / totalRegistrations) * 100) : 0}% turn-out
          </p>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/80 pt-4">
        {/* Toggle between Teams view and Table view */}
        <div className="flex rounded-xl border border-border bg-surface-2 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveView("teams")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
              activeView === "teams" ? "bg-coral text-ink shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> By Teams &amp; Project Ideas ({teamGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("table")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
              activeView === "table" ? "bg-coral text-ink shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            All Registrants Table ({filteredRegistrants.length})
          </button>
        </div>

        {/* Live Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, team, or idea..."
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-cream placeholder:text-muted focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: BY TEAMS & PROJECT IDEAS */}
      {activeView === "teams" && (
        <div className="space-y-4">
          {teamGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
              No matching teams or participants found.
            </div>
          ) : (
            teamGroups.map((group, idx) => {
              const isTeam = !!group.team;
              const teamTitle = group.team?.name || "Solo Participants";
              const teamIdea = group.team?.project_idea;
              const joinCode = group.team?.join_code;

              return (
                <div
                  key={group.team?.id || `solo-${idx}`}
                  className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm hover:border-coral/40 transition-colors"
                >
                  {/* Team Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-display text-lg font-bold text-cream">{teamTitle}</span>
                        {joinCode && (
                          <span className="font-mono rounded-lg border border-coral/30 bg-coral/10 px-2 py-0.5 text-[11px] font-bold text-coral">
                            Code: {joinCode}
                          </span>
                        )}
                        <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] text-muted">
                          {group.members.length} {group.members.length === 1 ? "member" : "members"}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {isTeam ? `Registered Team for ${event.title}` : "Individual Participants"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        Check-ins: {group.members.filter((m) => m.checked_in_at).length}/{group.members.length}
                      </span>
                    </div>
                  </div>

                  {/* Team Project Idea / Pitch Section */}
                  {isTeam && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                        <span>Team Project Idea / Problem Statement</span>
                      </div>
                      <p className="text-xs leading-relaxed text-cream/90 pl-5">
                        {teamIdea ? (
                          teamIdea
                        ) : (
                          <span className="italic text-muted">
                            No project idea or problem statement submitted by this team yet.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Team Members List */}
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-muted">
                      Team Roster &amp; Student Details
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/60 p-3 text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-cream truncate">
                                {member.profile.name}
                              </span>
                              {group.team?.created_by === member.user_id && (
                                <span className="rounded-md bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                  Lead
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted text-[11px]">
                              <Mail className="h-3 w-3 text-coral/80" />
                              <span className="truncate">{member.profile.email}</span>
                            </div>
                            {member.profile.phone && (
                              <div className="flex items-center gap-1.5 text-muted text-[11px]">
                                <Phone className="h-3 w-3 text-coral/80" />
                                <span>{member.profile.phone}</span>
                              </div>
                            )}
                            {member.profile.college && (
                              <div className="flex items-center gap-1.5 text-muted/80 text-[10px]">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{member.profile.college}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <StatusPill label={member.status} tone={registrationTone(member.status)} />
                            {member.checked_in_at ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-3 w-3" /> In
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted">Pending</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: ALL REGISTRANTS TABLE VIEW */}
      {activeView === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3">Participant Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">College &amp; Dept</th>
                <th className="px-4 py-3">Team Name</th>
                <th className="px-4 py-3">Team Project Idea</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No matching participants found.
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-cream">
                      {r.profile.name}
                    </td>
                    <td className="px-4 py-3 text-muted space-y-0.5">
                      <div>{r.profile.email}</div>
                      {r.profile.phone && <div className="text-[11px] text-cream/60">{r.profile.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div>{r.profile.college || "—"}</div>
                      {r.profile.branch && <div className="text-[11px] text-muted/70">{r.profile.branch}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {r.team ? (
                        <div>
                          <span className="font-semibold text-cream">{r.team.name}</span>
                          <span className="block font-mono text-[10px] text-coral">Code: {r.team.join_code}</span>
                        </div>
                      ) : (
                        <span className="text-muted">Solo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {r.team?.project_idea ? (
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-300">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{r.team.project_idea}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill label={r.status} tone={registrationTone(r.status)} />
                    </td>
                    <td className="px-4 py-3">
                      {r.checked_in_at ? (
                        <StatusPill label="Checked in" tone="success" />
                      ) : (
                        <span className="text-muted text-[11px]">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
