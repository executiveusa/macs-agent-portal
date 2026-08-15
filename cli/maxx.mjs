#!/usr/bin/env node

const API = (process.env.MAXX_API_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const API_KEY = process.env.MAXX_API_KEY;
const MAXX_MODE_MARKER = "[[MAXX_MODE:POWER]]";

async function call(path, options = {}, auth = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (auth) {
    if (!API_KEY) throw new Error("MAXX_API_KEY is required for machine calls");
    headers["x-maxx-api-key"] = API_KEY;
  }
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.message || `MAXX returned ${response.status}`);
  return payload;
}

function usage() {
  console.log(`Agent MAXX CLI\n\nUsage:\n  maxx status\n  maxx chat <message>\n  maxx max <message>\n  maxx mission <objective>\n\nEnvironment:\n  MAXX_API_URL   private MAXX control-plane URL\n  MAXX_API_KEY   deployment-specific machine credential\n`);
}

const [command, ...args] = process.argv.slice(2);

try {
  if (!command || command === "help" || command === "--help") {
    usage();
  } else if (command === "status") {
    console.log(JSON.stringify(await call("/health/ready", {}, false), null, 2));
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
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(`MAXX: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
