export type ProviderHealthCheck = {
  name: string;
  check: () => Promise<boolean>;
};

export type ProviderHealthResult = {
  name: string;
  status: "ready" | "unavailable";
  checkedAt: string;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("health check timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function runHealthChecks(
  checks: ProviderHealthCheck[],
  timeoutMs = 5_000,
): Promise<ProviderHealthResult[]> {
  return Promise.all(
    checks.map(async (item) => {
      const checkedAt = new Date().toISOString();
      try {
        const ok = await withTimeout(item.check(), timeoutMs);
        return { name: item.name, status: ok ? "ready" : "unavailable", checkedAt } as const;
      } catch {
        return { name: item.name, status: "unavailable", checkedAt } as const;
      }
    }),
  );
}
