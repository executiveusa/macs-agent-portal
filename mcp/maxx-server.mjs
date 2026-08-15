#!/usr/bin/env node

const API = (process.env.MAXX_API_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const API_KEY = process.env.MAXX_API_KEY;
const MAXX_MODE_MARKER = "[[MAXX_MODE:POWER]]";
let buffer = "";

async function maxx(path, options = {}, auth = true, allowNon2xx = false) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (auth) {
    if (!API_KEY) throw new Error("MAXX_API_KEY is required");
    headers["x-maxx-api-key"] = API_KEY;
  }
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !allowNon2xx) throw new Error(payload.error || payload.message || `MAXX returned ${response.status}`);
  return { ...payload, httpStatus: response.status };
}

function write(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function result(id, content, structuredContent) {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      content: [{ type: "text", text: typeof content === "string" ? content : JSON.stringify(content, null, 2) }],
      ...(structuredContent ? { structuredContent } : {}),
    },
  };
}

async function handle(message) {
  const { id, method, params = {} } = message;
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params.protocolVersion || "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "agent-maxx", version: "0.1.0" },
      },
    };
  }
  if (method === "notifications/initialized") return null;
  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "maxx_chat",
            description: "Ask Agent MAXX to reason about an outcome. Set max_mode for the high-reasoning path.",
            inputSchema: {
              type: "object",
              properties: {
                message: { type: "string" },
                max_mode: { type: "boolean", default: false },
              },
              required: ["message"],
            },
          },
          {
            name: "maxx_status",
            description: "Read the MAXX control-plane health/dependency state, including degraded readiness details.",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "maxx_create_mission",
            description: "Create a durable MAXX mission. Production mutation policy still applies.",
            inputSchema: {
              type: "object",
              properties: { objective: { type: "string" } },
              required: ["objective"],
            },
          },
        ],
      },
    };
  }
  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || {};
    if (name === "maxx_status") {
      const payload = await maxx("/health/ready", {}, false, true);
      return result(id, payload, payload);
    }
    if (name === "maxx_chat") {
      const messageText = String(args.message || "").trim();
      if (!messageText) throw new Error("message is required");
      const payload = await maxx("/v1/chat", {
        method: "POST",
        body: JSON.stringify({ message: args.max_mode ? `${MAXX_MODE_MARKER}\n${messageText}` : messageText }),
      });
      return result(id, payload.text || payload, payload);
    }
    if (name === "maxx_create_mission") {
      const objective = String(args.objective || "").trim();
      if (!objective) throw new Error("objective is required");
      const payload = await maxx("/v1/missions", { method: "POST", body: JSON.stringify({ objective }) });
      return result(id, payload, payload);
    }
    throw new Error(`Unknown MAXX tool: ${name}`);
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
      const response = await handle(message);
      if (response) write(response);
    } catch (error) {
      write({
        jsonrpc: "2.0",
        id: message?.id ?? null,
        error: { code: -32000, message: error instanceof Error ? error.message : String(error) },
      });
    }
  }
});
