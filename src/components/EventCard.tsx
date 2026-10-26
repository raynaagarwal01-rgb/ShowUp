import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, CalendarDays, MapPin, Users } from "lucide-react";
import type { EventRecord } from "../types";
import { formatEventDate, formatFee } from "../lib/format";
import { useBookmarks } from "../lib/bookmarks";

export const EventCard: React.FC<{ event: EventRecord }> = ({ event }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(event.id);
  const confirmed = event.registered_count ?? 0;
  return <article className="panel flex h-full flex-col rounded-lg p-5 transition-colors hover:border-neutral-400">
    <div className="flex items-start justify-between gap-3">
      <span className="font-mono text-xs text-muted">{event.category}</span>
      <button type="button" aria-label={saved ? `Remove ${event.title} from saved events` : `Save ${event.title}`} aria-pressed={saved} onClick={() => toggleBookmark(event.id)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink">
        <Bookmark aria-hidden="true" className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
    <p className="mt-3 font-mono text-xs uppercase tracking-wide text-muted">{formatEventDate(event.event_date)}</p>
    <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight"><Link className="hover:underline" to={`/events/${event.id}`}>{event.title}</Link></h2>
    <p className="mt-2 text-sm text-muted">Hosted by {event.organizer_name}{event.organizer_college ? ` · ${event.organizer_college}` : ""}</p>
    <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-body">
      <p className="flex items-center gap-2"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" /><span className="truncate">{event.venue}</span></p>
      <p className="flex items-center gap-2"><Users aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />{confirmed} / {event.capacity} registered</p>
      <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />{event.registration_deadline ? `Register by ${formatEventDate(event.registration_deadline)}` : "Registration deadline not set"}</p>
    </div>
    <div className="mt-auto flex items-center justify-between border-t border-border pt-4 mt-5"><span className="text-sm font-semibold">{formatFee(event.fee)}</span><Link className="text-sm font-medium underline underline-offset-4" to={`/events/${event.id}`}>View event</Link></div>
  </article>;
};
