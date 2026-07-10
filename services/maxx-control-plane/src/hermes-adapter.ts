export type HermesRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

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

export interface HermesAdapter {
  startRun(input: HermesRunInput): Promise<HermesRunState>;
  getRunState(runId: string): Promise<HermesRunState | undefined>;
  cancelRun(runId: string): Promise<HermesRunState | undefined>;
}

// Used whenever no real Hermes runtime is reachable (MAXX_HERMES_ENABLED=false
// or MAXX_HERMES_ENDPOINT unset). It never pretends an agent executed —
// startRun immediately records a "failed" state with the exact reason, so
// callers see an honest, gracefully-degraded response instead of a hang.
export class StubHermesAdapter implements HermesAdapter {
  private readonly runs = new Map<string, HermesRunState>();

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
      error: "Hermes runtime is not configured (set MAXX_HERMES_ENABLED=true and MAXX_HERMES_ENDPOINT)",
    };
    this.runs.set(input.runId, state);
    return state;
  }

  async getRunState(runId: string): Promise<HermesRunState | undefined> {
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

// Real adapter for a Hermes runtime reachable over HTTP. Not exercised
// against a live Hermes instance in this environment (no credentials/endpoint
// available) — covered by tests against a fake fetch implementation only.
export class HttpHermesAdapter implements HermesAdapter {
  constructor(
    private readonly endpoint: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async startRun(input: HermesRunInput): Promise<HermesRunState> {
    const response = await this.fetchImpl(`${this.endpoint}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`Hermes startRun failed with status ${response.status}`);
    return (await response.json()) as HermesRunState;
  }

  async getRunState(runId: string): Promise<HermesRunState | undefined> {
    const response = await this.fetchImpl(`${this.endpoint}/runs/${encodeURIComponent(runId)}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Hermes getRunState failed with status ${response.status}`);
    return (await response.json()) as HermesRunState;
  }

  async cancelRun(runId: string): Promise<HermesRunState | undefined> {
    const response = await this.fetchImpl(`${this.endpoint}/runs/${encodeURIComponent(runId)}/cancel`, {
      method: "POST",
    });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Hermes cancelRun failed with status ${response.status}`);
    return (await response.json()) as HermesRunState;
  }
}

export function createHermesAdapter(config: { hermesEnabled: boolean; hermesEndpoint?: string }): HermesAdapter {
  if (config.hermesEnabled && config.hermesEndpoint) {
    return new HttpHermesAdapter(config.hermesEndpoint);
  }
  return new StubHermesAdapter();
}
