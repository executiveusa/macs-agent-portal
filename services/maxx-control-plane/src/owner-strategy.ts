import type { ModelDecision } from "./model-router.js";

export type RiskTolerance = "conservative" | "standard" | "permissive";

export type OwnerStrategy = {
  operatorId: string;
  preferredProvider?: "groq" | "openrouter";
  riskTolerance: RiskTolerance;
  forbiddenActions: string[];
  maxCostPerRequestUsd?: number;
  updatedAt: string;
};

export function defaultStrategy(operatorId: string): OwnerStrategy {
  return {
    operatorId,
    riskTolerance: "standard",
    forbiddenActions: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export type OwnerStrategyInput = {
  preferredProvider?: "groq" | "openrouter";
  riskTolerance?: RiskTolerance;
  forbiddenActions?: string[];
  maxCostPerRequestUsd?: number;
};

export class OwnerStrategyStore {
  private strategies = new Map<string, OwnerStrategy>();

  get(operatorId: string): OwnerStrategy {
    return this.strategies.get(operatorId) ?? defaultStrategy(operatorId);
  }

  set(operatorId: string, input: OwnerStrategyInput): OwnerStrategy {
    const current = this.get(operatorId);
    const strategy: OwnerStrategy = {
      operatorId,
      preferredProvider: input.preferredProvider ?? current.preferredProvider,
      riskTolerance: input.riskTolerance ?? current.riskTolerance,
      forbiddenActions: input.forbiddenActions ?? current.forbiddenActions,
      maxCostPerRequestUsd: input.maxCostPerRequestUsd ?? current.maxCostPerRequestUsd,
      updatedAt: new Date().toISOString(),
    };
    this.strategies.set(operatorId, strategy);
    return strategy;
  }
}

// Only overrides the provider, never the underlying model or task
// classification computed by routeModel - the strategy is a preference
// layer, not a replacement for the router's evidence-based decision.
export function applyProviderPreference(
  decision: ModelDecision,
  strategy: OwnerStrategy,
  available: { groq: boolean; openrouter: boolean },
): ModelDecision {
  if (!strategy.preferredProvider || strategy.preferredProvider === decision.provider) return decision;
  if (!available[strategy.preferredProvider]) return decision;
  return {
    ...decision,
    provider: strategy.preferredProvider,
    reason: `${decision.reason} (overridden to ${strategy.preferredProvider} by operator strategy)`,
  };
}

export function isActionForbidden(action: string, strategy: OwnerStrategy): boolean {
  return strategy.forbiddenActions.includes(action);
}
