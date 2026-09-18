import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, ExternalLink, Download } from "lucide-react";
import type { EventRecord } from "../types";
import { getGoogleCalendarUrl, downloadIcs } from "../lib/calendar";

export const AddToCalendarButton: React.FC<{ event: EventRecord; className?: string }> = ({
  event,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-cream hover:border-coral/40 hover:text-coral-light transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-coral" />
        <span>Add to calendar</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface-2 p-1 shadow-xl backdrop-blur-md">
          <a
            href={getGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-cream hover:bg-surface hover:text-coral transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Google Calendar
            </span>
            <ExternalLink className="h-3 w-3 text-muted" />
          </a>
          <button
            type="button"
            onClick={() => {
              downloadIcs(event);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-cream hover:bg-surface hover:text-coral transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Apple / Outlook (.ics)
            </span>
            <Download className="h-3 w-3 text-muted" />
          </button>
        </div>
      )}
    </div>
  );
};
