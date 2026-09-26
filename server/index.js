import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { pool } from "./db.js";
import { attachUser } from "./auth.js";
import { HttpError } from "./util.js";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { registrationsRouter } from "./routes/registrations.js";
import { teamsRouter } from "./routes/teams.js";
import { usersRouter } from "./routes/users.js";
import { communityRouter } from "./routes/community.js";
import { notificationsRouter } from "./routes/notifications.js";
import { organizerRouter } from "./routes/organizer.js";

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : process.env.TRUST_PROXY);

app.use((_req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" });
  next();
});
app.use(express.json({ limit: "100kb" }));

const api = express.Router();
api.use(attachUser);
api.get("/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});
api.use("/auth", authRouter);
api.use(eventsRouter);
api.use(registrationsRouter);
api.use(teamsRouter);
api.use(usersRouter);
api.use(communityRouter);
api.use(notificationsRouter);
api.use(organizerRouter);
api.use((_req, res) => res.status(404).json({ error: "Not found." }));
app.use("/api", api);

// In production the built React app is served from here too, so one process
// (and one origin) handles both the site and the API.
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (fs.existsSync(path.join(distDir, "index.html"))) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

const DB_DOWN_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_NO_SUCH_TABLE",
]);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON in request." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (DB_DOWN_CODES.has(err.code)) {
    console.error(`[db] ${err.code}: ${err.message}`);
    return res.status(503).json({
      error: "The database is unavailable. Check the DB_* settings in .env and that you've run `npm run db:init`.",
    });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(config.port, async () => {
  console.log(`ShowUp API listening on http://localhost:${config.port}`);
  try {
    await pool.query("SELECT 1 FROM profiles LIMIT 1");
    console.log(`Connected to MySQL database "${config.db.database}" on ${config.db.host}:${config.db.port}.`);
  } catch (err) {
    console.error(
      `\n! Could not use MySQL database "${config.db.database}" at ${config.db.host}:${config.db.port}: ${err.code || err.message}\n` +
        `  Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in .env, then run: npm run db:init\n`,
    );
  }
});
