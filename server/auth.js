// Password hashing (bcrypt) and SQL-backed bearer sessions.
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import { HttpError } from "./helpers.js";

const USER_COLUMNS = "id, name, email, role, college, reg_no, created_at";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function validatePassword(value) {
  if (typeof value !== "string") throw new HttpError(400, "Password must be text.");
  if (value.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  if (Buffer.byteLength(value, "utf8") > 72) throw new HttpError(400, "Password must be at most 72 bytes.");
  return value;
}

export async function createSession(user) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  // shortcut: one active login per account, use a sessions table if concurrent devices are needed.
  await pool.query(
    `UPDATE users SET session_token_hash = ?,
       session_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY)
     WHERE id = ?`,
    [tokenHash, user.id],
  );
  return token;
}

/** Middleware: rejects requests without a live SQL session and loads the current role. */
export async function requireAuth(req, _res, next) {
  const match = /^Bearer ([a-f\d]{64})$/i.exec(req.headers.authorization || "");
  if (!match) return next(new HttpError(401, "Please sign in."));
  const tokenHash = createHash("sha256").update(match[1]).digest("hex");
  try {
    const [[user]] = await pool.query(
      `SELECT ${USER_COLUMNS} FROM users
       WHERE session_token_hash = ? AND session_expires_at > UTC_TIMESTAMP()`,
      [tokenHash],
    );
    if (!user) return next(new HttpError(401, "Your session has expired. Please sign in again."));
    req.user = user;
    req.sessionTokenHash = tokenHash;
    next();
  } catch (err) {
    next(err);
  }
}

/** Middleware for organizer-only routes (use after requireAuth). */
export function requireOrganizer(req, _res, next) {
  if (req.user.role !== "organizer") return next(new HttpError(403, "Only organizers can do that."));
  next();
}

/** Middleware for student-only routes such as registering (use after requireAuth). */
export function requireStudent(req, _res, next) {
  if (req.user.role !== "student") return next(new HttpError(403, "Only student accounts can register for events."));
  next();
}
