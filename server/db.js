// MySQL connection pool. Every query in the app goes through `pool` using `?`
// placeholders, so user input is never pasted into SQL text.
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ quiet: true });

export const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "showup",
};

export const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  // Store and read every date as UTC so the browser can show it in local time.
  timezone: "Z",
});

pool.pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

/**
 * Runs `work(conn)` inside a transaction on one connection:
 *   START TRANSACTION -> work -> COMMIT   (or ROLLBACK if anything throws)
 * Used for registration, team create/join and cancellation, where several
 * statements must succeed or fail together.
 */
export async function transaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
