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

// Limits from .claude/rules/security.md "Request Limits > Rate Limiting"
export const RATE_LIMITS = {
  chat: { windowMs: 60_000, max: 10 },
  skills: { windowMs: 60_000, max: 3 },
  missions: { windowMs: 3_600_000, max: 5 },
} as const;

export function createRateLimiters() {
  return {
    chat: new RateLimiter(RATE_LIMITS.chat.windowMs, RATE_LIMITS.chat.max),
    skills: new RateLimiter(RATE_LIMITS.skills.windowMs, RATE_LIMITS.skills.max),
    missions: new RateLimiter(RATE_LIMITS.missions.windowMs, RATE_LIMITS.missions.max),
  };
}

export type RateLimiters = ReturnType<typeof createRateLimiters>;
