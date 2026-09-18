import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, CalendarDays, MapPin, Ticket, Users, CheckCircle2, Clock, Bookmark, Download } from "lucide-react";
import {
  createTeam,
  getEvent,
  getMyRegistrationForEvent,
  getSeatStats,
  joinTeam,
  registerSolo,
  type SeatStats,
} from "../lib/db";
import type { EventRecord, Registration } from "../types";
import { formatDateRange, formatFee, formatTeamSize, timeUntil } from "../lib/format";
import { StatusPill, registrationTone } from "../components/StatusPill";
import { useAuth } from "../context/AuthContext";
import { isOnboardingComplete } from "../lib/profile";
import { notifyRegistrationConfirmed, type NotificationOutcome } from "../lib/notifications";
import { useBookmarks } from "../lib/bookmarks";
import { AddToCalendarButton } from "../components/AddToCalendarButton";
import { downloadTicketImage } from "../lib/ticketExport";
import { PaymentModal } from "../components/PaymentModal";

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [seats, setSeats] = useState<SeatStats | null>(null);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NotificationOutcome | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"solo" | "team_create" | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    const [ev, st] = await Promise.all([getEvent(id), getSeatStats(id)]);
    setEvent(ev);
    setSeats(st);
    if (user) {
      const reg = await getMyRegistrationForEvent(id, user.id);
      setMyRegistration(reg);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    refresh();
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

  const isTeamEvent = event.team_max > 1;
  const deadlinePassed = new Date(event.registration_deadline).getTime() < Date.now();

  const requireOnboardedUser = (): typeof user => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return null;
    }
    if (!isOnboardingComplete(user)) {
      navigate(`/onboarding?next=${encodeURIComponent(`/events/${event.id}`)}`);
      return null;
    }
    return user;
  };

  const executeSoloRegister = async (currentUser: typeof user) => {
    if (!currentUser || !event) return;
    setBusy(true);
    setError(null);
    try {
      const registration = await registerSolo(event.id, currentUser.id);
      await refresh();
      notifyRegistrationConfirmed(event, currentUser, registration).then(setNotice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not register.");
    } finally {
      setBusy(false);
    }
  };

  const executeCreateTeam = async (currentUser: typeof user) => {
    if (!currentUser || !event) return;
    setBusy(true);
    setError(null);
    try {
      const { registration } = await createTeam(event.id, currentUser.id, teamName.trim());
      await refresh();
      notifyRegistrationConfirmed(event, currentUser, registration).then(setNotice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create team.");
    } finally {
      setBusy(false);
    }
  };

  const handleSoloRegister = async () => {
    const currentUser = requireOnboardedUser();
    if (!currentUser || !event) return;
    if (event.fee > 0) {
      setPendingAction("solo");
      setPaymentModalOpen(true);
      return;
    }
    await executeSoloRegister(currentUser);
  };

  const handleCreateTeam = async () => {
    const currentUser = requireOnboardedUser();
    if (!currentUser || !event) return;
    if (!teamName.trim()) return setError("Give your team a name.");
    if (event.fee > 0) {
      setPendingAction("team_create");
      setPaymentModalOpen(true);
      return;
    }
    await executeCreateTeam(currentUser);
  };

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    const currentUser = user;
    if (!currentUser) return;
    if (pendingAction === "solo") {
      await executeSoloRegister(currentUser);
    } else if (pendingAction === "team_create") {
      await executeCreateTeam(currentUser);
    }
    setPendingAction(null);
  };

  const handleJoinTeam = async () => {
    const currentUser = requireOnboardedUser();
    if (!currentUser) return;
    if (!joinCodeInput.trim()) return setError("Enter a join code.");
    setBusy(true);
    setError(null);
    try {
      const { registration } = await joinTeam(event.id, currentUser.id, joinCodeInput.trim());
      await refresh();
      notifyRegistrationConfirmed(event, currentUser, registration).then(setNotice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join that team.");
    } finally {
      setBusy(false);
    }
  };

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = event ? isBookmarked(event.id) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div
        className="relative rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, hsl(${event.banner_hue} 70% 20%), hsl(${event.banner_hue} 70% 10%))`,
        }}
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
        <p className="mt-2 text-cream/80">{event.tagline}</p>
        <p className="mt-1 text-sm text-muted">
          Hosted by {event.club_name} · {event.college}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile icon={Building2} label="College" value={`${event.college}, ${event.city}`} />
        <InfoTile icon={MapPin} label="Venue" value={event.venue} />
        <InfoTile icon={CalendarDays} label="When" value={formatDateRange(event.start_at, event.end_at)} />
        <InfoTile icon={Users} label="Participation" value={formatTeamSize(event.team_min, event.team_max)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="font-display text-xl font-semibold">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-cream/80">{event.description}</p>
          </section>
          {event.rules.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold">Rules &amp; regulations</h2>
              <ul className="mt-3 space-y-2">
                {event.rules.map((rule, i) => (
                  <li key={i} className="flex gap-2 text-sm text-cream/75">
                    <span className="text-coral">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold">{formatFee(event.fee)}</span>
            {event.fee > 0 && <span className="text-xs text-muted">per {isTeamEvent ? "team" : "ticket"}</span>}
          </div>

          {seats && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Ticket className="h-3.5 w-3.5" />
              {Math.max(seats.capacity - seats.confirmed, 0)} of {seats.capacity} spots left
              {seats.waitlisted > 0 && ` · ${seats.waitlisted} waitlisted`}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            Registration {deadlinePassed ? "closed" : `closes in ${timeUntil(event.registration_deadline)}`}
          </div>

          <div className="mt-5 border-t border-border pt-5">
            {myRegistration ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-medium">You're registered</span>
                </div>
                <StatusPill
                  label={myRegistration.status}
                  tone={registrationTone(myRegistration.status)}
                />
                {notice && (
                  <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs">
                    <p className="font-semibold text-cream">
                      {notice.attempted
                        ? notice.error
                          ? "Notification alert"
                          : "✓ Confirmation notification dispatched!"
                        : "Notification prepared (Demo Mode)"}
                    </p>
                    <p className="mt-1 text-muted">
                      {notice.attempted
                        ? notice.error
                          ? `Delivery issue: ${notice.error}`
                          : `Sent to ${[notice.recipientEmail, notice.recipientPhone].filter(Boolean).join(" & ")} (${notice.channels.join(", ")}).`
                        : `Ready for ${[notice.recipientEmail, notice.recipientPhone].filter(Boolean).join(" & ")} via ${notice.channels.join(", ")}. Logged to console in Demo Mode.`}
                    </p>
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
                      attendeePhone: user?.phone,
                    })
                  }
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 py-2.5 text-center text-sm font-semibold text-cream hover:border-coral/50 transition-colors"
                >
                  <Download className="h-4 w-4 text-coral" /> Download Pass (PNG)
                </button>
                <Link
                  to="/dashboard"
                  className="block rounded-xl bg-coral py-2.5 text-center text-sm font-semibold text-ink"
                >
                  View my ticket
                </Link>
              </div>
            ) : deadlinePassed ? (
              <p className="text-sm text-muted">Registration for this event has closed.</p>
            ) : !isTeamEvent ? (
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
                {mode === "create" ? (
                  <>
                    <input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name"
                      className="w-full rounded-lg border border-border bg-ink px-3 py-2 text-sm focus:border-coral focus:outline-none"
                    />
                    <button
                      onClick={handleCreateTeam}
                      disabled={busy}
                      className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
                    >
                      {busy ? "Creating..." : "Create team & register"}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 7QX2KP"
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
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            <div className="mt-4 border-t border-border pt-4">
              <AddToCalendarButton event={event} className="w-full flex justify-center" />
            </div>
          </div>
        </aside>
      </div>

      {event && user && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setPendingAction(null);
          }}
          onSuccess={handlePaymentSuccess}
          event={event}
          attendeeName={user.name}
          attendeeEmail={user.email}
          attendeePhone={user.phone}
          isTeam={pendingAction === "team_create"}
        />
      )}
    </div>
  );
};

const InfoTile: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="rounded-xl border border-border bg-surface p-4">
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <p className="mt-1 text-sm font-medium text-cream">{value}</p>
  </div>
);
