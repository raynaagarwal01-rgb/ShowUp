export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dateFmt)} · ${start.toLocaleTimeString(
      undefined,
      timeFmt,
    )} - ${end.toLocaleTimeString(undefined, timeFmt)}`;
  }
  return `${start.toLocaleDateString(undefined, dateFmt)} - ${end.toLocaleDateString(
    undefined,
    dateFmt,
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
