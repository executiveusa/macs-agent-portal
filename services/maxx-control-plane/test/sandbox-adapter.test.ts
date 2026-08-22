import assert from "node:assert/strict";
import test from "node:test";
import { MaxxSandboxClient } from "../src/sandbox-adapter.js";

test("sandbox client keeps its service key server-side and forwards a Pup workspace", async () => {
  const calls: Array<{ url: string; auth: string | null; body?: Record<string, unknown> }> = [];
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      auth: new Headers(init?.headers).get("authorization"),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify({ ok: true, code: 0, signal: null, stdout: "done", stderr: "", truncated: false, durationMs: 1 }), { status: 200 });
  }) as typeof fetch;

  const sandbox = new MaxxSandboxClient("http://maxx-sandbox:8790/", "sandbox-secret-123456", fakeFetch);
  const result = await sandbox.exec({ pupId: "superdoer", command: "printf done", cwd: "." });
  assert.equal(result.stdout, "done");
  assert.equal(calls[0].url, "http://maxx-sandbox:8790/v1/exec");
  assert.equal(calls[0].auth, "Bearer sandbox-secret-123456");
  assert.deepEqual(calls[0].body, { pupId: "superdoer", command: "printf done", cwd: "." });
});

test("sandbox client surfaces service errors instead of fabricating success", async () => {
  const fakeFetch = (async () => new Response(JSON.stringify({ error: "path escapes Pup workspace" }), { status: 400 })) as typeof fetch;
  const sandbox = new MaxxSandboxClient("http://sandbox", "sandbox-secret-123456", fakeFetch);
  await assert.rejects(() => sandbox.readFile({ pupId: "chief-pup", path: "../../etc/passwd" }), /path escapes Pup workspace/);
});
