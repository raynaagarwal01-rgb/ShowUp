// Runs .sql files from the sql/ folder against the database named in .env.
//
//   node server/run-sql.js schema.sql            (npm run db:init)
//   node server/run-sql.js seed.sql              (npm run db:seed)
//   node server/run-sql.js reset.sql schema.sql seed.sql   (npm run db:reset)
//
// Same result as `mysql -u root -p showup < sql/<file>`, for people who don't
// have the mysql client on their PATH.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { dbConfig } from "./db.js";

const files = process.argv.slice(2);
const sqlDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../sql");
const { database, ...connection } = dbConfig;

if (!/^\w+$/.test(database)) {
  console.error(`DB_NAME "${database}" may only contain letters, digits and underscores.`);
  process.exit(1);
}

// reset.sql drops every table, so only allow it against a local server.
const isLocal = ["127.0.0.1", "localhost", "::1"].includes(connection.host);
if (files.includes("reset.sql") && (!isLocal || process.env.NODE_ENV === "production")) {
  console.error("Refusing to run reset.sql: it is only for a local development database (DB_HOST=localhost).");
  process.exit(1);
}

let conn;
try {
  conn = await mysql.createConnection({ ...connection, multipleStatements: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await conn.query(`USE \`${database}\``);
  await conn.query("SET time_zone = '+00:00'");

  for (const file of files) {
    // schema.sql names its own database so it also works with the mysql
    // client; here we use DB_NAME instead.
    const sql = fs
      .readFileSync(path.join(sqlDir, file), "utf8")
      .replace(/^CREATE DATABASE[^;]*;/im, "")
      .replace(/^USE\s+\w+\s*;/im, "");
    await conn.query(sql);
    console.log(`Ran sql/${file} on database "${database}".`);
  }
} catch (err) {
  console.error(`SQL failed: ${err.code || ""} ${err.message}`);
  if (err.code === "ER_DUP_ENTRY") console.error("The seed data is already loaded. Use `npm run db:reset` for a fresh copy.");
  if (err.code === "ER_ACCESS_DENIED_ERROR") console.error("Check DB_USER / DB_PASSWORD in .env.");
  if (err.code === "ECONNREFUSED") console.error(`Is MySQL running on ${connection.host}:${connection.port}?`);
  process.exitCode = 1;
} finally {
  await conn?.end();
}
