import assert from "node:assert/strict";
import { after, test } from "node:test";
import { pool } from "./db.js";
import { checkPassword, hashPassword, requireAuth, validatePassword } from "./auth.js";

after(() => pool.end());

test("bcrypt accepts the right password and rejects the wrong one", async () => {
  const hash = await hashPassword("correct horse");
  assert.notEqual(hash, "correct horse");
  assert.equal(await checkPassword("correct horse", hash), true);
  assert.equal(await checkPassword("wrong password", hash), false);
});

test("password validation enforces type, minimum characters, and bcrypt byte limit", () => {
  assert.throws(() => validatePassword(123), /Password must be text/);
  assert.throws(() => validatePassword("short"), /at least 6/);
  assert.throws(() => validatePassword("é".repeat(37)), /at most 72 bytes/);
  assert.equal(validatePassword("é".repeat(36)).length, 36);
});

test("requireAuth rejects absent and malformed bearer tokens without querying", async () => {
  const originalQuery = pool.query;
  pool.query = () => { throw new Error("unexpected database query"); };
  try {
    for (const authorization of [undefined, "Bearer not-a-token"]) {
      const error = await new Promise((resolve) => requireAuth({ headers: { authorization } }, {}, resolve));
      assert.equal(error.status, 401);
    }
  } finally {
    pool.query = originalQuery;
  }
});

test("requireAuth rejects expired, revoked, and unknown sessions from the SQL result", async () => {
  const originalQuery = pool.query;
  pool.query = async (sql, values) => {
    assert.match(sql, /session_expires_at > UTC_TIMESTAMP\(\)/);
    assert.equal(values[0].length, 64);
    return [[], []];
  };
  try {
    for (const token of ["a".repeat(64), "b".repeat(64), "c".repeat(64)]) {
      const error = await new Promise((resolve) => requireAuth({
        headers: { authorization: `Bearer ${token}` },
      }, {}, resolve));
      assert.equal(error.status, 401);
    }
  } finally {
    pool.query = originalQuery;
  }
});

test("requireAuth loads public user fields and propagates SQL errors", async () => {
  const originalQuery = pool.query;
  const user = { id: 7, name: "A", role: "organizer" };
  pool.query = async (sql) => {
    assert.doesNotMatch(sql, /password_hash|session_token_hash\s*,|session_expires_at\s*,/);
    return [[user], []];
  };
  try {
    const req = { headers: { authorization: `Bearer ${"d".repeat(64)}` } };
    await new Promise((resolve, reject) => requireAuth(req, {}, (err) => err ? reject(err) : resolve()));
    assert.equal(req.user, user);
    assert.equal(req.user.role, "organizer");

    const failure = new Error("database unavailable");
    pool.query = async () => { throw failure; };
    const forwarded = await new Promise((resolve) => requireAuth(
      { headers: { authorization: `Bearer ${"e".repeat(64)}` } }, {}, resolve,
    ));
    assert.equal(forwarded, failure);
  } finally {
    pool.query = originalQuery;
  }
});
