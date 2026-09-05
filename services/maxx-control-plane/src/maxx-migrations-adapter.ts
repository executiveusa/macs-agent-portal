export type MaxxMigrationsAdapter = {
  isConfigured(): boolean;
  health(): Promise<unknown>;
  manifest(): Promise<unknown>;
  route(condition: string): Promise<unknown>;
};

type Options = {
  endpoint?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

export function createMaxxMigrationsAdapter(options: Options): MaxxMigrationsAdapter {
  const baseUrl = options.endpoint?.replace(/\/$/, "");
  const apiKey = options.apiKey;
  const fetchImpl = options.fetchImpl ?? fetch;

  async function call(path: string, init: RequestInit = {}) {
    if (!baseUrl || !apiKey) {
      throw new Error("MAXX Migrations backend is not configured");
    }
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-maxx-migrations-api-key": apiKey,
        ...(init.headers ?? {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: unknown }).error)
          : `MAXX Migrations returned ${response.status}`;
      throw new Error(message);
    }
    return payload;
  }

  return {
    isConfigured: () => Boolean(baseUrl && apiKey),
    health: () => call("/api/system/health"),
    manifest: () => call("/api/system/manifest"),
    route: (condition: string) =>
      call("/api/system/route", {
        method: "POST",
        body: JSON.stringify({ condition }),
      }),
  };
}
