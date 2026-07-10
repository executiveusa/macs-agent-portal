type Bucket = { count: number; resetAt: number };

export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly max: number,
  ) {}

  consume(key: string, now = Date.now()): RateLimitDecision {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }
    if (bucket.count >= this.max) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
    }
    bucket.count += 1;
    return { allowed: true };
  }

  reset(): void {
    this.buckets.clear();
  }
}

// Limits from .claude/rules/security.md "Request Limits > Rate Limiting".
// hermes/memory/browser/strategy were added in the Phase 15 security audit
// after finding they had no rate limit despite being mutating,
// operator-triggered routes like chat/skills/missions.
export const RATE_LIMITS = {
  chat: { windowMs: 60_000, max: 10 },
  skills: { windowMs: 60_000, max: 3 },
  missions: { windowMs: 3_600_000, max: 5 },
  hermes: { windowMs: 60_000, max: 5 },
  memory: { windowMs: 60_000, max: 20 },
  browser: { windowMs: 60_000, max: 10 },
  strategy: { windowMs: 60_000, max: 10 },
} as const;

export function createRateLimiters() {
  return {
    chat: new RateLimiter(RATE_LIMITS.chat.windowMs, RATE_LIMITS.chat.max),
    skills: new RateLimiter(RATE_LIMITS.skills.windowMs, RATE_LIMITS.skills.max),
    missions: new RateLimiter(RATE_LIMITS.missions.windowMs, RATE_LIMITS.missions.max),
    hermes: new RateLimiter(RATE_LIMITS.hermes.windowMs, RATE_LIMITS.hermes.max),
    memory: new RateLimiter(RATE_LIMITS.memory.windowMs, RATE_LIMITS.memory.max),
    browser: new RateLimiter(RATE_LIMITS.browser.windowMs, RATE_LIMITS.browser.max),
    strategy: new RateLimiter(RATE_LIMITS.strategy.windowMs, RATE_LIMITS.strategy.max),
  };
}

export type RateLimiters = ReturnType<typeof createRateLimiters>;
