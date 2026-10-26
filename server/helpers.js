// Small helpers shared by the route files: an error type that carries an HTTP
// status, and input validation for request bodies.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Required text field: trimmed, non-empty, at most `max` characters. */
export function requireText(value, label, max) {
  const text = String(value ?? "").trim();
  if (!text) throw new HttpError(400, `${label} is required.`);
  if (text.length > max) throw new HttpError(400, `${label} must be at most ${max} characters.`);
  return text;
}

/** Optional text field: returns null when blank. */
export function optionalText(value, label, max) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length > max) throw new HttpError(400, `${label} must be at most ${max} characters.`);
  return text;
}

export function requireInt(value, label, min, max = 1_000_000) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${label} must be a whole number between ${min} and ${max}.`);
  }
  return n;
}

export function requireDate(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1000 || date.getUTCFullYear() > 9999) {
    throw new HttpError(400, `${label} is not a valid date.`);
  }
  return date;
}

/** Route parameters like :id must be positive integers. */
export function idParam(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, "Not found.");
  return id;
}
