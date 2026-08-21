import http from "node:http";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8790);
const API_KEY = process.env.MAXX_SANDBOX_KEY || "";
const WORKSPACE_ROOT = path.resolve(process.env.MAXX_SANDBOX_ROOT || "/workspace");
const MAX_BODY_BYTES = Number(process.env.MAXX_SANDBOX_MAX_BODY_BYTES || 2_000_000);
const MAX_OUTPUT_BYTES = Number(process.env.MAXX_SANDBOX_MAX_OUTPUT_BYTES || 100_000);
const MAX_EXEC_SECONDS = Number(process.env.MAXX_SANDBOX_MAX_EXEC_SECONDS || 120);

if (API_KEY.length < 16) {
  console.error("MAXX_SANDBOX_KEY must be at least 16 characters");
  process.exit(1);
}

await fs.mkdir(WORKSPACE_ROOT, { recursive: true });

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
  res.end(body);
}

function authorized(req) {
  const auth = String(req.headers.authorization || "");
  return auth === `Bearer ${API_KEY}`;
}

function safePupId(value) {
  const id = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id)) throw new Error("invalid pupId");
  return id;
}

function safePath(pupId, relative = ".") {
  const root = path.resolve(WORKSPACE_ROOT, "pups", safePupId(pupId));
  const target = path.resolve(root, String(relative || "."));
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error("path escapes Pup workspace");
  return { root, target };
}

async function body(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw new Error("request body too large");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function runCommand(command, cwd) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let truncated = false;
    const child = spawn("/bin/bash", ["-lc", command], {
      cwd,
      env: {
        PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
        HOME: cwd,
        LANG: "C.UTF-8",
        LC_ALL: "C.UTF-8",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const append = (current, chunk) => {
      if (Buffer.byteLength(current) >= MAX_OUTPUT_BYTES) {
        truncated = true;
        return current;
      }
      const next = current + chunk.toString("utf8");
      if (Buffer.byteLength(next) > MAX_OUTPUT_BYTES) {
        truncated = true;
        return Buffer.from(next).subarray(0, MAX_OUTPUT_BYTES).toString("utf8");
      }
      return next;
    };
    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    const timeout = setTimeout(() => child.kill("SIGKILL"), Math.max(1, MAX_EXEC_SECONDS) * 1000);
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      resolve({
        ok: code === 0,
        code,
        signal,
        stdout,
        stderr,
        truncated,
        durationMs: Date.now() - startedAt,
      });
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({ ok: false, code: null, signal: null, stdout, stderr: error.message, truncated, durationMs: Date.now() - startedAt });
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { status: "ok" });
    if (!authorized(req)) return json(res, 401, { error: "unauthorized" });

    if (req.method === "GET" && url.pathname === "/v1/capabilities") {
      return json(res, 200, {
        object: "maxx.sandbox.capabilities",
        provider: "self-hosted",
        workspaceIsolation: "per-pup-directory",
        tools: ["exec", "files.read", "files.write", "files.list"],
        hostFilesystemMounted: false,
        dockerSocketMounted: false,
      });
    }

    if (req.method === "POST" && url.pathname === "/v1/exec") {
      const input = await body(req);
      const command = String(input.command || "").trim();
      if (!command || command.length > 8000) return json(res, 400, { error: "command must be 1-8000 characters" });
      const { root, target } = safePath(input.pupId, input.cwd || ".");
      await fs.mkdir(root, { recursive: true });
      const stat = await fs.stat(target).catch(() => null);
      if (!stat?.isDirectory()) return json(res, 400, { error: "cwd does not exist inside Pup workspace" });
      return json(res, 200, await runCommand(command, target));
    }

    if (req.method === "POST" && url.pathname === "/v1/files/write") {
      const input = await body(req);
      const content = String(input.content ?? "");
      if (Buffer.byteLength(content) > 1_000_000) return json(res, 413, { error: "file content too large" });
      const { root, target } = safePath(input.pupId, input.path);
      await fs.mkdir(root, { recursive: true });
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, "utf8");
      return json(res, 200, { ok: true, path: path.relative(root, target), bytes: Buffer.byteLength(content) });
    }

    if (req.method === "GET" && url.pathname === "/v1/files/read") {
      const { root, target } = safePath(url.searchParams.get("pupId"), url.searchParams.get("path"));
      const content = await fs.readFile(target, "utf8");
      if (Buffer.byteLength(content) > 1_000_000) return json(res, 413, { error: "file too large to read through API" });
      return json(res, 200, { path: path.relative(root, target), content });
    }

    if (req.method === "GET" && url.pathname === "/v1/files/list") {
      const { root, target } = safePath(url.searchParams.get("pupId"), url.searchParams.get("path") || ".");
      await fs.mkdir(root, { recursive: true });
      const rows = await fs.readdir(target, { withFileTypes: true });
      return json(res, 200, {
        path: path.relative(root, target) || ".",
        entries: rows.slice(0, 500).map((entry) => ({ name: entry.name, type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other" })),
      });
    }

    return json(res, 404, { error: "not found" });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, HOST, () => console.log(`MAXX sandbox listening on ${HOST}:${PORT}`));
