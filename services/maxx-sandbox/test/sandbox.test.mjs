import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

async function startSandbox() {
  const root = await mkdtemp(path.join(tmpdir(), "maxx-sandbox-"));
  const port = 19000 + Math.floor(Math.random() * 1000);
  const key = "test-sandbox-key-123456";
  const child = spawn(process.execPath, [new URL("../server.mjs", import.meta.url).pathname], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", MAXX_SANDBOX_KEY: key, MAXX_SANDBOX_ROOT: root, MAXX_SANDBOX_MAX_EXEC_SECONDS: "2" },
    stdio: ["ignore", "ignore", "pipe"],
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${base}/health`)).ok) return { child, root, base, key }; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  child.kill("SIGKILL");
  throw new Error("sandbox did not start");
}

async function stop(ctx) {
  ctx.child.kill("SIGTERM");
  await rm(ctx.root, { recursive: true, force: true });
}

function headers(key) { return { authorization: `Bearer ${key}`, "content-type": "application/json" }; }

test("requires bearer auth and exposes no host/docker mount capability", async () => {
  const ctx = await startSandbox();
  try {
    assert.equal((await fetch(`${ctx.base}/v1/capabilities`)).status, 401);
    const response = await fetch(`${ctx.base}/v1/capabilities`, { headers: headers(ctx.key) });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.hostFilesystemMounted, false);
    assert.equal(body.dockerSocketMounted, false);
  } finally { await stop(ctx); }
});

test("isolates files by Pup and rejects traversal", async () => {
  const ctx = await startSandbox();
  try {
    const write = await fetch(`${ctx.base}/v1/files/write`, { method: "POST", headers: headers(ctx.key), body: JSON.stringify({ pupId: "superdoer", path: "notes/test.txt", content: "hello" }) });
    assert.equal(write.status, 200);
    const read = await fetch(`${ctx.base}/v1/files/read?pupId=superdoer&path=notes/test.txt`, { headers: headers(ctx.key) });
    assert.equal((await read.json()).content, "hello");
    const escape = await fetch(`${ctx.base}/v1/files/read?pupId=superdoer&path=../../etc/passwd`, { headers: headers(ctx.key) });
    assert.equal(escape.status, 400);
  } finally { await stop(ctx); }
});

test("executes inside the Pup workspace with a scrubbed environment", async () => {
  const ctx = await startSandbox();
  try {
    const exec = await fetch(`${ctx.base}/v1/exec`, { method: "POST", headers: headers(ctx.key), body: JSON.stringify({ pupId: "chief-pup", command: "pwd && printf secret:${OPENAI_API_KEY-unset}" }) });
    const body = await exec.json();
    assert.equal(exec.status, 200);
    assert.equal(body.ok, true);
    assert.match(body.stdout, /pups\/chief-pup/);
    assert.match(body.stdout, /secret:unset/);
  } finally { await stop(ctx); }
});
