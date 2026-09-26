import { Router } from "express";
import { config } from "../config.js";
import { query, tx } from "../db.js";
import {
  createSession,
  destroySession,
  hashPassword,
  rateLimit,
  requireAuth,
  verifyPassword,
} from "../auth.js";
import { mapProfile } from "../mappers.js";
import { sendResendEmail } from "../notify.js";
import {
  badRequest,
  conflict,
  escapeHtml,
  isDuplicateKey,
  newId,
  normalizeEmail,
  optionalString,
  randomToken,
  requireString,
  sha256,
  unauthorized,
} from "../util.js";

export const authRouter = Router();

// Credential endpoints get a per-IP throttle.
const credentialLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 40 });

function checkPassword(password) {
  if (typeof password !== "string" || password.length < 6) {
    throw badRequest("Password must be at least 6 characters.");
  }
  if (password.length > 200) throw badRequest("Password is too long.");
}

authRouter.post("/signup", credentialLimit, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  checkPassword(req.body.password);
  const name = requireString(req.body.name, "Name", 255);
  // Anyone can register as a student or an organizer; admin is never self-serve.
  const role = req.body.role === "organizer" ? "organizer" : "student";

  const existing = await query("SELECT id, password_hash FROM profiles WHERE email = ?", [email]);
  if (existing.length) {
    throw conflict(
      existing[0].password_hash
        ? "An account with this email already exists."
        : 'An account with this email already exists. Use "Forgot password" to set a password for it.',
    );
  }

  const id = newId();
  const passwordHash = await hashPassword(req.body.password);
  try {
    await query(
      `INSERT INTO profiles (id, email, password_hash, name, role, college, branch, year, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email,
        passwordHash,
        name,
        role,
        optionalString(req.body.college, 255),
        optionalString(req.body.branch, 255),
        optionalString(req.body.year, 50),
        optionalString(req.body.phone, 50),
      ],
    );
  } catch (err) {
    if (isDuplicateKey(err)) throw conflict("An account with this email already exists.");
    throw err;
  }

  const [profile] = await query("SELECT * FROM profiles WHERE id = ?", [id]);
  const token = await createSession(id);
  res.status(201).json({ token, user: mapProfile(profile) });
});

authRouter.post("/login", credentialLimit, async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const [profile] = await query("SELECT * FROM profiles WHERE email = ?", [email]);

  const ok = await verifyPassword(password, profile?.password_hash);
  if (!profile || !ok) throw unauthorized("Invalid email or password.");

  const token = await createSession(profile.id);
  res.json({ token, user: mapProfile(profile) });
});

authRouter.post("/logout", async (req, res) => {
  if (req.token) await destroySession(req.token);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: mapProfile(req.user) });
});

// Only these columns can be edited. Role, email, and id are deliberately absent:
// nobody can promote themselves to organizer/admin through a profile update.
const EDITABLE_PROFILE_FIELDS = {
  name: 255,
  state: 100,
  city: 100,
  college: 255,
  branch: 255,
  year: 50,
  phone: 50,
  reg_no: 50,
  bio: 5000,
  github: 255,
  linkedin: 255,
};

authRouter.patch("/profile", requireAuth, async (req, res) => {
  const sets = [];
  const values = [];
  for (const [field, max] of Object.entries(EDITABLE_PROFILE_FIELDS)) {
    if (req.body[field] === undefined) continue;
    if (field === "name") {
      sets.push("name = ?");
      values.push(requireString(req.body.name, "Name", max));
    } else {
      sets.push(`${field} = ?`);
      // Empty string stays an empty string (matches what the client sent before).
      values.push(req.body[field] === null ? null : String(req.body[field]).trim().slice(0, max));
    }
  }
  if (sets.length) {
    await query(`UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`, [...values, req.user.id]);
  }
  const [profile] = await query("SELECT * FROM profiles WHERE id = ?", [req.user.id]);
  res.json({ user: mapProfile(profile) });
});

// Always answers { ok: true } whether or not the email has an account, so this
// can't be used to discover who is registered.
authRouter.post("/forgot", credentialLimit, async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const [profile] = await query("SELECT id, name FROM profiles WHERE email = ?", [email]);

  if (profile) {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + config.passwordResetMinutes * 60 * 1000);
    await query("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [
      sha256(token),
      profile.id,
      expiresAt,
    ]);

    const link = `${config.appUrl}/reset-password?token=${token}`;
    const result = await sendResendEmail({
      to: email,
      subject: "Reset your ShowUp password",
      html: `<p>Hi ${escapeHtml(profile.name)},</p>
             <p>Use the link below to choose a new ShowUp password. It works once and expires in ${config.passwordResetMinutes} minutes.</p>
             <p><a href="${link}">Reset my password</a></p>
             <p>If you didn't ask for this, you can ignore this email.</p>`,
    });

    if (result.status === "skipped_not_configured") {
      // No email provider set up. In development, print the link so the flow can
      // still be completed; in production never write the secret to logs.
      if (config.isProduction) {
        console.warn("[password-reset] RESEND_API_KEY is not set — reset email was not sent.");
      } else {
        console.info(`[password-reset] No email provider configured. Reset link for ${email}:\n  ${link}`);
      }
    } else if (result.status === "failed") {
      console.error("[password-reset] email send failed:", result.detail);
    }
  }
  res.json({ ok: true });
});

authRouter.post("/reset", credentialLimit, async (req, res) => {
  checkPassword(req.body.password);
  const tokenHash = sha256(String(req.body.token ?? ""));
  const passwordHash = await hashPassword(req.body.password);

  const result = await tx(async (conn) => {
    const [reset] = await query(
      `SELECT user_id FROM password_resets
        WHERE token_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP(3)
        FOR UPDATE`,
      [tokenHash],
      conn,
    );
    if (!reset) return null;

    await query("UPDATE password_resets SET used_at = UTC_TIMESTAMP(3) WHERE token_hash = ?", [tokenHash], conn);
    await query("UPDATE profiles SET password_hash = ? WHERE id = ?", [passwordHash, reset.user_id], conn);
    // Kick out every existing session — whoever knew the old password is signed out.
    await query("DELETE FROM sessions WHERE user_id = ?", [reset.user_id], conn);
    const token = await createSession(reset.user_id, conn);
    const [profile] = await query("SELECT * FROM profiles WHERE id = ?", [reset.user_id], conn);
    return { token, profile };
  });

  if (!result) throw badRequest("This reset link isn't valid. It may have expired or already been used.");
  res.json({ token: result.token, user: mapProfile(result.profile) });
});
