export type HermesRunStatus =
  | "queued"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "timeout"
  | "error"
  | "cancelled";

export type HermesRunInput = {
  runId: string;
  missionId: string;
  objective: string;
  workspacePath: string;
  stage: string;
  timeoutMs?: number;
};

export type HermesRunState = {
  runId: string;
  status: HermesRunStatus;
  startedAt: string | null;
  endedAt: string | null;
  stage: string;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
};

export type HermesChatResult = {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
};

export type HermesApprovalChoice = "once" | "session" | "always" | "deny";

export interface HermesAdapter {
  chat(input: { message: string; sessionId?: string }): Promise<HermesChatResult>;
  startRun(input: HermesRunInput): Promise<HermesRunState>;
  getRunState(runId: string): Promise<HermesRunState | undefined>;
  resolveApproval(runId: string, choice: HermesApprovalChoice): Promise<HermesRunState | undefined>;
  steerRun(runId: string, message: string): Promise<HermesRunState | undefined>;
  cancelRun(runId: string): Promise<HermesRunState | undefined>;
}

export const MAXX_MODE_MARKER = "[[MAXX_MODE:POWER]]";

const MAXX_SYSTEM_PROMPT = [
  "You are Agent MAXX 006, powered by a dedicated Hermes Agent runtime.",
  "Load and follow the installed agent-maxx skill as your operating contract.",
  "The customer speaks in outcomes, not agent topology. Infer the smallest safe plan, route through installed skills/tools, and do the machine work underneath.",
  "Use ICM discipline: inspect before changing, load only relevant context, preserve owner control, keep consequential actions approval-gated, verify before claiming success, and maintain rollback.",
  "Be direct and non-sycophantic. Recommend what is most likely to work rather than what is most flattering.",
  "Do not expose internal orchestration noise unless the customer asks for operational detail.",
  "You are not Bambu's personal Hermes and must not rely on that agent's identity, memory, secrets, or sessions.",
].join("\n");

function normalizeEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, "");
}

function normalizeChatMessage(message: string) {
  const trimmed = message.trimStart();
  const maxMode = trimmed.startsWith(MAXX_MODE_MARKER);
  return {
    maxMode,
    message: maxMode ? trimmed.slice(MAXX_MODE_MARKER.length).trimStart() : message,
  };
}

type ModelRoute = { tier: "fast" | "standard" | "power"; provider: string; model: string };

function configuredRoute(tier: ModelRoute["tier"], env: NodeJS.ProcessEnv = process.env): ModelRoute | undefined {
  const prefix = `MAXX_HERMES_${tier.toUpperCase()}`;
  const provider = env[`${prefix}_PROVIDER`]?.trim();
  const model = env[`${prefix}_MODEL`]?.trim();
  return provider && model ? { tier, provider, model } : undefined;
}

function chooseRoute(message: string, maxMode: boolean, env: NodeJS.ProcessEnv = process.env): ModelRoute | undefined {
  if (maxMode) return configuredRoute("power", env) ?? configuredRoute("standard", env) ?? configuredRoute("fast", env);

  const complexitySignals = /\b(architecture|architect|strategy|strategic|audit|security|migration|migrate|debug|root cause|research|compare|contract|database|deployment|production|financial|legal|system design|multi-agent|multi agent)\b/i;
  const isFast = message.trim().length <= 220 && !complexitySignals.test(message);
  if (isFast) return configuredRoute("fast", env) ?? configuredRoute("standard", env);
  return configuredRoute("standard", env) ?? configuredRoute("fast", env);
}

function routeFields(route: ModelRoute | undefined) {
  return route ? { model: route.model, provider: route.provider } : { model: "hermes-agent" };
}

function isoFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value > 10_000_000_000 ? value : value * 1000).toISOString();
  }
  return null;
}

function mapStatus(value: unknown): HermesRunStatus {
  switch (value) {
    case "queued":
      return "queued";
    case "waiting_for_approval":
      return "waiting_for_approval";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "timeout":
    case "timed_out":
      return "timeout";
    case "error":
      return "error";
    case "cancelled":
    case "stopped":
    case "interrupted":
    case "orphaned":
      return "cancelled";
    case "started":
    case "running":
    default:
      return "running";
  }
}

function normalizeRunState(payload: Record<string, unknown>, stage = "hermes"): HermesRunState {
  const status = mapStatus(payload.status);
  const terminal = status === "completed" || status === "failed" || status === "timeout" || status === "error" || status === "cancelled";
  const output = typeof payload.output === "string" ? payload.output : null;
  const usage = payload.usage && typeof payload.usage === "object" ? payload.usage : null;
  const result = output || usage ? { ...(output ? { output } : {}), ...(usage ? { usage } : {}) } : null;

  return {
    runId: String(payload.run_id ?? payload.runId ?? ""),
    status,
    startedAt: isoFromUnknown(payload.started_at ?? payload.created_at) ?? (status === "queued" ? null : new Date().toISOString()),
    endedAt: isoFromUnknown(payload.ended_at) ?? (terminal ? new Date().toISOString() : null),
    stage: String(payload.stage ?? stage),
    progress: status === "completed" ? 1 : status === "queued" ? 0 : terminal ? 1 : 0.5,
    result,
    error: typeof payload.error === "string" ? payload.error : status === "timeout" ? "Hermes run timed out" : status === "error" ? "Hermes run ended with an error" : null,
  };
}

export class StubHermesAdapter implements HermesAdapter {
  private readonly runs = new Map<string, HermesRunState>();

  async chat(): Promise<HermesChatResult> {
    throw new Error("Hermes runtime is not configured (set MAXX_HERMES_ENABLED=true, MAXX_HERMES_ENDPOINT, and MAXX_HERMES_API_KEY)");
  }

  async startRun(input: HermesRunInput): Promise<HermesRunState> {
    const now = new Date().toISOString();
    const state: HermesRunState = {
      runId: input.runId,
      status: "failed",
      startedAt: now,
      endedAt: now,
      stage: input.stage,
      progress: 0,
      result: null,
      error: "Hermes runtime is not configured (set MAXX_HERMES_ENABLED=true, MAXX_HERMES_ENDPOINT, and MAXX_HERMES_API_KEY)",
    };
    this.runs.set(input.runId, state);
    return state;
  }

  async getRunState(runId: string): Promise<HermesRunState | undefined> {
    return this.runs.get(runId);
  }

  async resolveApproval(runId: string): Promise<HermesRunState | undefined> {
    return this.runs.get(runId);
  }

  async steerRun(runId: string): Promise<HermesRunState | undefined> {
    return this.runs.get(runId);
  }

  async cancelRun(runId: string): Promise<HermesRunState | undefined> {
    const state = this.runs.get(runId);
    if (!state) return undefined;
    state.status = "cancelled";
    state.endedAt = new Date().toISOString();
    return state;
  }
}

export class HttpHermesAdapter implements HermesAdapter {
  private readonly endpoint: string;

  constructor(
    endpoint: string,
    private readonly apiKey?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = normalizeEndpoint(endpoint);
  }

  private headers(extra: Record<string, string> = {}) {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...extra,
    };
  }

  async chat(input: { message: string; sessionId?: string }): Promise<HermesChatResult> {
    const started = Date.now();
    const normalized = normalizeChatMessage(input.message);
    const route = chooseRoute(normalized.message, normalized.maxMode);
    const sessionHeaders: Record<string, string> = input.sessionId
      ? { "X-Hermes-Session-Id": input.sessionId, "X-Hermes-Session-Key": input.sessionId }
      : {};
    const systemPrompt = normalized.maxMode
      ? `${MAXX_SYSTEM_PROMPT}\nMAXX Mode is ACTIVE for this turn. Increase reasoning depth, challenge assumptions, and verify more aggressively. Do not relax safety or approval policy.`
      : MAXX_SYSTEM_PROMPT;
    const response = await this.fetchImpl(`${this.endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: this.headers(sessionHeaders),
      body: JSON.stringify({
        ...routeFields(route),
        stream: false,
        ...(normalized.maxMode ? { model_options: { reasoning_effort: "high" } } : {}),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: normalized.message },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Hermes chat failed with status ${response.status}`);
    const body = (await response.json()) as Record<string, unknown>;
    const choices = Array.isArray(body.choices) ? body.choices : [];
    const first = choices[0] && typeof choices[0] === "object" ? (choices[0] as Record<string, unknown>) : {};
    const message = first.message && typeof first.message === "object" ? (first.message as Record<string, unknown>) : {};
    const text = typeof message.content === "string" ? message.content : "";
    const usage = body.usage && typeof body.usage === "object" ? (body.usage as Record<string, unknown>) : {};
    const promptTokens = Number(usage.prompt_tokens ?? 0) || 0;
    const completionTokens = Number(usage.completion_tokens ?? 0) || 0;
    return {
      text,
      model: String(body.model ?? route?.model ?? "hermes-agent"),
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: Number(usage.total_tokens ?? promptTokens + completionTokens) || promptTokens + completionTokens,
        estimatedCostUsd: 0,
        latencyMs: Date.now() - started,
      },
    };
  }

  async startRun(input: HermesRunInput): Promise<HermesRunState> {
    const route = chooseRoute(input.objective, false);
    const instructions = [
      MAXX_SYSTEM_PROMPT,
      "",
      "Current ICM run metadata:",
      `- MAXX run: ${input.runId}`,
      `- mission: ${input.missionId}`,
      `- stage: ${input.stage}`,
      `- workspace: ${input.workspacePath} (use only if this path is mounted/visible in your runtime)`,
      "Return evidence-backed output. Use Hermes approval gates for consequential tool actions.",
    ].join("\n");
    const response = await this.fetchImpl(`${this.endpoint}/v1/runs`, {
      method: "POST",
      headers: this.headers({
        "X-Hermes-Session-Id": input.runId,
        "X-Hermes-Session-Key": input.runId,
      }),
      body: JSON.stringify({
        input: input.objective,
        session_id: input.runId,
        instructions,
        ...routeFields(route),
        ...(input.timeoutMs ? { timeout_ms: input.timeoutMs } : {}),
      }),
    });
    if (!response.ok) throw new Error(`Hermes startRun failed with status ${response.status}`);
    return normalizeRunState((await response.json()) as Record<string, unknown>, input.stage);
  }

  async getRunState(runId: string): Promise<HermesRunState | undefined> {
    const response = await this.fetchImpl(`${this.endpoint}/v1/runs/${encodeURIComponent(runId)}`, {
      headers: this.headers(),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Hermes getRunState failed with status ${response.status}`);
    return normalizeRunState((await response.json()) as Record<string, unknown>);
  }

  async resolveApproval(runId: string, choice: HermesApprovalChoice): Promise<HermesRunState | undefined> {
    const response = await this.fetchImpl(`${this.endpoint}/v1/runs/${encodeURIComponent(runId)}/approval`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ choice }),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Hermes approval failed with status ${response.status}`);
    return this.getRunState(runId);
  }

  async steerRun(runId: string, message: string): Promise<HermesRunState | undefined> {
    const response = await this.fetchImpl(`${this.endpoint}/v1/runs/${encodeURIComponent(runId)}/steer`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ message }),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Hermes steerRun failed with status ${response.status}`);
    return this.getRunState(runId);
  }

  async cancelRun(runId: string): Promise<HermesRunState | undefined> {
    const response = await this.fetchImpl(`${this.endpoint}/v1/runs/${encodeURIComponent(runId)}/stop`, {
      method: "POST",
      headers: this.headers(),
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Hermes cancelRun failed with status ${response.status}`);
    return this.getRunState(runId);
  }
}

export function createHermesAdapter(config: {
  hermesEnabled: boolean;
  hermesEndpoint?: string;
  hermesApiKey?: string;
}): HermesAdapter {
  if (config.hermesEnabled && config.hermesEndpoint) {
    return new HttpHermesAdapter(config.hermesEndpoint, config.hermesApiKey);
  }
  return new StubHermesAdapter();
}
