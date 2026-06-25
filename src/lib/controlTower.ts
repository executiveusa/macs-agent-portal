export type DependencyState = {
  configured: boolean;
  status: "ready" | "degraded" | "unavailable";
  detail: string;
};

export type DependencyMap = Record<string, DependencyState>;

export function summarizeDependencyHealth(dependencies: DependencyMap) {
  const values = Object.values(dependencies);
  const ready = values.filter((item) => item.status === "ready").length;
  return {
    status: ready === values.length && values.length > 0 ? "online" : "degraded",
    ready,
    total: values.length,
  } as const;
}

export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${(Math.round(value / 100) / 10).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}
