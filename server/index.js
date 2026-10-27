// ShowUp standalone API server: listener and startup database check.
import { dbConfig, pool } from "./db.js";
import app from "./app.js";

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
