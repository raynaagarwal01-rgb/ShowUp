import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Users } from "lucide-react";
import { getEvent, listMyRegistrations, registerSolo } from "../lib/api";
import type { EventRecord, MyRegistration } from "../types";
import { deadlinePassed, formatEventDate, formatFee, ticketCode, timeUntil } from "../lib/format";
import { StatusPill, registrationTone } from "../components/StatusPill";
import { QRTicket } from "../components/QRTicket";
import { useAuth } from "../context/AuthContext";

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [registration, setRegistration] = useState<MyRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async (active?: () => boolean) => {
    if (!id || authLoading) return;
    setLoading(true);
    setError("");
    try {
      const result = await getEvent(id);
      if (active && !active()) return;
      setEvent(result);
      if (result && user?.role === "student") {
        const mine = await listMyRegistrations();
        if (active && !active()) return;
        setRegistration(mine.find((item) => item.event_id === result.id && item.status === "confirmed") ?? null);
      } else setRegistration(null);
    } catch (e) {
      if (active && !active()) return;
      setError(e instanceof Error ? e.message : "Event details could not be loaded.");
    } finally {
      if (!active || active()) setLoading(false);
    }
  }, [id, user, authLoading]);

  useEffect(() => {
    let current = true;
    void load(() => current);
    return () => { current = false; };
  }, [load]);

  const register = async () => {
    if (!event) return;
    if (!user) { navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`); return; }
    setBusy(true); setMessage(""); setError("");
    try {
      await registerSolo(event.id);
      await load();
      setMessage("You’re registered. Your ticket is ready below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally { setBusy(false); }
  };

  if (loading || authLoading) return <main className="page-shell py-16" aria-live="polite">Loading event…</main>;
  if (error && !event) return <main className="page-shell py-16"><div className="panel p-6" role="alert"><p className="font-medium">Event details are unavailable.</p><p className="mt-1 text-sm text-muted">{error}</p><button className="btn-secondary mt-4 min-h-10 rounded-md" onClick={() => void load()}>Try again</button></div></main>;
  if (!event) return <main className="page-shell py-16"><p className="font-medium">Event not found.</p><Link className="mt-3 inline-block underline" to="/events">Back to events</Link></main>;

  const ownEvent = user?.id === event.organizer_id;
  const spotsLeft = Math.max(event.capacity - (event.registered_count ?? 0), 0);
  const closed = deadlinePassed(event);
  const unavailable = closed || spotsLeft === 0;
  return <main className="page-shell py-8 sm:py-12">
    <Link to="/events" className="text-sm text-muted underline underline-offset-4">← All events</Link>
    <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <article>
        <StatusPill label={event.category} tone="muted" />
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{event.title}</h1>
        <p className="mt-3 text-sm text-muted">Hosted by {event.organizer_name}{event.organizer_college ? ` · ${event.organizer_college}` : ""}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="panel flex gap-3 p-4"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted" /><div><p className="text-xs text-muted">Date and time</p><p className="mt-1 text-sm font-medium">{formatEventDate(event.event_date)}</p></div></div>
          <div className="panel flex gap-3 p-4"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" /><div><p className="text-xs text-muted">Venue</p><p className="mt-1 text-sm font-medium">{event.venue}</p></div></div>
        </div>
        <section className="mt-9"><h2 className="text-lg font-semibold">About this event</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-body">{event.description}</p></section>
      </article>

      <aside className="panel h-fit p-5 lg:sticky lg:top-24">
        <p className="text-2xl font-semibold">{formatFee(event.fee)}{event.fee > 0 && <span className="ml-1 text-sm font-normal text-muted">per person</span>}</p>
        <div className="mt-5 space-y-3 border-y border-border py-4 text-sm">
          <p className="flex items-center gap-2"><Users className="h-4 w-4 text-muted" />{spotsLeft} of {event.capacity} spots left</p>
          <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted" />Registration {closed ? "closed" : `closes ${timeUntil(event.registration_deadline)}`}</p>
          <p className="text-xs text-muted">Deadline: {formatEventDate(event.registration_deadline)}</p>
        </div>
        <div className="pt-4" aria-live="polite">
          {message && <p role="status" className="mb-3 text-sm text-green-800">{message}</p>}
          {error && <p role="alert" className="mb-3 text-sm text-red-800">{error}</p>}
          {registration ? <div className="text-center">
            <div className="flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4" /><span className="font-medium">You’re registered</span></div>
            <div className="my-4 flex justify-center"><QRTicket value={ticketCode(registration.id)} size={144} /></div>
            <p className="font-mono text-xs text-muted">Registration #{registration.id}</p>
            <StatusPill className="mt-3" label={registration.status} tone={registrationTone(registration.status)} />
            <Link className="btn-primary mt-4 min-h-10 w-full rounded-md" to="/dashboard">My events</Link>
          </div> : ownEvent ? <div className="space-y-3 text-sm"><p className="text-muted">You’re hosting this event, so you can’t register as an attendee.</p><Link className="btn-primary min-h-10 w-full rounded-md" to={`/organizer/events/${event.id}/edit`}>Edit event</Link><Link className="block text-center underline" to={`/organizer/events/${event.id}`}>View attendees</Link></div>
            : user?.role === "organizer" ? <p className="text-sm text-muted">Registration is available to student accounts.</p>
            : unavailable ? <p className="text-sm text-muted">{closed ? "Registration has closed." : "This event is full."}</p>
            : <button type="button" onClick={() => void register()} disabled={busy} className="btn-primary min-h-10 w-full rounded-md">{busy ? "Registering…" : "Register"}</button>}
          {error && event && <button type="button" onClick={() => void load()} className="mt-3 w-full text-sm underline">Reload event</button>}
        </div>
      </aside>
    </div>
  </main>;
};
