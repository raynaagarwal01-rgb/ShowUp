import type { EventRecord } from "../types";

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString(
    undefined,
    { hour: "numeric", minute: "2-digit" },
  )}`;
}

export function formatFee(fee: number): string {
  return fee === 0 ? "Free" : `₹${fee.toLocaleString("en-IN")}`;
}

export function formatTeamSize(min: number, max: number): string {
  if (max <= 1) return "Solo";
  if (min === max) return `Team of ${max}`;
  return `Team of ${min}-${max}`;
}

export function timeUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "Closed";
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  return `${Math.max(hours, 1)}h left`;
}

export const isTeamEvent = (event: Pick<EventRecord, "team_max">) => event.team_max > 1;

export const deadlinePassed = (event: Pick<EventRecord, "registration_deadline">) =>
  new Date(event.registration_deadline).getTime() < Date.now();

/** Banner colour for an event card, picked from its category (purely visual). */
export function bannerHue(event: Pick<EventRecord, "category" | "id">): number {
  const hues: Record<string, number> = { Hackathon: 18, Workshop: 265, Competition: 340, Cultural: 30, Talk: 200 };
  return (hues[event.category] ?? 155) + (event.id % 4) * 8;
}

// QR tickets carry the registration id, e.g. "SHOWUP-REG-42".
export const ticketCode = (registrationId: number) => `SHOWUP-REG-${registrationId}`;

/** Reads a registration id from a scanned QR code or a typed "42" / "SHOWUP-REG-42". */
export function parseTicketCode(text: string): number | null {
  const match = /^(?:SHOWUP-REG-)?(\d+)$/i.exec(text.trim());
  return match ? Number(match[1]) : null;
}
