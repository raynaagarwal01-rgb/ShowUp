import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  Hash,
  Mail,
  Pencil,
  QrCode,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { deleteEvent, getEvent, listParticipants } from "../../lib/api";
import type { EventRecord, Participant } from "../../types";
import { StatusPill, registrationTone } from "../../components/StatusPill";
import { ticketCode } from "../../lib/format";

function downloadCsv(eventTitle: string, rows: Participant[]) {
  const header = ["Ticket", "Name", "Email", "College", "Reg No", "Team", "Team Code", "Status", "Registered At", "Checked In At"];
  const lines = rows.map((r) =>
    [
      ticketCode(r.id),
      r.name,
      r.email,
      r.college || "",
      r.reg_no || "",
      r.team_name || "Solo",
      r.join_code || "-",
      r.status.toUpperCase(),
      new Date(r.registered_at).toLocaleString("en-IN"),
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
  link.download = `${eventTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_participants_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface TeamGroup {
  teamId: number | null;
  teamName: string | null;
  joinCode: string | null;
  leaderId: number | null;
  members: Participant[];
}

export const EventRegistrantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = Number(id);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [registrants, setRegistrants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"teams" | "table">("teams");

  const handleDeleteEvent = async () => {
    if (!event) return;
    const confirmed = window.confirm(
      `Permanently delete "${event.title}"?\n\nAll registrations, teams, announcements, questions and winners for it are deleted too.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteEvent(event.id);
      navigate("/organizer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
      setDeleting(false);
    }
  };

  useEffect(() => {
    Promise.all([getEvent(eventId), listParticipants(eventId)])
      .then(([ev, regs]) => {
        setEvent(ev);
        setRegistrants(regs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load participants."))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Filter registrants
  const filteredRegistrants = useMemo(() => {
    if (!searchQuery.trim()) return registrants;
    const q = searchQuery.toLowerCase();
    return registrants.filter((r) =>
      [r.name, r.email, r.college, r.reg_no, r.team_name].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [registrants, searchQuery]);

  // Group by team
  const teamGroups = useMemo(() => {
    const map = new Map<number, TeamGroup>();
    const soloMembers: Participant[] = [];

    filteredRegistrants.forEach((r) => {
      if (r.team_id) {
        if (!map.has(r.team_id)) {
          map.set(r.team_id, { teamId: r.team_id, teamName: r.team_name, joinCode: r.join_code, leaderId: r.leader_id, members: [] });
        }
        map.get(r.team_id)!.members.push(r);
      } else {
        soloMembers.push(r);
      }
    });

    const list = Array.from(map.values());
    if (soloMembers.length > 0) {
      list.push({ teamId: null, teamName: null, joinCode: null, leaderId: null, members: soloMembers });
    }
    return list;
  }, [filteredRegistrants]);

  if (loading) return <div className="px-6 py-16 text-center text-muted">Loading participants...</div>;
  if (!event) return <div className="px-6 py-16 text-center text-cream/80">{error || "Event not found."}</div>;

  const totalRegistrations = registrants.length;
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
            Participants &amp; attendance · {event.venue}
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
            <Download className="h-4 w-4" /> Export participants (CSV)
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

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Confirmed participants" value={totalRegistrations} note={`Capacity: ${event.capacity}`} icon={Users} color="text-cream" />
        <Kpi label="Spots left" value={Math.max(event.capacity - totalRegistrations, 0)} note="Counted per person" icon={CheckCircle2} color="text-emerald-400" />
        <Kpi label="Teams formed" value={teamsCount} note={`${event.team_min}-${event.team_max} members/team`} icon={Sparkles} color="text-amber-400" />
        <Kpi
          label="Checked in"
          value={checkedIn}
          note={`${totalRegistrations > 0 ? Math.round((checkedIn / totalRegistrations) * 100) : 0}% turn-out`}
          icon={UserCheck}
          color="text-sky-400"
        />
      </div>

      {/* View switcher & search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/80 pt-4">
        <div className="flex rounded-xl border border-border bg-surface-2 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveView("teams")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
              activeView === "teams" ? "bg-coral text-ink shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> By team ({teamGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView("table")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
              activeView === "table" ? "bg-coral text-ink shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            All participants ({filteredRegistrants.length})
          </button>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, team..."
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-cream placeholder:text-muted focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      {activeView === "teams" && (
        <div className="space-y-4">
          {teamGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
              No matching participants found.
            </div>
          ) : (
            teamGroups.map((group) => {
              const incomplete = group.teamId !== null && group.members.length < event.team_min;
              return (
                <div
                  key={group.teamId ?? "solo"}
                  className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm hover:border-coral/40 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-display text-lg font-bold text-cream">{group.teamName ?? "Solo participants"}</span>
                      {group.joinCode && (
                        <span className="font-mono rounded-lg border border-coral/30 bg-coral/10 px-2 py-0.5 text-[11px] font-bold text-coral">
                          Code: {group.joinCode}
                        </span>
                      )}
                      <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] text-muted">
                        {group.members.length} {group.members.length === 1 ? "member" : "members"}
                      </span>
                      {incomplete && <StatusPill label={`Needs ${event.team_min - group.members.length} more`} tone="warning" />}
                    </div>
                    <span className="text-xs text-muted">
                      Check-ins: {group.members.filter((m) => m.checked_in_at).length}/{group.members.length}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/60 p-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-cream truncate">{member.name}</span>
                            {group.leaderId === member.user_id && (
                              <span className="rounded-md bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                Lead
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted text-[11px]">
                            <Mail className="h-3 w-3 text-coral/80" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.reg_no && (
                            <div className="flex items-center gap-1.5 text-muted text-[11px]">
                              <Hash className="h-3 w-3 text-coral/80" />
                              <span>{member.reg_no}</span>
                            </div>
                          )}
                          {member.college && (
                            <div className="flex items-center gap-1.5 text-muted/80 text-[10px]">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{member.college}</span>
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
              );
            })
          )}
        </div>
      )}

      {activeView === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted border-b border-border">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">College &amp; Reg No</th>
                <th className="px-4 py-3">Team</th>
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
                    <td className="px-4 py-3 font-mono text-muted">#{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-cream">{r.name}</td>
                    <td className="px-4 py-3 text-muted">{r.email}</td>
                    <td className="px-4 py-3 text-muted">
                      <div>{r.college || "—"}</div>
                      {r.reg_no && <div className="text-[11px] text-muted/70">{r.reg_no}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {r.team_name ? (
                        <div>
                          <span className="font-semibold text-cream">{r.team_name}</span>
                          <span className="block font-mono text-[10px] text-coral">Code: {r.join_code}</span>
                        </div>
                      ) : (
                        <span className="text-muted">Solo</span>
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

const Kpi: React.FC<{ label: string; value: number; note: string; icon: React.ElementType; color: string }> = ({
  label,
  value,
  note,
  icon: Icon,
  color,
}) => (
  <div className="rounded-2xl border border-border bg-surface p-4">
    <div className="flex items-center justify-between text-muted text-xs">
      <span>{label}</span>
      <Icon className={`h-4 w-4 ${color === "text-cream" ? "text-coral" : color}`} />
    </div>
    <div className={`mt-2 font-display text-2xl font-bold ${color}`}>{value}</div>
    <p className="mt-0.5 text-[11px] text-muted">{note}</p>
  </div>
);
