import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Users,
  QrCode,
  Pencil,
  Trash2,
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  X,
} from "lucide-react";
import { deleteEvent, listEvents } from "../../lib/api";
import type { EventRecord } from "../../types";
import { formatEventDate, formatFee } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";

export const OrganizerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // GET /api/events already includes registered_count (COUNT ... GROUP BY),
  // so the organizer's own events just need filtering by organizer_id.
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await listEvents();
      setEvents(all.filter((e) => e.organizer_id === user.id));
    } catch (err) {
      setNotification(err instanceof Error ? err.message : "Failed to load your events.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      setNotification(`Deleted event "${eventToDelete.title}".`);
      setEventToDelete(null);
      await fetchEvents();
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="flex items-center justify-between rounded-xl border border-coral/30 bg-coral/10 p-3.5 text-xs text-coral-light animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-coral shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-muted hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Organizer studio</h1>
          <p className="mt-1 text-cream/70">Every event your club is running, in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/organizer/new"
            className="flex items-center gap-1.5 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            <Plus className="h-4 w-4" /> New event
          </Link>
        </div>
      </div>

      {/* Events List */}
      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="text-sm text-muted">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-14 px-6 text-center space-y-4 bg-surface/40">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-cream">You haven't created an event yet</h3>
              <p className="mt-1 text-xs text-muted max-w-md mx-auto">
                Create your first event — students will be able to find it and register right away.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/organizer/new"
                className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2.5 text-xs font-bold text-ink transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Event
              </Link>
            </div>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-border/80"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-coral/15 border border-coral/30 px-2 py-0.5 text-[10px] font-bold text-coral uppercase tracking-wide">
                    {event.category}
                  </span>
                  <p className="font-display font-semibold text-cream truncate">{event.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {formatEventDate(event.event_date)} · {event.venue} · {formatFee(event.fee)}
                </p>
                <p className="mt-1 text-xs text-coral-light font-medium">
                  {event.registered_count ?? 0}/{event.capacity} confirmed participants
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/organizer/events/${event.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-cream hover:border-coral/50 transition-colors"
                >
                  <Users className="h-3.5 w-3.5 text-coral" /> Registrants &amp; Teams
                </Link>
                <Link
                  to={`/organizer/events/${event.id}/checkin`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-cream hover:border-coral/50 transition-colors"
                >
                  <QrCode className="h-3.5 w-3.5 text-coral" /> Check-in
                </Link>
                <Link
                  to={`/organizer/events/${event.id}/edit`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-cream hover:border-coral/50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted" /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setEventToDelete(event)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/15 hover:border-red-500/60 transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-2.5">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-cream">Delete Event</h3>
                <p className="text-xs text-red-400/80">Permanent, irreversible action</p>
              </div>
            </div>

            <p className="text-xs text-cream/80 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-cream">"{eventToDelete.title}"</strong>?
            </p>

            <div className="rounded-xl border border-border bg-surface-2 p-3 text-[11px] text-muted space-y-1">
              <p>• All attendee registrations &amp; tickets will be wiped.</p>
              <p>• Teams, announcements, questions and winners will be removed (ON DELETE CASCADE).</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-cream hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? "Deleting event..." : "Yes, Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
