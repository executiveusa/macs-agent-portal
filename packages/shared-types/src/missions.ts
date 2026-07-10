import { z } from "zod";

// Mission (top-level work item)
export const missionSchema = z.object({
  id: z.string().uuid(),
  operator_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  objective: z.string().min(3).max(2000),
  status: z.enum(["working", "ready", "completed", "failed", "cancelled"]),
  run_id: z.string(), // ICM workspace run ID
  workspace_path: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Mission = z.infer<typeof missionSchema>;

// Mission request (create)
export const createMissionSchema = z.object({
  objective: z.string().trim().min(3).max(2000),
});

export type CreateMissionRequest = z.infer<typeof createMissionSchema>;

// Mission update
export const updateMissionSchema = z.object({
  status: z.enum(["needs_operator", "working", "ready", "completed", "failed", "cancelled"]),
});

export type UpdateMissionRequest = z.infer<typeof updateMissionSchema>;

// ICM Run metadata
export const icmRunSchema = z.object({
  runId: z.string(), // ISO timestamp + UUID
  missionId: z.string().uuid(),
  operatorId: z.string().uuid(),
  organizationId: z.string().uuid(),
  objective: z.string(),
  runPath: z.string(),
  stages: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      status: z.enum(["pending", "in_progress", "completed", "failed"]),
    })
  ),
  createdAt: z.string().datetime(),
});

export type ICMRun = z.infer<typeof icmRunSchema>;

// Stage contract (per stage directory)
export const stageContractSchema = z.object({
  stageId: z.string(),
  purpose: z.string(),
  inputs: z.record(z.unknown()),
  allowedTools: z.array(z.string()),
  requiredOutputs: z.array(z.string()),
  validationCriteria: z.record(z.unknown()),
  approvalRequired: z.boolean(),
  maxDuration: z.number().positive(),
});

export type StageContract = z.infer<typeof stageContractSchema>;
