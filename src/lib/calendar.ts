import type { EventRecord } from "../types";

// Events store only a start time, so calendar entries assume two hours.
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

function formatUtcDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function eventTimes(event: EventRecord) {
  const start = new Date(event.event_date);
  return { start: formatUtcDate(start), end: formatUtcDate(new Date(start.getTime() + DEFAULT_DURATION_MS)) };
}

const eventLocation = (event: EventRecord) =>
  [event.venue, event.organizer_college].filter(Boolean).join(", ");

export function getGoogleCalendarUrl(event: EventRecord): string {
  const { start, end } = eventTimes(event);
  const location = eventLocation(event);
  const details = `${event.description}\n\nVenue: ${location}\nRegistration via ShowUp: ${window.location.origin}/events/${event.id}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(event: EventRecord): void {
  const { start, end } = eventTimes(event);
  const nowUtc = formatUtcDate(new Date());
  const location = eventLocation(event).replace(/[,;]/g, " ");
  const cleanTitle = event.title.replace(/[\r\n]/g, " ");
  const cleanSummary = `Hosted by ${event.organizer_name}`.replace(/[\r\n,;]/g, " ");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShowUp//College Events Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:showup-${event.id}@showup.app`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanSummary}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
