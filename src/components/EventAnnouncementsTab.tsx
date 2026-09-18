import React, { useEffect, useState } from "react";
import { AlertTriangle, Bell, Megaphone, Send, ShieldAlert } from "lucide-react";
import { listEventAnnouncements, createAnnouncement } from "../lib/db";
import type { Announcement } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  eventId: string;
  isOrganizer?: boolean;
}

export const EventAnnouncementsTab: React.FC<Props> = ({ eventId, isOrganizer = false }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = isOrganizer || user?.role === "organizer";

  const fetchAnnouncements = async () => {
    try {
      const list = await listEventAnnouncements(eventId);
      setAnnouncements(list);
    } catch (e) {
      console.error("Failed to load announcements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const author = user?.name || "Event Organizing Committee";
      const created = await createAnnouncement(
        eventId,
        title.trim(),
        content.trim(),
        author,
        isUrgent
      );
      setAnnouncements((prev) => [created, ...prev]);
      setTitle("");
      setContent("");
      setIsUrgent(false);
      setShowCompose(false);
    } catch (err: any) {
      setError(err?.message || "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-coral" />
            <h2 className="font-display text-xl font-semibold text-cream">
              Live Updates &amp; Announcements
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Official broadcasts and schedule alerts directly from the fest organizers.
          </p>
        </div>

        {canPost && (
          <button
            type="button"
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-1.5 rounded-xl bg-coral px-3.5 py-1.5 text-xs font-semibold text-ink hover:opacity-90 transition-opacity"
          >
            <Bell className="h-3.5 w-3.5" />
            {showCompose ? "Close Composer" : "Post Broadcast"}
          </button>
        )}
      </div>

      {showCompose && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-coral/30 bg-surface-2 p-5 space-y-4 shadow-lg shadow-coral/5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-coral" />
              Compose Official Announcement
            </h3>
            <span className="text-[11px] font-medium text-coral uppercase tracking-wider">
              Organizer Mode
            </span>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1">
              Broadcast Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Venue Change to Anna Auditorium / Reporting Time Update"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1">
              Announcement Details
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide all essential details, room numbers, instructions, or links..."
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-cream/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="h-4 w-4 rounded border-border text-coral focus:ring-coral"
              />
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Mark as High Priority / Urgent Alert
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-1.5 text-xs font-semibold text-ink disabled:opacity-50 transition-opacity"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Broadcasting..." : "Broadcast Now"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-muted">Loading live updates...</div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium text-cream/80">No announcements broadcast yet</p>
          <p className="mt-1 text-xs text-muted">
            Important notices, venue changes, and real-time alerts will appear right here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4.5 transition-colors ${
                item.is_urgent
                  ? "border-amber-500/40 bg-amber-950/10 shadow-md shadow-amber-500/5"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.is_urgent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      URGENT ALERT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted">
                      <Bell className="h-3 w-3 text-coral" />
                      NOTICE
                    </span>
                  )}
                  <h3 className="font-display text-base font-semibold text-cream">
                    {item.title}
                  </h3>
                </div>
                <span className="text-[11px] text-muted">{formatDate(item.created_at)}</span>
              </div>

              <p className="mt-2.5 whitespace-pre-line text-sm text-cream/85 leading-relaxed">
                {item.content}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted">
                <span>
                  Posted by <span className="text-cream/90 font-medium">{item.author_name}</span>
                </span>
                <span className="text-coral/80 font-medium">Verified Fest Broadcast</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
