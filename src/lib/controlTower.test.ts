import { describe, expect, it } from "vitest";
import {
  formatTokenCount,
  summarizeDependencyHealth,
  type DependencyMap,
} from "./controlTower";

describe("control tower presentation helpers", () => {
  it("reports degraded when any backend dependency is not ready", () => {
    const dependencies: DependencyMap = {
      supabase: { configured: true, status: "ready", detail: "Ready" },
      openrouter: { configured: false, status: "degraded", detail: "Missing" },
    };

    expect(summarizeDependencyHealth(dependencies)).toEqual({
      status: "degraded",
      ready: 1,
      total: 2,
    });
  });

  it("reports online only when all backend dependencies are ready", () => {
    const dependencies: DependencyMap = {
      supabase: { configured: true, status: "ready", detail: "Ready" },
      openrouter: { configured: true, status: "ready", detail: "Ready" },
    };

    expect(summarizeDependencyHealth(dependencies).status).toBe("online");
  });

  it("formats token totals for compact monitoring cards", () => {
    expect(formatTokenCount(950)).toBe("950");
    expect(formatTokenCount(12_450)).toBe("12.5k");
    expect(formatTokenCount(2_100_000)).toBe("2.1m");
  });
});
