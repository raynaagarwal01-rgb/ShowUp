import mysql from "mysql2/promise";
import { config } from "./config.js";

// timezone "Z": DATETIME columns hold UTC. mysql2 then reads them as UTC Dates
// (which serialise to ISO strings) and writes Dates back out as UTC.
export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  timezone: "Z",
});

// Column defaults like CURRENT_TIMESTAMP use the *session* time zone, so pin
// every pooled connection to UTC to keep stored timestamps consistent.
pool.pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

/** Run a parameterised query and return the rows. Values always go through
 * `?` placeholders — never string-concatenate user input into SQL. */
export async function query(sql, params = [], conn = pool) {
  const [rows] = await conn.query(sql, params);
  return rows;
}

/** Run `fn(conn)` inside a transaction; commits on success, rolls back on any
 * throw. Use SELECT ... FOR UPDATE inside for the check-then-write flows
 * (seat counts, team capacity) so concurrent requests can't oversell. */
export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
