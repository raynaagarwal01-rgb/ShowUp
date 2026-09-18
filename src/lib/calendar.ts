import type { EventRecord } from "../types";

function formatUtcDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function getGoogleCalendarUrl(event: EventRecord): string {
  const startUtc = formatUtcDate(event.start_at);
  const endUtc = formatUtcDate(event.end_at);
  const location = `${event.venue}, ${event.college}, ${event.city}`;
  const details = `${event.tagline}\n\n${event.description}\n\nVenue: ${location}\nRegistration via Feastify: https://feastify-gamma.vercel.app/events/${event.id}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startUtc}/${endUtc}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(event: EventRecord): void {
  const startUtc = formatUtcDate(event.start_at);
  const endUtc = formatUtcDate(event.end_at);
  const nowUtc = formatUtcDate(new Date().toISOString());
  const location = `${event.venue}, ${event.college}, ${event.city}`.replace(/[,;]/g, " ");
  const cleanTitle = event.title.replace(/[\r\n]/g, " ");
  const cleanSummary = (event.tagline || event.title).replace(/[\r\n]/g, " ");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Feastify//College Events Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:feastify-${event.id}@feastify.app`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
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
