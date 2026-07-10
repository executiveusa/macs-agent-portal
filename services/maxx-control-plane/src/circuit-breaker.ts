export type CircuitState = "closed" | "open" | "half_open";

// Trips after N consecutive failures; after cooldownMs, allows exactly one
// half_open probe before deciding to close (success) or re-open (failure).
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    private readonly failureThreshold = 5,
    private readonly cooldownMs = 30_000,
  ) {}

  canRequest(now = Date.now()): boolean {
    if (this.state === "open") {
      if (now - this.openedAt >= this.cooldownMs) {
        this.state = "half_open";
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  recordFailure(now = Date.now()): void {
    this.consecutiveFailures += 1;
    if (this.state === "half_open" || this.consecutiveFailures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = now;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

export function createProviderCircuitBreakers() {
  return {
    groq: new CircuitBreaker(5, 30_000),
    openrouter: new CircuitBreaker(5, 30_000),
  };
}

export type ProviderCircuitBreakers = ReturnType<typeof createProviderCircuitBreakers>;
