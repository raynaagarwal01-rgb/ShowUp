import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Users,
  QrCode,
  Pencil,
  Trash2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  createSampleEventForOrganizer,
  deleteEvent,
  getSeatStats,
  listOrganizerEvents,
} from "../../lib/db";
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
  const [creatingSample, setCreatingSample] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const events = await listOrganizerEvents(user.id);
      const withStats = await Promise.all(
        events.map(async (event) => {
          const stats = await getSeatStats(event.id);
          return { event, confirmed: stats.confirmed, capacity: stats.capacity };
        }),
      );
      setRows(withStats);
    } catch (err) {
      console.error("Failed to load organizer events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleCreateSample = async () => {
    if (!user) return;
    setCreatingSample(true);
    try {
      const sample = await createSampleEventForOrganizer(user);
      setNotification(`✨ Created sample event "${sample.title}" with sample teams and pitches!`);
      await fetchEvents();
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Failed to create sample event:", err);
    } finally {
      setCreatingSample(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      await deleteEvent(eventToDelete.id, user?.id);
      setNotification(`🗑️ Successfully deleted event "${eventToDelete.title}".`);
      setEventToDelete(null);
      await fetchEvents();
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error("Failed to delete event:", err);
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
          <button
            type="button"
            disabled={creatingSample}
            onClick={handleCreateSample}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-50"
            title="Generate a sample hackathon event with pre-filled teams and ideas"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{creatingSample ? "Creating sample..." : "Create Sample Event"}</span>
          </button>
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
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-14 px-6 text-center space-y-4 bg-surface/40">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-cream">You haven't created an event yet</h3>
              <p className="mt-1 text-xs text-muted max-w-md mx-auto">
                Get started by generating a ready-to-test sample hackathon with pre-filled teams and project pitches, or create your event from scratch.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={creatingSample}
                onClick={handleCreateSample}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-ink shadow-lg shadow-amber-900/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{creatingSample ? "Generating..." : "✨ Create Sample Hackathon Event"}</span>
              </button>
              <Link
                to="/organizer/new"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
              >
                <Plus className="h-4 w-4 text-coral" /> Create Custom Event
              </Link>
            </div>
          </div>
        ) : (
          rows.map(({ event, confirmed, capacity }) => (
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
                  {formatDateRange(event.start_at, event.end_at)} · {event.venue} · {formatFee(event.fee)}
                </p>
                <p className="mt-1 text-xs text-coral-light font-medium">
                  {confirmed}/{capacity} confirmed registrations
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
              <p>• Team rosters and project pitch submissions will be removed.</p>
              <p>• Event will disappear from the public campus directory.</p>
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
