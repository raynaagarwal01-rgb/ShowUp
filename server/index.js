// ShowUp API server: Express + MySQL.
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbConfig, pool } from "./db.js";
import { HttpError } from "./helpers.js";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { registrationsRouter } from "./routes/registrations.js";
import { teamsRouter } from "./routes/teams.js";
import { communityRouter } from "./routes/community.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy .env.example to .env and set JWT_SECRET to a long random string.");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "100kb" }));

const api = express.Router();
api.use("/auth", authRouter);
api.use(eventsRouter);
api.use(registrationsRouter);
api.use(teamsRouter);
api.use(communityRouter);
api.use((_req, res) => res.status(404).json({ error: "Not found." }));
app.use("/api", api);

// After `npm run build`, the same server also serves the React app.
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (fs.existsSync(path.join(distDir, "index.html"))) {
  app.use(express.static(distDir));
  app.get("/{*path}", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// One place that turns errors into JSON responses. Express 5 forwards errors
// thrown inside async route handlers here automatically.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON in request." });
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "That already exists." });
  if (["ECONNREFUSED", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE"].includes(err.code)) {
    console.error(`[db] ${err.code}: ${err.message}`);
    return res.status(503).json({ error: "The database is unavailable. Check .env and run `npm run db:init`." });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, async () => {
  console.log(`ShowUp API listening on http://localhost:${port}`);
  try {
    await pool.query("SELECT 1 FROM users LIMIT 1");
    console.log(`Connected to MySQL database "${dbConfig.database}".`);
  } catch (err) {
    console.error(`Could not use MySQL database "${dbConfig.database}": ${err.code || err.message}. Run: npm run db:init`);
  }
});
