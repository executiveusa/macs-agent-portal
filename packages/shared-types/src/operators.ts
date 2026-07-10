import { z } from "zod";

// Operator identity and permissions
export const operatorSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  organization_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "operator"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Operator = z.infer<typeof operatorSchema>;

// Organization (tenant)
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Organization = z.infer<typeof organizationSchema>;

// Operator allowlist (from environment variable)
export const operatorAllowlistSchema = z.string().transform(
  (val) =>
    val
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
);

export type OperatorAllowlist = string[];
