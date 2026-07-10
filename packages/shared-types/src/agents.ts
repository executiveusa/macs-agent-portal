import { z } from "zod";

// Agent run request (to Hermes or Pi)
export const agentRunInputSchema = z.object({
  run_id: z.string(),
  mission_id: z.string().uuid(),
  objective: z.string(),
  workspace_path: z.string(),
  stage: z.string(),
  context: z.record(z.unknown()).optional(),
  budget: z.number().positive().optional(),
  timeout_ms: z.number().positive().optional(),
});

export type AgentRunInput = z.infer<typeof agentRunInputSchema>;

// Agent run state
export const agentRunStateSchema = z.object({
  run_id: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
  start_time: z.string().datetime().nullable(),
  end_time: z.string().datetime().nullable(),
  stage: z.string(),
  progress: z.number().min(0).max(1), // 0.0 to 1.0
  result: z.record(z.unknown()).nullable(),
  error: z.string().nullable(),
});

export type AgentRunState = z.infer<typeof agentRunStateSchema>;

// Agent event (from Hermes)
export const agentEventSchema = z.object({
  run_id: z.string(),
  event_id: z.string().uuid(),
  type: z.string(), // e.g., "message", "tool_call", "state_change"
  data: z.record(z.unknown()),
  timestamp: z.string().datetime(),
});

export type AgentEvent = z.infer<typeof agentEventSchema>;

// Tool call (from agent)
export const toolCallSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string(),
  name: z.string(),
  input: z.record(z.unknown()),
  approval_required: z.boolean(),
  approval_id: z.string().uuid().optional(),
  executed_at: z.string().datetime().optional(),
  result: z.unknown().optional(),
});

export type ToolCall = z.infer<typeof toolCallSchema>;

// Skill definition
export const skillDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  health: z.enum(["ready", "degraded", "unavailable"]),
  requiredEnvironment: z.array(z.string()),
  approvalPolicy: z.enum(["auto", "approval_required"]),
});

export type SkillDefinition = z.infer<typeof skillDefinitionSchema>;
