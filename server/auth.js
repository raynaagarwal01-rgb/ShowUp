import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { query } from "./db.js";
import { forbidden, randomToken, sha256, unauthorized } from "./util.js";

const BCRYPT_ROUNDS = 10;

// Compared against when an email doesn't exist, so a failed login takes about
// as long whether or not the account is real (no account enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash || DUMMY_HASH).then((ok) => Boolean(hash) && ok);
}

/** Create a login session and return the bearer token. Only its SHA-256 is stored. */
export async function createSession(userId, conn) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);
  await query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    [sha256(token), userId, expiresAt],
    conn,
  );
  return token;
}

export async function destroySession(token) {
  await query("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : null;
}

/** Populates req.user (a full profiles row) and req.token when a valid session
 * is presented; otherwise req.user is null. Never rejects on its own. */
export async function attachUser(req, _res, next) {
  req.user = null;
  req.token = null;
  const token = bearerToken(req);
  if (token) {
    const rows = await query(
      `SELECT p.* FROM sessions s
         JOIN profiles p ON p.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)`,
      [sha256(token)],
    );
    if (rows.length) {
      req.user = rows[0];
      req.token = token;
    }
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

export const isOrganizerRole = (user) => user?.role === "organizer" || user?.role === "admin";

export function requireOrganizer(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (!isOrganizerRole(req.user)) return next(forbidden("Only organizers can do that."));
  next();
}

/** Simple in-memory fixed-window limiter for the credential endpoints. */
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many attempts. Please wait a bit and try again." });
    }
    next();
  };
}
