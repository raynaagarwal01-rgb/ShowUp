import React, { useEffect, useState } from "react";
import { Bell, Megaphone, Send } from "lucide-react";
import { createAnnouncement, listAnnouncements } from "../lib/api";
import type { Announcement } from "../types";

interface Props {
  eventId: number;
  /** True when the signed-in user created this event. */
  isOrganizer?: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const EventAnnouncementsTab: React.FC<Props> = ({ eventId, isOrganizer = false }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAnnouncements(eventId)
      .then(setAnnouncements)
      .catch(() => setError("Couldn't load announcements."))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAnnouncement(eventId, title.trim(), content.trim());
      setAnnouncements((prev) => [created, ...prev]);
      setTitle("");
      setContent("");
      setShowCompose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-coral" />
            <h2 className="font-display text-xl font-semibold text-cream">Announcements</h2>
          </div>
          <p className="mt-1 text-xs text-muted">Updates and schedule changes from the event organizer.</p>
        </div>

        {isOrganizer && (
          <button
            type="button"
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-1.5 rounded-xl bg-coral px-3.5 py-1.5 text-xs font-semibold text-ink hover:opacity-90 transition-opacity"
          >
            <Bell className="h-3.5 w-3.5" />
            {showCompose ? "Close" : "Post announcement"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">{error}</div>
      )}

      {showCompose && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-coral/30 bg-surface-2 p-5 space-y-4 shadow-lg shadow-coral/5"
        >
          <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-coral" />
            New announcement
          </h3>
          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1">Title</label>
            <input
              type="text"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Venue changed to Anna Auditorium"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cream/70 mb-1">Details</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Room numbers, timings, instructions..."
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2">
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
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-muted">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium text-cream/80">No announcements yet</p>
          <p className="mt-1 text-xs text-muted">Venue changes and other notices will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-surface p-4.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted">
                    <Bell className="h-3 w-3 text-coral" />
                    NOTICE
                  </span>
                  <h3 className="font-display text-base font-semibold text-cream">{item.title}</h3>
                </div>
                <span className="text-[11px] text-muted">{formatDate(item.created_at)}</span>
              </div>
              <p className="mt-2.5 whitespace-pre-line text-sm text-cream/85 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
