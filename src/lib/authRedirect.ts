export const safeReturnTo = (value: string | null, origin: string): string | null => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    if (["/events", "/dashboard", "/organizer"].some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }
  return null;
};
