import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import mysql from "mysql2/promise";

const database = process.env.SHOWUP_TEST_DATABASE;
const enabled = /^showup_test_[a-z0-9_]+$/.test(database || "");

test("three-table MySQL API integration", { skip: !enabled && "Set SHOWUP_TEST_DATABASE to a dedicated showup_test_* database." }, async () => {
  const env = { ...process.env, DB_NAME: database };
  const db = await mysql.createConnection({
    host: env.DB_HOST || "127.0.0.1",
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  await db.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  await db.query(`USE \`${database}\``);
  const schema = (await readFile(new URL("../sql/schema.sql", import.meta.url), "utf8"))
    .replace(/^CREATE DATABASE[^;]*;/im, "")
    .replace(/^USE\s+\w+\s*;/im, "");
  const authUpgrade = (await readFile(new URL("../sql/auth-upgrade.sql", import.meta.url), "utf8"))
    .replace(/^USE\s+\w+\s*;/im, "");
  await db.query(`${schema}\n${authUpgrade}`);
  const [[{ tables }]] = await db.query(
    "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'",
    [database],
  );
  assert.equal(tables, 3, "the test database must contain exactly users, events, and registrations");

  const port = 3081;
  const server = spawn(process.execPath, ["server/index.js"], { cwd: process.cwd(), env: { ...env, PORT: String(port) }, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/api`;
  const accountSuffix = randomUUID().slice(0, 8);
  const request = async (path, { token, ...options } = {}) => {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const body = await response.json();
    return { status: response.status, body };
  };
  const post = (path, body, token) => request(path, { method: "POST", body: JSON.stringify(body), token });
  const put = (path, body, token) => request(path, { method: "PUT", body: JSON.stringify(body), token });
  const auth = (email, password = "fixturepassword123") => post("/auth/login", { email, password });
  const eventInput = (overrides = {}) => ({
    title: "Core Test Event",
    description: "An individual event used by the core API integration test.",
    category: "Workshop",
    venue: "Test Hall",
    event_date: "2035-06-10T10:00:00.000Z",
    registration_deadline: "2035-06-09T10:00:00.000Z",
    capacity: 10,
    fee: 0,
    ...overrides,
  });

  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (server.exitCode !== null) assert.fail("API server exited before becoming ready.");
      try {
        const response = await fetch(`${base}/events`);
        if (response.ok) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, "API server did not become ready on port 3081");

    const signup = async (name, email, role) => post("/auth/signup", {
      name, email, role, password: "fixturepassword123", college: "Test College", reg_no: role === "student" ? name : null,
    });
    assert.equal((await signup("Bad Email", "not-an-email", "student")).status, 400);
    const organizer1Signup = await signup("Organizer One", `organizer1-${accountSuffix}@test.local`, "organizer");
    const organizer2Signup = await signup("Organizer Two", `organizer2-${accountSuffix}@test.local`, "organizer");
    const student1Signup = await signup("Student One", `student1-${accountSuffix}@test.local`, "student");
    const student2Signup = await signup("Student Two", `student2-${accountSuffix}@test.local`, "student");
    const student3Signup = await signup("Student Three", `student3-${accountSuffix}@test.local`, "student");
    const student4Signup = await signup("Student Four", `student4-${accountSuffix}@test.local`, "student");
    for (const result of [organizer1Signup, organizer2Signup, student1Signup, student2Signup, student3Signup, student4Signup]) {
      assert.equal(result.status, 201);
      assert.ok(result.body.token);
      assert.equal("password_hash" in result.body.user, false);
      assert.equal("session_token_hash" in result.body.user, false);
      assert.equal("session_expires_at" in result.body.user, false);
    }
    assert.equal((await signup("Duplicate", `student1-${accountSuffix}@test.local`, "student")).status, 409);

    const organizer1 = organizer1Signup.body.token;
    const organizer2 = organizer2Signup.body.token;
    let student1 = student1Signup.body.token;
    const student2 = student2Signup.body.token;
    const student3 = student3Signup.body.token;
    assert.equal((await auth(`student1-${accountSuffix}@test.local`, "wrongpassword")).status, 401);

    const login = await auth(`student1-${accountSuffix}@test.local`);
    assert.equal(login.status, 200);
    const oldToken = student1;
    const rotatedToken = login.body.token;
    assert.equal((await request("/auth/me", { token: oldToken })).status, 401);
    const hash = createHash("sha256").update(rotatedToken).digest("hex");
    const [[session]] = await db.query("SELECT session_token_hash, session_expires_at FROM users WHERE id = ?", [student1Signup.body.user.id]);
    assert.equal(session.session_token_hash, hash);
    assert.ok(new Date(session.session_expires_at) > new Date());
    assert.equal((await post("/auth/logout", {}, rotatedToken)).status, 200);
    assert.equal((await request("/auth/me", { token: rotatedToken })).status, 401);
    student1 = (await auth(`student1-${accountSuffix}@test.local`)).body.token;

    const expiringLogin = await auth(`student4-${accountSuffix}@test.local`);
    await db.query("UPDATE users SET session_expires_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE) WHERE id = ?", [student4Signup.body.user.id]);
    assert.equal((await request("/auth/me", { token: expiringLogin.body.token })).status, 401);

    assert.equal((await post("/events", eventInput(), student2)).status, 403);
    assert.equal((await post("/events", null, organizer1)).status, 400);
    assert.equal((await request("/events", {
      method: "POST", token: organizer1, headers: { "content-type": "application/json" }, body: "{",
    })).status, 400);
    assert.equal((await post("/events", eventInput({ registration_deadline: "2035-06-11T10:00:00.000Z" }), organizer1)).status, 400);
    const created = await post("/events", eventInput(), organizer1);
    assert.equal(created.status, 201);
    const eventId = created.body.id;
    assert.equal("team_min" in created.body, false);
    assert.equal((await request(`/events/${eventId}`)).status, 200);
    assert.equal((await request("/events")).body.some((event) => event.id === eventId), true);
    assert.equal((await put(`/events/${eventId}`, eventInput({ title: "Updated Event" }), organizer2)).status, 403);

    const registration = await post(`/events/${eventId}/register`, {}, student1);
    assert.equal(registration.status, 201);
    assert.equal("team_id" in registration.body, false);
    assert.equal((await post(`/events/${eventId}/register`, {}, student1)).status, 409);
    const mine = await request("/my-registrations", { token: student1 });
    assert.equal(mine.status, 200);
    assert.equal(mine.body[0].event.id, eventId);
    assert.equal("team" in mine.body[0], false);
    assert.equal((await request(`/events/${eventId}/registrations`, { token: organizer2 })).status, 403);
    const participants = await request(`/events/${eventId}/registrations`, { token: organizer1 });
    assert.equal(participants.status, 200);
    assert.deepEqual(Object.keys(participants.body[0]).sort(), ["checked_in_at", "college", "email", "id", "name", "reg_no", "registered_at", "status", "user_id"].sort());
    assert.equal((await put(`/events/${eventId}`, eventInput({ capacity: 0 }), organizer1)).status, 400);
    const updated = await put(`/events/${eventId}`, eventInput({ capacity: 2, title: "Updated Event" }), organizer1);
    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, "Updated Event");
    assert.equal((await put(`/events/${eventId}`, eventInput({ capacity: 0 }), organizer1)).status, 400);

    const full = await post("/events", eventInput({ title: "One Seat", capacity: 1 }), organizer1);
    assert.equal(full.status, 201);
    const race = await Promise.all([
      post(`/events/${full.body.id}/register`, {}, student2),
      post(`/events/${full.body.id}/register`, {}, student3),
    ]);
    assert.deepEqual(race.map((result) => result.status).sort(), [201, 409]);
    const winner = race.find((result) => result.status === 201).body;
    assert.equal((await request(`/registrations/${winner.id}`, { method: "DELETE", token: organizer2 })).status, 403);
    assert.equal((await request(`/registrations/${winner.id}`, { method: "DELETE", token: organizer1 })).status, 200);

    const expiring = await post("/events", eventInput({
      title: "Closed Event", registration_deadline: "2000-01-01T00:00:00.000Z", event_date: "2000-01-02T00:00:00.000Z",
    }), organizer1);
    assert.equal(expiring.status, 201);
    assert.equal((await post(`/events/${expiring.body.id}/register`, {}, student2)).status, 400);

    assert.equal((await request(`/registrations/${registration.body.id}`, { method: "DELETE", token: student2 })).status, 403);
    assert.equal((await request(`/registrations/${registration.body.id}`, { method: "DELETE", token: student1 })).status, 200);
    assert.equal((await request(`/registrations/${registration.body.id}`, { method: "DELETE", token: student1 })).status, 200);
    const reregis = await post(`/events/${eventId}/register`, {}, student1);
    assert.equal(reregis.status, 201);
    assert.equal(reregis.body.id, registration.body.id);
    assert.equal((await post(`/registrations/${reregis.body.id}/check-in`, { event_id: full.body.id }, organizer1)).status, 400);
    assert.equal((await post(`/registrations/${reregis.body.id}/check-in`, { event_id: eventId }, organizer2)).status, 404);
    assert.equal((await post(`/registrations/${reregis.body.id}/check-in`, { event_id: eventId }, organizer1)).status, 200);
    assert.equal((await post(`/registrations/${reregis.body.id}/check-in`, { event_id: eventId }, organizer1)).status, 409);

    const removable = await post("/events", eventInput({ title: "Delete Event" }), organizer1);
    assert.equal((await request(`/events/${removable.body.id}`, { method: "DELETE", token: organizer2 })).status, 403);
    assert.equal((await request(`/events/${removable.body.id}`, { method: "DELETE", token: organizer1 })).status, 200);
    assert.equal((await request(`/events/${removable.body.id}`)).status, 404);

    await db.query("UPDATE users SET role = 'organizer' WHERE id = ?", [student2Signup.body.user.id]);
    const currentRole = await post("/events", eventInput({ title: "Role Reload" }), student2);
    assert.equal(currentRole.status, 201, "requireAuth should read the current role from MySQL");
  } finally {
    server.kill("SIGTERM");
    if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2000))]);
    if (server.exitCode === null) server.kill("SIGKILL");
    await db.end();
  }
});
