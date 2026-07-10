export type ScheduledJobStatus = "idle" | "running" | "succeeded" | "failed";

export type ScheduledJobInput = {
  id: string;
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
};

export type ScheduledJobState = {
  id: string;
  name: string;
  intervalMs: number;
  nextRunAt: number;
  lastRunAt: number | null;
  lastStatus: ScheduledJobStatus;
  lastError: string | null;
};

type InternalJob = ScheduledJobState & { handler: () => Promise<void> };

// Fixed-interval scheduler, not cron-expression based - the "run cron-like
// tasks" need here is periodic sweeps (approval expiry, provider health),
// not calendar scheduling, so a cron parser would be unused complexity.
// tick() is exposed directly so tests can drive time deterministically
// instead of racing real timers.
export class Scheduler {
  private readonly jobs = new Map<string, InternalJob>();
  private timer: ReturnType<typeof setInterval> | null = null;

  register(input: ScheduledJobInput): void {
    this.jobs.set(input.id, {
      id: input.id,
      name: input.name,
      intervalMs: input.intervalMs,
      handler: input.handler,
      nextRunAt: Date.now() + input.intervalMs,
      lastRunAt: null,
      lastStatus: "idle",
      lastError: null,
    });
  }

  unregister(id: string): void {
    this.jobs.delete(id);
  }

  list(): ScheduledJobState[] {
    return [...this.jobs.values()].map(({ handler: _handler, ...rest }) => rest);
  }

  async tick(now = Date.now()): Promise<void> {
    for (const job of this.jobs.values()) {
      if (job.nextRunAt > now) continue;
      job.lastStatus = "running";
      try {
        await job.handler();
        job.lastStatus = "succeeded";
        job.lastError = null;
      } catch (error) {
        job.lastStatus = "failed";
        job.lastError = error instanceof Error ? error.message : String(error);
      }
      job.lastRunAt = now;
      job.nextRunAt = now + job.intervalMs;
    }
  }

  start(pollMs = 1_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, pollMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
