import React from "react";
import { Link } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import type { EventRecord } from "../types";
import { formatDateRange, formatFee, formatTeamSize } from "../lib/format";
import { StatusPill } from "./StatusPill";

export const EventCard: React.FC<{ event: EventRecord }> = ({ event }) => (
  <Link
    to={`/events/${event.id}`}
    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-coral/50"
  >
    <div
      className="flex h-28 items-end p-4"
      style={{
        background: `linear-gradient(135deg, hsl(${event.banner_hue} 70% 22%), hsl(${event.banner_hue} 70% 12%))`,
      }}
    >
      <StatusPill label={event.category} tone="coral" />
    </div>
    <div className="flex flex-1 flex-col gap-3 p-4">
      <div>
        <h3 className="font-display text-lg font-semibold leading-snug text-cream group-hover:text-coral-light">
          {event.title}
        </h3>
        <p className="text-xs text-muted">{event.club_name}</p>
      </div>
      <p className="line-clamp-2 text-sm text-cream/70">{event.tagline}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-xs text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {event.venue}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {formatTeamSize(event.team_min, event.team_max)}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="font-medium text-cream/80">{formatDateRange(event.start_at, event.end_at)}</span>
        <span className={event.fee === 0 ? "font-semibold text-success" : "font-semibold text-cream"}>
          {formatFee(event.fee)}
        </span>
      </div>
    </div>
  </Link>
);
