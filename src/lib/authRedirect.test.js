import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnTo } from "./authRedirect.ts";

const origin = "https://showup.example";

test("accepts allowed local paths with query and hash", () => {
  assert.equal(safeReturnTo("/events/42?tab=qa#question", origin), "/events/42?tab=qa#question");
  assert.equal(safeReturnTo("/dashboard", origin), "/dashboard");
  assert.equal(safeReturnTo("/organizer/new", origin), "/organizer/new");
});

test("rejects external, malformed, and unsupported paths", () => {
  for (const value of ["https://attacker.example/events", "//attacker.example/events", "javascript:alert(1)", "/\\attacker.example", "/profile"]) {
    assert.equal(safeReturnTo(value, origin), null, value);
  }
});
