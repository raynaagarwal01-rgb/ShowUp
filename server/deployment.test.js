import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { after, test } from "node:test";
import app from "../api/index.js";

let server;
let baseUrl;

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});

test("Vercel sends API paths to the function before the SPA rewrite", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.framework, "vite");
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(config.outputDirectory, "dist");
  assert.deepEqual(config.rewrites, [
    { source: "/api/:path*", destination: "/api" },
    { source: "/(.*)", destination: "/index.html" },
  ]);
});

test("API import starts no listener or database startup query", () => {
  const imported = spawnSync(process.execPath, [
    "--input-type=module", "-e", "await import(process.argv[1])",
    new URL("../api/index.js", import.meta.url).href,
  ], { encoding: "utf8", timeout: 3000 });
  assert.equal(imported.status, 0, imported.stderr || imported.error?.message);
});

test("Express API returns JSON validation and auth errors without database access", async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  for (const path of ["signup", "login"]) {
    const response = await fetch(`${baseUrl}/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("content-type").split(";")[0], "application/json");
  }

  for (const [path, status] of [["/api/auth/me", 401], ["/api/unknown", 404]]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("content-type").split(";")[0], "application/json");
  }
});
