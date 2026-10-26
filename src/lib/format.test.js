import assert from "node:assert/strict";
import test from "node:test";
import { parseTicketCode } from "./format.ts";

test("parseTicketCode accepts trimmed raw ids and ShowUp codes", () => {
  assert.equal(parseTicketCode("42"), 42);
  assert.equal(parseTicketCode("  showup-reg-42  "), 42);
});

test("parseTicketCode rejects invalid or out-of-range ids", () => {
  for (const value of ["", "-1", "0", "2147483648", "9007199254740992", "1.5", "garbage"]) {
    assert.equal(parseTicketCode(value), null, value);
  }
});
