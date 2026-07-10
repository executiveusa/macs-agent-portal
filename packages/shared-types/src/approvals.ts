import { z } from "zod";

// Approval request (gate for high-risk actions)
export const approvalSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string(), // Associated mission or "standalone"
  operator_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  action: z.string(), // e.g., "send_email", "browser:purchase"
  summary: z.string(),
  decision: z.enum(["pending", "approved", "rejected"]),
  decided_by: z.string().uuid().nullable(),
  decided_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
});

export type Approval = z.infer<typeof approvalSchema>;

// Create approval (from control plane)
export const createApprovalSchema = z.object({
  run_id: z.string(),
  action: z.string(),
  summary: z.string(),
  expires_in_hours: z.number().positive().default(24),
});

export type CreateApprovalRequest = z.infer<typeof createApprovalSchema>;

// Decision (approve/reject)
export const approvalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
});

export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

// Action classification
export const actionClassificationSchema = z.object({
  action: z.string(),
  requiresApproval: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string(),
});

export type ActionClassification = z.infer<typeof actionClassificationSchema>;
