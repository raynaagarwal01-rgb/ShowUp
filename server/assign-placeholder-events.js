import assert from "node:assert/strict";
import { pool, transaction } from "./db.js";

const email = process.argv[2];

try {
  assert.equal(process.argv.length, 3, "Usage: node server/assign-placeholder-events.js <organizer-email>");
  assert.match(email || "", /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid organizer email address.");

  const count = await transaction(async (conn) => {
    const [[organizer]] = await conn.query("SELECT id, role FROM users WHERE email = ? FOR UPDATE", [email]);
    assert.ok(organizer, "Organizer account not found.");
    assert.equal(organizer.role, "organizer", "Account must have the organizer role.");

    const [update] = await conn.query(
      `UPDATE events AS e JOIN users AS demo ON demo.id = e.organizer_id
       SET e.organizer_id = ?
       WHERE demo.email = ? AND demo.password_hash = '!' AND e.description LIKE ?`,
      [organizer.id, "placeholder-events@showup.invalid", "%Placeholder event for demonstration only.%"],
    );
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM events WHERE organizer_id = ? AND description LIKE ?",
      [organizer.id, "%Placeholder event for demonstration only.%"],
    );
    assert.ok([0, 10].includes(update.affectedRows) && count === 10, "Expected exactly 10 placeholder events.");
    return count;
  });

  console.log(`Assigned ${count} placeholder events to ${email}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
