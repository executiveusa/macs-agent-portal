import { z } from "zod";

// Browser action type
export enum BrowserActionType {
  NAVIGATE = "navigate",
  SEARCH = "search",
  EXTRACT = "extract",
  SCREENSHOT = "screenshot",
  SUBMIT_FORM = "submit_form",
  SEND_MESSAGE = "send_message",
  POST = "post",
  PURCHASE = "purchase",
  UPLOAD = "upload",
  DELETE = "delete",
  CHANGE_PERMISSIONS = "change_permissions",
  ENTER_SENSITIVE_DATA = "enter_sensitive_data",
}

// Browser session
export const browserSessionSchema = z.object({
  session_id: z.string().uuid(),
  run_id: z.string(),
  operator_id: z.string().uuid(),
  created_at: z.string().datetime(),
  last_activity_at: z.string().datetime(),
  current_url: z.string().url().nullable(),
  state: z.enum(["idle", "navigating", "interacting", "error"]),
});

export type BrowserSession = z.infer<typeof browserSessionSchema>;

// Browser action request
export const browserActionSchema = z.object({
  action: z.nativeEnum(BrowserActionType),
  target: z.string().optional(),
  input: z.record(z.unknown()).optional(),
  approval_required: z.boolean().optional(),
  approval_id: z.string().uuid().optional(),
});

export type BrowserAction = z.infer<typeof browserActionSchema>;

// Browser action result
export const browserActionResultSchema = z.object({
  action_id: z.string().uuid(),
  action: z.nativeEnum(BrowserActionType),
  success: z.boolean(),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  screenshot_base64: z.string().optional(),
  dom_snapshot: z.string().optional(),
  duration_ms: z.number(),
});

export type BrowserActionResult = z.infer<typeof browserActionResultSchema>;

// Browser configuration
export const browserConfigSchema = z.object({
  enabled: z.boolean().default(true),
  read_only: z.boolean().default(true), // Mutations disabled by default
  headless: z.boolean().default(true),
  timeout_ms: z.number().positive().default(30000),
  viewport: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  user_agent: z.string().optional(),
  cookies: z.record(z.string()).optional(),
});

export type BrowserConfig = z.infer<typeof browserConfigSchema>;

// Allowlisted domains
export const allowlistedDomainsSchema = z.array(z.string().url());

export type AllowlistedDomains = string[];
