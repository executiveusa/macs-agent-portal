import { z } from "zod";

// Event (immutable, append-only audit trail)
export const eventSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string(),
  type: z.string(), // e.g., "mission.created", "approval.approved", "chat.completed"
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});

export type Event = z.infer<typeof eventSchema>;

// Create event (from control plane)
export const createEventSchema = z.object({
  run_id: z.string(),
  type: z.string(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateEventRequest = z.infer<typeof createEventSchema>;

// Event types (standardized)
export const eventTypes = {
  // Mission lifecycle
  MISSION_CREATED: "mission.created",
  MISSION_STARTED: "mission.started",
  MISSION_COMPLETED: "mission.completed",
  MISSION_FAILED: "mission.failed",
  MISSION_CANCELLED: "mission.cancelled",

  // Stage progression
  STAGE_ENTERED: "stage.entered",
  STAGE_EXITED: "stage.exited",

  // Chat / Model work
  CHAT_SENT: "chat.sent",
  CHAT_RECEIVED: "chat.received",
  MODEL_SELECTED: "model.selected",

  // Approvals
  APPROVAL_CREATED: "approval.created",
  APPROVAL_APPROVED: "approval.approved",
  APPROVAL_REJECTED: "approval.rejected",
  APPROVAL_EXPIRED: "approval.expired",

  // External actions
  EXTERNAL_CALL: "external.call",
  EXTERNAL_FAILED: "external.failed",

  // System
  SYSTEM_DEGRADED: "system.degraded",
  SYSTEM_RECOVERED: "system.recovered",
} as const;

export type EventType = (typeof eventTypes)[keyof typeof eventTypes];
