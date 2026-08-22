export type SandboxCapabilities = {
  object: string;
  provider: string;
  workspaceIsolation: string;
  tools: string[];
  hostFilesystemMounted: boolean;
  dockerSocketMounted: boolean;
};

export type SandboxExecResult = {
  ok: boolean;
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
  durationMs: number;
};

export class MaxxSandboxClient {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchImpl(`${this.endpoint.replace(/\/+$/, "")}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(`MAXX sandbox ${path} failed with status ${response.status}: ${body.error ?? text}`);
    return body as T;
  }

  capabilities() {
    return this.request<SandboxCapabilities>("/v1/capabilities");
  }

  exec(input: { pupId: string; command: string; cwd?: string }) {
    return this.request<SandboxExecResult>("/v1/exec", { method: "POST", body: JSON.stringify(input) });
  }

  writeFile(input: { pupId: string; path: string; content: string }) {
    return this.request<{ ok: boolean; path: string; bytes: number }>("/v1/files/write", { method: "POST", body: JSON.stringify(input) });
  }

  readFile(input: { pupId: string; path: string }) {
    const query = new URLSearchParams({ pupId: input.pupId, path: input.path });
    return this.request<{ path: string; content: string }>(`/v1/files/read?${query}`);
  }

  listFiles(input: { pupId: string; path?: string }) {
    const query = new URLSearchParams({ pupId: input.pupId, path: input.path ?? "." });
    return this.request<{ path: string; entries: Array<{ name: string; type: string }> }>(`/v1/files/list?${query}`);
  }
}

export function createSandboxClient(config: { url?: string; key?: string }) {
  if (!config.url || !config.key) return undefined;
  return new MaxxSandboxClient(config.url, config.key);
}
