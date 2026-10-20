import { Router } from "express";
import { pool } from "../db.js";
import { checkPassword, hashPassword, requireAuth, signToken } from "../auth.js";
import { HttpError, optionalText, requireText } from "../helpers.js";

export const authRouter = Router();

const USER_COLUMNS = "id, name, email, role, college, reg_no, created_at";

// POST /api/auth/signup  { name, email, password, role, college, reg_no }
authRouter.post("/signup", async (req, res) => {
  const name = requireText(req.body.name, "Name", 100);
  const email = requireText(req.body.email, "Email", 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
  const password = String(req.body.password ?? "");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  const role = req.body.role === "organizer" ? "organizer" : "student";
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
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login  { email, password }
authRouter.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  const [[row]] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  if (!row || !(await checkPassword(password, row.password_hash))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const { password_hash: _hash, ...user } = row;
  res.json({ token: signToken(user), user });
});

// GET /api/auth/me — who is signed in (used when the page reloads)
authRouter.get("/me", requireAuth, async (req, res) => {
  const [[user]] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [req.user.id]);
  if (!user) throw new HttpError(401, "This account no longer exists.");
  res.json({ user });
});
