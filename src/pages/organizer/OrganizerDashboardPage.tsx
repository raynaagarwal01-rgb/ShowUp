import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Check, ClipboardList, Plus, QrCode, Trash2, Users } from "lucide-react";
import { deleteEvent, listEvents } from "../../lib/api";
import type { EventRecord } from "../../types";
import { formatEventDate, formatFee } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(location.state?.notice ?? null);
  const [eventToDelete, setEventToDelete] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestId = useRef(0);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    const request = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const all = await listEvents();
      if (request !== requestId.current) return;
      setEvents(all.filter((event) => event.organizer_id === user.id));
    } catch (err) {
      if (request !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Couldn't load your events.");
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => { const request = requestId; void loadEvents(); return () => { request.current++; }; }, [loadEvents]);
  useEffect(() => {
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const confirmDelete = async () => {
    if (!eventToDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEvent(eventToDelete.id);
      setEvents((current) => current.filter((event) => event.id !== eventToDelete.id));
      setNotice(`“${eventToDelete.title}” was deleted.`);
      setEventToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this event. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const registrationCount = events.reduce((sum, event) => sum + (event.registered_count ?? 0), 0);

  return (
    <main className="page-shell space-y-8 py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Organizer workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your events</h1>
          <p className="mt-2 text-sm text-muted">Manage event details, registrations, and arrival check-in.</p>
        </div>
        <Link to="/organizer/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} aria-hidden="true" /> Create event
        </Link>
      </header>

      {notice && <p role="status" className="panel flex items-center gap-2 p-3 text-sm"><Check size={16} aria-hidden="true" />{notice}</p>}
      {error && <div role="alert" className="panel flex flex-wrap items-center justify-between gap-3 border-red-200 p-4 text-sm text-red-700"><span>{error}</span><button className="btn-secondary" onClick={() => void loadEvents()}>Try again</button></div>}

      <section aria-label="Event summary" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Events", value: events.length, icon: CalendarDays },
          { label: "Registrations", value: registrationCount, icon: Users },
          { label: "Available places", value: events.reduce((sum, event) => sum + Math.max(event.capacity - (event.registered_count ?? 0), 0), 0), icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="panel flex items-center gap-4 p-4">
          <span className="grid size-10 place-items-center rounded-md bg-[#f5f5f5]"><Icon size={18} aria-hidden="true" /></span>
          <div><p className="text-sm text-muted">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p></div>
        </div>)}
      </section>

      <section aria-labelledby="events-heading">
        <div className="mb-3 flex items-center justify-between gap-4 border-b border-border pb-3">
          <h2 id="events-heading" className="text-lg font-semibold">Event list</h2>
          {!loading && <span className="text-sm text-muted">{events.length} {events.length === 1 ? "event" : "events"}</span>}
        </div>
        {loading ? <p role="status" className="py-10 text-center text-sm text-muted">Loading events…</p> : events.length === 0 ? (
          <div className="panel px-6 py-14 text-center">
            <CalendarDays className="mx-auto mb-3 text-muted" size={24} aria-hidden="true" />
            <h3 className="font-semibold">Your event list is empty</h3>
            <p className="mt-1 text-sm text-muted">Create an event to start collecting registrations.</p>
            <Link to="/organizer/new" className="btn-primary mt-5 inline-flex items-center gap-2"><Plus size={16} aria-hidden="true" />Create event</Link>
          </div>
        ) : <div className="panel divide-y divide-border overflow-hidden">
          {events.map((event) => <article key={event.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="eyebrow">{event.category}</p>
              <h3 className="mt-1 truncate text-base font-semibold">{event.title}</h3>
              <p className="mt-1 text-sm text-muted">{formatEventDate(event.event_date)} <span aria-hidden="true">·</span> {event.venue} <span aria-hidden="true">·</span> {formatFee(event.fee)}</p>
              <p className="mt-1 text-sm text-muted">{event.registered_count ?? 0} of {event.capacity} registered</p>
            </div>
            <nav aria-label={`${event.title} actions`} className="flex flex-wrap items-center gap-2">
              <Link className="btn-secondary" to={`/organizer/events/${event.id}`}>Registrations</Link>
              <Link className="btn-secondary inline-flex items-center gap-1.5" to={`/organizer/events/${event.id}/checkin`}><QrCode size={15} aria-hidden="true" />Check-in</Link>
              <Link className="btn-secondary" to={`/organizer/events/${event.id}/edit`}>Edit</Link>
              <button className="btn-secondary inline-flex items-center gap-1.5 text-red-700" onClick={() => setEventToDelete(event)}><Trash2 size={15} aria-hidden="true" />Delete</button>
            </nav>
          </article>)}
        </div>}
      </section>

      <ConfirmDialog
        open={!!eventToDelete}
        onOpenChange={(open) => { if (!open && !deleting) setEventToDelete(null); }}
        title="Delete this event?"
        description={<>“{eventToDelete?.title}” and its registrations will be permanently deleted. This can't be undone.</>}
        confirmLabel={deleting ? "Deleting…" : "Delete event"}
        busy={deleting}
        onConfirm={confirmDelete}
        error={error}
      />
    </main>
  );
};
