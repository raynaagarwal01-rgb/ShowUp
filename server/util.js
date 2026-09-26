import crypto from "node:crypto";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const unauthorized = (msg = "Please sign in.") => new HttpError(401, msg);
export const forbidden = (msg = "You don't have permission to do that.") => new HttpError(403, msg);
export const notFound = (msg = "Not found.") => new HttpError(404, msg);
export const conflict = (msg) => new HttpError(409, msg);

export function newId(prefix = "") {
  const raw = crypto.randomUUID();
  return prefix ? `${prefix}_${raw}` : raw;
}

/** Same alphabet as the original client-side generator (no 0/O/1/I). */
export function joinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function isDuplicateKey(err) {
  return err && err.code === "ER_DUP_ENTRY";
}

/** Trim a value to a string, or return null for blank/undefined. */
export function optionalString(value, max = 1000) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

export function requireString(value, label, max = 1000) {
  const s = value === undefined || value === null ? "" : String(value).trim();
  if (!s) throw badRequest(`${label} is required.`);
  return s.slice(0, max);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 255) throw badRequest("Enter a valid email address.");
  return email;
}

export function parseDate(value, label) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) throw badRequest(`${label} is not a valid date.`);
  return d;
}

/** Escape a value for use inside a SQL LIKE pattern. */
export function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
