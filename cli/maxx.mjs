#!/usr/bin/env node

const API = (process.env.MAXX_API_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const API_KEY = process.env.MAXX_API_KEY;
const MAXX_MODE_MARKER = "[[MAXX_MODE:POWER]]";

async function call(path, options = {}, auth = true, allowNon2xx = false) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (auth) {
    if (!API_KEY) throw new Error("MAXX_API_KEY is required for machine calls");
    headers["x-maxx-api-key"] = API_KEY;
  }
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !allowNon2xx) throw new Error(payload.error || payload.reason || payload.message || `MAXX returned ${response.status}`);
  return { ...payload, httpStatus: response.status };
}

function usage() {
  console.log(`Agent MAXX CLI\n\nUsage:\n  maxx status\n  maxx chat <message>\n  maxx max <message>\n  maxx mission <objective>\n  maxx migrations health\n  maxx migrations manifest\n  maxx migrations route <business condition>\n\nEnvironment:\n  MAXX_API_URL   private MAXX control-plane URL\n  MAXX_API_KEY   deployment-specific machine credential\n`);
}

const [command, ...args] = process.argv.slice(2);

try {
  if (!command || command === "help" || command === "--help") {
    usage();
  } else if (command === "status") {
    const status = await call("/health/ready", {}, false, true);
    console.log(JSON.stringify(status, null, 2));
    if (status.status !== "ready") process.exitCode = 2;
  } else if (command === "chat" || command === "max") {
    const message = args.join(" ").trim();
    if (!message) throw new Error("A message is required");
    const payload = await call("/v1/chat", {
      method: "POST",
      body: JSON.stringify({ message: command === "max" ? `${MAXX_MODE_MARKER}\n${message}` : message }),
    });
    console.log(payload.text || JSON.stringify(payload, null, 2));
  } else if (command === "mission") {
    const objective = args.join(" ").trim();
    if (!objective) throw new Error("A mission objective is required");
    console.log(JSON.stringify(await call("/v1/missions", { method: "POST", body: JSON.stringify({ objective }) }), null, 2));
  } else if (command === "migrations") {
    const [subcommand, ...rest] = args;
    if (subcommand === "health") {
      console.log(JSON.stringify(await call("/v1/migrations/health"), null, 2));
    } else if (subcommand === "manifest") {
      console.log(JSON.stringify(await call("/v1/migrations/manifest"), null, 2));
    } else if (subcommand === "route") {
      const condition = rest.join(" ").trim();
      if (!condition) throw new Error("A business condition is required");
      console.log(
        JSON.stringify(
          await call("/v1/migrations/route", {
            method: "POST",
            body: JSON.stringify({ condition }),
          }),
          null,
          2,
        ),
      );
    } else {
      throw new Error("Use: maxx migrations health | manifest | route <business condition>");
    }
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(`MAXX: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
