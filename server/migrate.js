// npm run db:init — creates the database (if needed) and applies sql/schema.sql.
// Safe to re-run: every statement is CREATE ... IF NOT EXISTS.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { config } from "./config.js";

const { database, ...connection } = config.db;
if (!/^[A-Za-z0-9_]+$/.test(database)) {
  console.error(`DB_NAME "${database}" may only contain letters, digits and underscores.`);
  process.exit(1);
}

const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../sql/schema.sql");
// schema.sql names its own database so it works with `mysql < schema.sql`; here
// we swap that for whatever DB_NAME says.
const schema = fs
  .readFileSync(schemaPath, "utf8")
  .replace(/CREATE DATABASE[^;]*;/i, "")
  .replace(/^USE\s+\w+\s*;/im, "");

let conn;
try {
  conn = await mysql.createConnection({ ...connection, multipleStatements: true });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  );
  await conn.query(`USE \`${database}\``);
  await conn.query(schema);
  const [tables] = await conn.query("SHOW TABLES");
  console.log(`Schema applied to "${database}". Tables: ${tables.map((t) => Object.values(t)[0]).join(", ")}`);
} catch (err) {
  console.error(`Could not apply the schema: ${err.code || ""} ${err.message}`);
  if (err.code === "ER_ACCESS_DENIED_ERROR") console.error("Check DB_USER / DB_PASSWORD in .env.");
  if (err.code === "ECONNREFUSED") console.error(`Is MySQL running on ${connection.host}:${connection.port}?`);
  process.exitCode = 1;
} finally {
  await conn?.end();
}
