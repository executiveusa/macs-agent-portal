import { z } from "zod";

// Deployment (version and configuration)
export const deploymentSchema = z.object({
  id: z.string().uuid(),
  version: z.string(), // Semantic version: 0.1.0
  git_commit: z.string(), // Git SHA
  docker_image_digest: z.string().optional(),
  created_at: z.string().datetime(),
  deployed_at: z.string().datetime().nullable(),
  environment: z.enum(["staging", "production"]),
  status: z.enum(["building", "ready", "active", "superseded", "rollback"]),
  migration_version: z.number().int(),
  feature_flags: z.record(z.boolean()),
  health: z.object({
    ready: z.boolean(),
    issues: z.array(z.string()).default([]),
  }),
});

export type Deployment = z.infer<typeof deploymentSchema>;

// Release manifest
export const releaseManifestSchema = z.object({
  version: z.string(),
  release_date: z.string().datetime(),
  git_tag: z.string(),
  changes: z.array(
    z.object({
      type: z.enum(["feature", "fix", "security", "refactor"]),
      description: z.string(),
      breaking: z.boolean().default(false),
    })
  ),
  dependencies: z.record(z.string()),
  migration_guide: z.string().optional(),
});

export type ReleaseManifest = z.infer<typeof releaseManifestSchema>;

// Backup record
export const backupRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  location: z.string(), // Path or S3 URL
  size_bytes: z.number().int().positive(),
  checksum: z.string(), // SHA256
  encryption_key_id: z.string(),
  verified_at: z.string().datetime().nullable(),
  restore_tested_at: z.string().datetime().nullable(),
  components: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["complete", "partial", "failed"]),
    })
  ),
});

export type BackupRecord = z.infer<typeof backupRecordSchema>;

// Restore test result
export const restoreTestResultSchema = z.object({
  test_id: z.string().uuid(),
  backup_id: z.string().uuid(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime(),
  success: z.boolean(),
  location: z.string(), // Isolated restore location
  issues: z.array(z.string()).default([]),
  recovery_time_seconds: z.number().positive(),
  data_verified: z.boolean(),
});

export type RestoreTestResult = z.infer<typeof restoreTestResultSchema>;

// Feature flag definition
export const featureFlagSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  environment: z.enum(["development", "staging", "production"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  description: z.string().optional(),
  breaking: z.boolean().default(false),
  disables_at: z.string().datetime().optional(),
});

export type FeatureFlag = z.infer<typeof featureFlagSchema>;

// Service health check
export const serviceHealthSchema = z.object({
  service: z.string(),
  status: z.enum(["ready", "degraded", "unavailable"]),
  version: z.string().optional(),
  uptime_seconds: z.number().int().min(0),
  last_error: z.string().nullable(),
  last_check_at: z.string().datetime(),
  dependencies: z.record(
    z.object({
      status: z.enum(["ready", "degraded", "unavailable"]),
      detail: z.string().optional(),
    })
  ),
});

export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
