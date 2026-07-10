import { z } from "zod";

// Usage record (token tracking and cost)
export const usageRecordSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().optional(),
  model: z.string(),
  provider: z.enum(["openrouter", "groq", "anthropic", "unknown"]),
  prompt_tokens: z.number().int().min(0),
  completion_tokens: z.number().int().min(0),
  estimated_cost_usd: z.number().min(0),
  created_at: z.string().datetime(),
});

export type UsageRecord = z.infer<typeof usageRecordSchema>;

// Usage summary (aggregated)
export const usageSummarySchema = z.object({
  prompt_tokens: z.number().int().min(0),
  completion_tokens: z.number().int().min(0),
  estimated_cost_usd: z.number().min(0),
  requests: z.number().int().min(0),
});

export type UsageSummary = z.infer<typeof usageSummarySchema>;

// Usage by model
export const usageByModelSchema = z.record(
  z.object({
    prompts: z.number(),
    completions: z.number(),
    cost: z.number(),
    requests: z.number(),
  })
);

export type UsageByModel = z.infer<typeof usageByModelSchema>;

// Budget configuration
export const budgetConfigSchema = z.object({
  monthly_limit_usd: z.number().positive(),
  per_request_limit_usd: z.number().positive(),
  warning_threshold: z.number().min(0).max(1), // 0.8 = 80%
});

export type BudgetConfig = z.infer<typeof budgetConfigSchema>;
