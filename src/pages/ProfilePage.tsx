import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarCheck, CalendarDays, Hash, Mail, UserCheck, Users } from "lucide-react";
import { listEvents, listMyRegistrations } from "../lib/api";
import type { EventRecord, MyRegistration } from "../types";
import { useAuth } from "../context/AuthContext";
import { formatEventDate } from "../lib/format";
import { StatusPill } from "../components/StatusPill";

/** The signed-in user's account details (users row) and a short activity summary. */
export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [hostedEvents, setHostedEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load =
      user.role === "organizer"
        ? listEvents().then((events) => setHostedEvents(events.filter((e) => e.organizer_id === user.id)))
        : listMyRegistrations().then(setRegistrations);
    load.catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const stats =
    user.role === "organizer"
      ? [
          { label: "Events hosted", value: hostedEvents.length, icon: CalendarDays },
          {
            label: "Total participants",
            value: hostedEvents.reduce((sum, e) => sum + (e.registered_count ?? 0), 0),
            icon: Users,
          },
        ]
      : [
          { label: "Registered events", value: registrations.length, icon: CalendarDays },
          { label: "Attended (checked in)", value: registrations.filter((r) => r.checked_in_at).length, icon: UserCheck },
          { label: "Teams", value: registrations.filter((r) => r.team_id).length, icon: Users },
        ];

  const history =
    user.role === "organizer"
      ? hostedEvents.map((e) => ({ key: e.id, event: e, checkedIn: false }))
      : registrations.map((r) => ({ key: r.id, event: r.event, checkedIn: !!r.checked_in_at }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-coral to-amber-400 font-display text-2xl font-extrabold text-ink">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{user.name}</h1>
            <StatusPill label={user.role} tone="coral" className="mt-1" />
          </div>
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Detail icon={Mail} label="Email" value={user.email} />
          <Detail icon={Building2} label="College" value={user.college || "—"} />
          {user.role === "student" && <Detail icon={Hash} label="Registration no." value={user.reg_no || "—"} />}
          <Detail icon={CalendarCheck} label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
        </dl>
      </div>

      <div className={`grid gap-4 ${stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{s.label}</span>
              <s.icon className="h-4 w-4 text-coral" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-cream">{loading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">
          {user.role === "organizer" ? "Events you host" : "Your events"}
        </h2>
        {!loading && history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing here yet.{" "}
            <Link to={user.role === "organizer" ? "/organizer/new" : "/events"} className="text-coral">
              {user.role === "organizer" ? "Create an event" : "Browse events"}
            </Link>
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {history.map(({ key, event, checkedIn }) => (
              <Link
                key={key}
                to={`/events/${event.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 text-sm hover:border-coral/40"
              >
                <div>
                  <p className="font-semibold text-cream">{event.title}</p>
                  <p className="text-xs text-muted">
                    {event.category} · {formatEventDate(event.event_date)}
                  </p>
                </div>
                {checkedIn && <StatusPill label="Attended" tone="success" />}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Detail: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5">
    <Icon className="h-4 w-4 text-coral" />
    <dt className="text-muted">{label}:</dt>
    <dd className="font-medium text-cream truncate">{value}</dd>
  </div>
);
