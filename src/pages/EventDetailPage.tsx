import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  Bookmark,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  MapPin,
  Megaphone,
  MessageSquare,
  Navigation,
  Settings,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { createTeam, getEvent, joinTeam, listMyRegistrations, registerSolo } from "../lib/api";
import type { EventRecord, MyRegistration } from "../types";
import {
  bannerHue,
  deadlinePassed,
  formatEventDate,
  formatFee,
  formatTeamSize,
  isTeamEvent,
  timeUntil,
} from "../lib/format";
import { StatusPill } from "../components/StatusPill";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../lib/bookmarks";
import { AddToCalendarButton } from "../components/AddToCalendarButton";
import { downloadTicketImage } from "../lib/ticketExport";
import { EventAnnouncementsTab } from "../components/EventAnnouncementsTab";
import { EventQnATab } from "../components/EventQnATab";
import { CertificateModal } from "../components/CertificateModal";
import { EventWinnersTab } from "../components/EventWinnersTab";
import { TeamHubModal } from "../components/TeamHubModal";
import { EventLocationModal } from "../components/EventLocationModal";

type Tab = "overview" | "announcements" | "qna" | "winners";

const TABS: Array<{ id: Tab; label: string; icon?: React.ElementType }> = [
  { id: "overview", label: "Overview" },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "qna", label: "Q&A", icon: MessageSquare },
  { id: "winners", label: "Winners & Results", icon: Trophy },
];

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [myRegistration, setMyRegistration] = useState<MyRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const refresh = useCallback(async () => {
    if (!id) return;
    const ev = await getEvent(id);
    setEvent(ev);
    if (ev && user?.role === "student") {
      const mine = await listMyRegistrations();
      setMyRegistration(mine.find((r) => r.event_id === ev.id) ?? null);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">Loading event...</div>;
  }
  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-cream/80">Event not found.</p>
        <Link to="/events" className="mt-3 inline-block text-coral">
          Back to events
        </Link>
      </div>
    );
  }

  const teamEvent = isTeamEvent(event);
  const closed = deadlinePassed(event);
  const spotsLeft = Math.max(event.capacity - (event.registered_count ?? 0), 0);
  const isEventOrganizer = user?.id === event.organizer_id;
  const saved = isBookmarked(event.id);
  const hue = bannerHue(event);

  // Runs one registration action, then reloads the event (seat count) and
  // the user's registration. Success is shown right here on the page.
  const runAction = async (action: () => Promise<string>) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const message = await action();
      await refresh();
      setSuccess(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleSoloRegister = () =>
    runAction(async () => {
      await registerSolo(event.id);
      return "You're registered! Your QR ticket is ready below and in My Events.";
    });

  const handleCreateTeam = () => {
    if (!teamName.trim()) return setError("Give your team a name.");
    return runAction(async () => {
      const { team } = await createTeam(event.id, teamName.trim());
      setTeamName("");
      return `Team "${team.name}" created. Share join code ${team.join_code} with your teammates.`;
    });
  };

  const handleJoinTeam = () => {
    if (!joinCodeInput.trim()) return setError("Enter a join code.");
    return runAction(async () => {
      const { team } = await joinTeam(joinCodeInput.trim());
      setJoinCodeInput("");
      return `You joined team "${team.name}". You're registered!`;
    });
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div
        className="relative rounded-2xl p-6 sm:p-8"
        style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 20%), hsl(${hue} 70% 10%))` }}
      >
        <div className="flex items-center justify-between">
          <StatusPill label={event.category} tone="coral" />
          <button
            type="button"
            onClick={() => toggleBookmark(event.id)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-all ${
              saved
                ? "bg-coral text-ink font-semibold shadow-md"
                : "bg-ink/60 text-cream/80 hover:bg-ink/90 hover:text-cream border border-white/10"
            }`}
            title={saved ? "Remove from saved" : "Save event"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save event"}
          </button>
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{event.title}</h1>
        <p className="mt-2 text-sm text-cream/80">
          Hosted by {event.organizer_name}
          {event.organizer_college && ` · ${event.organizer_college}`}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile icon={Building2} label="College" value={event.organizer_college || "—"} />
        <InfoTile
          icon={MapPin}
          label="Venue"
          value={event.venue}
          action={
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-coral/40 bg-coral/10 px-2.5 py-1 text-xs font-semibold text-coral hover:bg-coral/20 transition-colors w-fit"
            >
              <Navigation className="h-3 w-3" /> Map &amp; How Far
            </button>
          }
        />
        <InfoTile icon={CalendarDays} label="When" value={formatEventDate(event.event_date)} />
        <InfoTile icon={Users} label="Participation" value={formatTeamSize(event.team_min, event.team_max)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-none">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === tabId
                    ? tabId === "winners"
                      ? "border-amber-400 text-amber-400"
                      : "border-coral text-coral"
                    : "border-transparent text-muted hover:text-cream"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <section>
              <h2 className="font-display text-xl font-semibold">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-cream/80 leading-relaxed">{event.description}</p>
            </section>
          )}
          {activeTab === "announcements" && <EventAnnouncementsTab eventId={event.id} isOrganizer={isEventOrganizer} />}
          {activeTab === "qna" && <EventQnATab eventId={event.id} isOrganizer={isEventOrganizer} />}
          {activeTab === "winners" && <EventWinnersTab eventId={event.id} isOrganizer={isEventOrganizer} />}
        </div>

        <aside className="w-full rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold">{formatFee(event.fee)}</span>
            {event.fee > 0 && <span className="text-xs text-muted">per person · no online payment</span>}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <Ticket className="h-3.5 w-3.5" />
            {spotsLeft} of {event.capacity} spots left
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Registration {closed ? "closed" : `open · ${timeUntil(event.registration_deadline)}`}
          </div>

          <div className="mt-5 border-t border-border pt-5">
            {success && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {myRegistration ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-medium">You're registered</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={myRegistration.status} tone="success" />
                  {myRegistration.checked_in_at && <StatusPill label="Checked in" tone="success" />}
                </div>

                {myRegistration.team && (
                  <div className="rounded-xl border border-coral/30 bg-coral/5 p-3 text-xs space-y-2">
                    <p className="text-muted">
                      Team <span className="font-semibold text-cream">"{myRegistration.team.name}"</span> · join code
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded-lg border border-coral/40 bg-ink px-3 py-1.5 text-center font-mono text-base font-black tracking-widest text-coral">
                        {myRegistration.team.join_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyJoinCode(myRegistration.team!.join_code)}
                        className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-semibold text-cream hover:border-coral/50"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    downloadTicketImage({
                      event,
                      registrationId: myRegistration.id,
                      attendeeName: user?.name || "Participant",
                      attendeeEmail: user?.email,
                      teamName: myRegistration.team?.name,
                    })
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 py-2.5 text-center text-sm font-semibold text-cream hover:border-coral/50 transition-colors"
                >
                  <Download className="h-4 w-4 text-coral" /> Download Pass (PNG)
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalOpen(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/20 py-2.5 text-center text-sm font-semibold text-amber-300 hover:bg-amber-950/40 transition-colors"
                >
                  <Award className="h-4 w-4 text-amber-400" />
                  {myRegistration.checked_in_at ? "Certificate (demo)" : "Preview certificate (demo)"}
                </button>
                {myRegistration.team && (
                  <button
                    type="button"
                    onClick={() => setTeamModalOpen(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-coral/40 bg-coral/10 py-2.5 text-center text-sm font-bold text-coral hover:bg-coral/20 transition-colors"
                  >
                    <Users className="h-4 w-4" /> My Team
                  </button>
                )}
                <Link to="/dashboard" className="block rounded-xl bg-coral py-2.5 text-center text-sm font-semibold text-ink">
                  View my ticket
                </Link>
              </div>
            ) : user?.role === "organizer" ? (
              <div className="space-y-3 text-sm text-muted">
                <p>Registration is for student accounts.</p>
                {isEventOrganizer && (
                  <Link
                    to={`/organizer/events/${event.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink"
                  >
                    <Settings className="h-4 w-4" /> Manage this event
                  </Link>
                )}
              </div>
            ) : closed ? (
              <p className="text-sm text-muted">Registration for this event has closed.</p>
            ) : spotsLeft === 0 ? (
              <p className="text-sm text-muted">This event is full.</p>
            ) : !teamEvent ? (
              <button
                onClick={handleSoloRegister}
                disabled={busy}
                className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "Registering..." : "Register"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex rounded-xl border border-border p-1 text-xs">
                  <button
                    onClick={() => setMode("create")}
                    className={`flex-1 rounded-lg py-1.5 font-medium ${mode === "create" ? "bg-coral text-ink" : "text-cream/70"}`}
                  >
                    Create team
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className={`flex-1 rounded-lg py-1.5 font-medium ${mode === "join" ? "bg-coral text-ink" : "text-cream/70"}`}
                  >
                    Join with code
                  </button>
                </div>
                <p className="text-[11px] text-muted">
                  Teams of {event.team_min}-{event.team_max}. Every member signs up for their own ShowUp account and
                  joins with the team's code.
                </p>
                {mode === "create" ? (
                  <>
                    <input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name, e.g. NeuralCraft"
                      maxLength={100}
                      className="w-full rounded-xl border border-border bg-ink px-3.5 py-2 text-sm text-cream focus:border-coral focus:outline-none"
                    />
                    <button
                      onClick={handleCreateTeam}
                      disabled={busy}
                      className="w-full rounded-xl bg-coral py-2.5 text-sm font-bold text-ink hover:scale-[1.02] transition-transform disabled:opacity-60 shadow-lg shadow-coral/20"
                    >
                      {busy ? "Creating team..." : "Create team & register"}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 7QX2KP"
                      maxLength={10}
                      className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm uppercase tracking-widest focus:border-coral focus:outline-none"
                    />
                    <button
                      onClick={handleJoinTeam}
                      disabled={busy}
                      className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
                    >
                      {busy ? "Joining..." : "Join team"}
                    </button>
                  </>
                )}
              </div>
            )}

            {!myRegistration && (
              <button
                type="button"
                onClick={() => setCertModalOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/15 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/30 transition-colors"
              >
                <Award className="h-3.5 w-3.5 text-amber-400" />
                Preview participation certificate (demo)
              </button>
            )}
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            <div className="mt-4 border-t border-border pt-4">
              <AddToCalendarButton event={event} className="w-full flex justify-center" />
            </div>
          </div>
        </aside>
      </div>

      <CertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        event={event}
        attendeeName={user?.name || "Participant"}
        attendeeCollege={user?.college || undefined}
        registrationId={myRegistration?.id}
        checkedIn={!!myRegistration?.checked_in_at}
      />

      {myRegistration?.team_id && (
        <TeamHubModal
          isOpen={teamModalOpen}
          onClose={() => setTeamModalOpen(false)}
          teamId={myRegistration.team_id}
          currentUserId={user?.id}
        />
      )}

      <EventLocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} event={event} />
    </div>
  );
};

const InfoTile: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, label, value, action }) => (
  <div className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="h-3.5 w-3.5 text-coral" /> {label}
      </div>
      <p className="mt-1 text-sm font-medium text-cream">{value}</p>
    </div>
    {action}
  </div>
);
