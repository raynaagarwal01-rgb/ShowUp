import { Router } from "express";
import { pool } from "../db.js";
import { checkPassword, createSession, hashPassword, requireAuth, validatePassword } from "../auth.js";
import { HttpError, optionalText, requireText } from "../helpers.js";

export const authRouter = Router();

const USER_COLUMNS = "id, name, email, role, college, reg_no, created_at";

// POST /api/auth/signup  { name, email, password, role, college, reg_no }
authRouter.post("/signup", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw new HttpError(400, "Invalid request body.");
  if (typeof req.body.name !== "string") throw new HttpError(400, "Name must be text.");
  const name = requireText(req.body.name, "Name", 100);
  if (typeof req.body?.email !== "string") throw new HttpError(400, "Email must be text.");
  const email = requireText(req.body.email, "Email", 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
  const password = validatePassword(req.body?.password);
  if (req.body?.role != null && !["student", "organizer"].includes(req.body.role)) {
    throw new HttpError(400, "Role must be student or organizer.");
  }
  const role = req.body?.role || "student";
  if ((req.body.college != null && typeof req.body.college !== "string") ||
      (req.body.reg_no != null && typeof req.body.reg_no !== "string")) {
    throw new HttpError(400, "College and registration number must be text.");
  }
  const college = optionalText(req.body.college, "College", 150);
  const regNo = optionalText(req.body.reg_no, "Registration number", 30);

  const passwordHash = await hashPassword(password);
  let result;
  try {
    [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, college, reg_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, role, college, regNo],
    );
  } catch (err) {
    // The UNIQUE constraint on users.email rejects a second account.
    if (err.code === "ER_DUP_ENTRY") throw new HttpError(409, "An account with this email already exists.");
    throw err;
  }

  const [[user]] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [result.insertId]);
  res.status(201).json({ token: await createSession(user), user });
});

// POST /api/auth/login  { email, password }
authRouter.post("/login", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw new HttpError(400, "Invalid request body.");
  if (typeof req.body?.email !== "string") throw new HttpError(400, "Email must be text.");
  const email = requireText(req.body.email, "Email", 255).toLowerCase();
  const password = validatePassword(req.body?.password);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");

  const [[row]] = await pool.query(`SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = ?`, [email]);
  if (!row || !(await checkPassword(password, row.password_hash))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const { password_hash: _hash, ...user } = row;
  res.json({ token: await createSession(user), user });
});

// GET /api/auth/me — who is signed in (used when the page reloads)
authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
authRouter.post("/logout", requireAuth, async (req, res) => {
  await pool.query(
    `UPDATE users SET session_token_hash = NULL, session_expires_at = NULL
     WHERE id = ? AND session_token_hash = ?`,
    [req.user.id, req.sessionTokenHash],
  );
  res.json({ ok: true });
});
