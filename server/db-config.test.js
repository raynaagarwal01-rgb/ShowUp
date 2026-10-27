import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const configFor = (ca) => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import { dbConfig } from "./server/db.js";
    console.log(JSON.stringify(dbConfig.ssl ?? null));
  `], { encoding: "utf8", env: { ...process.env, DB_SSL_CA: ca } });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};

test("DB SSL CA enables verified TLS and supports escaped or actual newlines", () => {
  assert.equal(configFor(""), null);
  for (const ca of ["-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----", "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----"]) {
    assert.deepEqual(configFor(ca), {
      ca: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
      rejectUnauthorized: true,
      verifyIdentity: true,
    });
  }
});
