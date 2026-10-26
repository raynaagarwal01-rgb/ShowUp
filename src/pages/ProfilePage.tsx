import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, Hash, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listEvents, listMyRegistrations } from "../lib/api";
import { formatEventDate } from "../lib/format";
import type { EventRecord, MyRegistration } from "../types";
import { StatusPill } from "../components/StatusPill";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [hostedEvents, setHostedEvents] = useState<EventRecord[]>([]);
  const [activityUserId, setActivityUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activityRequest = useRef(0);

  const loadActivity = useCallback(async () => {
    if (!user) return;
    const requestId = ++activityRequest.current;
    setLoading(true);
    setError(null);
    try {
      if (user.role === "organizer") {
        const events = (await listEvents()).filter((event) => event.organizer_id === user.id);
        if (requestId === activityRequest.current) {
          setHostedEvents(events);
          setActivityUserId(user.id);
        }
      } else {
        const registrations = await listMyRegistrations();
        if (requestId === activityRequest.current) {
          setRegistrations(registrations);
          setActivityUserId(user.id);
        }
      }
    } catch (e) {
      if (requestId === activityRequest.current) setError(e instanceof Error ? e.message : "Could not load your events.");
    } finally {
      if (requestId === activityRequest.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const request = activityRequest;
    void loadActivity();
    return () => { request.current++; };
  }, [loadActivity]);
  if (!user) return null;

  const events = activityUserId !== user.id ? [] : user.role === "organizer"
    ? hostedEvents.map((event) => ({ key: event.id, event, attended: false }))
    : registrations.map((registration) => ({ key: registration.id, event: registration.event, attended: !!registration.checked_in_at }));

  return (
    <main className="page-shell mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <section className="panel p-6 sm:p-8">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <div className="mt-4 flex items-center gap-4">
          <div aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-ink text-xl font-semibold text-white">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{user.name}</h1>
            <p className="mt-1 text-sm capitalize text-muted">{user.role}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail icon={Mail} label="Email" value={user.email} />
          <Detail icon={Building2} label="College" value={user.college || "Not added"} />
          {user.role === "student" && <Detail icon={Hash} label="Registration number" value={user.reg_no || "Not added"} />}
          <Detail icon={CalendarDays} label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
        </dl>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">ACTIVITY</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">{user.role === "organizer" ? "Events you host" : "Your registrations"}</h2>
          </div>
          <Link to={user.role === "organizer" ? "/organizer/new" : "/events"} className="text-sm font-medium text-ink underline underline-offset-4">
            {user.role === "organizer" ? "Create event" : "Browse events"}
          </Link>
        </div>
        {loading ? <p className="mt-4 text-sm text-muted" aria-live="polite">Loading your events…</p> : error ? (
          <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
            <p role="alert" className="text-sm text-danger">{error}</p>
            <button className="btn-secondary" onClick={() => void loadActivity()}>Try again</button>
          </div>
        ) : events.length ? (
          <div className="mt-4 divide-y divide-border border-y border-border">
            {events.map(({ key, event, attended }) => (
              <Link key={key} to={`/events/${event.id}`} className="flex items-center justify-between gap-4 py-4 text-sm hover:bg-surface">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{event.title}</span>
                  <span className="mt-1 block text-xs text-muted">{event.category} · {formatEventDate(event.event_date)}</span>
                </span>
                {attended && <StatusPill label="Attended" tone="success" />}
              </Link>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-muted">{user.role === "organizer" ? "No events yet. Create your first one when you’re ready." : "You haven’t registered for an event yet."}</p>}
      </section>
    </main>
  );
};

const Detail: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-center gap-2 border-t border-border py-3 text-sm">
    <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
    <dt className="shrink-0 text-muted">{label}</dt>
    <dd className="truncate font-medium text-ink">{value}</dd>
  </div>
);
