// Password hashing (bcrypt) and login tokens (JWT).
//
// After login the browser keeps the token and sends it on every request as
//   Authorization: Bearer <token>
// The token is signed with JWT_SECRET, so the server can trust the user id and
// role inside it without a sessions table. Logging out = the browser deletes it.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { HttpError } from "./helpers.js";

const TOKEN_EXPIRY = "7d";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/** Middleware: rejects the request unless it carries a valid token, and sets
 * req.user = { id, name, role }. */
export function requireAuth(req, _res, next) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!match) return next(new HttpError(401, "Please sign in."));
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    req.user = { id: payload.id, name: payload.name, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, "Your session has expired. Please sign in again."));
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
