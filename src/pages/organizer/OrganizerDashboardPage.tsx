import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, QrCode, Pencil } from "lucide-react";
import { getSeatStats, listOrganizerEvents } from "../../lib/db";
import type { EventRecord } from "../../types";
import { formatDateRange, formatFee } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";

interface Row {
  event: EventRecord;
  confirmed: number;
  capacity: number;
}

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const events = await listOrganizerEvents(user.id);
      const withStats = await Promise.all(
        events.map(async (event) => {
          const stats = await getSeatStats(event.id);
          return { event, confirmed: stats.confirmed, capacity: stats.capacity };
        }),
      );
      setRows(withStats);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Organizer studio</h1>
          <p className="mt-1 text-cream/70">Every event your club is running, in one place.</p>
        </div>
        <Link
          to="/organizer/new"
          className="flex items-center gap-1.5 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> New event
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-cream/80">You haven't created an event yet.</p>
            <Link to="/organizer/new" className="mt-2 inline-block text-sm font-medium text-coral">
              Create your first event
            </Link>
          </div>
        ) : (
          rows.map(({ event, confirmed, capacity }) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-display font-semibold">{event.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDateRange(event.start_at, event.end_at)} · {event.venue} · {formatFee(event.fee)}
                </p>
                <p className="mt-1 text-xs text-coral-light">
                  {confirmed}/{capacity} confirmed
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/organizer/events/${event.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-cream/80 hover:border-coral/50"
                >
                  <Users className="h-3.5 w-3.5" /> Registrants
                </Link>
                <Link
                  to={`/organizer/events/${event.id}/checkin`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-cream/80 hover:border-coral/50"
                >
                  <QrCode className="h-3.5 w-3.5" /> Check-in
                </Link>
                <Link
                  to={`/organizer/events/${event.id}/edit`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-cream/80 hover:border-coral/50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
