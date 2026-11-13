import type { MaxxConfig } from "./config.js";

/**
 * Read-only project capability, sourced from the canonical MAXX Supabase schema.
 * No static seven-client list is treated as an authorization grant.
 * All DB traffic stays server-side. Return unavailable instead of a demo tenant.
 */
export type ClientWorkspace = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  role: "owner" | "admin" | "operator" | "reviewer" | "viewer";
  status: "active" | "paused" | "archived";
  pendingApprovalCount: null;
};
export class WorkspaceUnavailable extends Error {
  readonly status = 503;
  constructor() { super("Project-scoped access is not configured or cannot be verified."); }
}
export class WorkspaceForbidden extends Error {
  readonly status = 403;
  constructor() { super("This user is not authorized for that client workspace."); }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (value: unknown): value is string => typeof value === "string" && UUID.test(value);
type RecordRow = Record<string, unknown>;

export function createClientWorkspaceService(
  config: Pick<MaxxConfig, "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">,
  enabled: boolean,
  request: typeof fetch = fetch,
) {
  async function readRows(table: string, parameters: Record<string,string>): Promise<RecordRow[]> {
    if (!enabled || !config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY)
      throw new WorkspaceUnavailable();
    const endpoint = new URL("/rest/v1/" + table, config.SUPABASE_URL);
    for (const [key,value] of Object.entries(parameters)) endpoint.searchParams.set(key,value);
    let response: Response;
    try {
      response = await request(endpoint, {
        method: "GET",
        headers: {
          "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          "Accept-Profile": "maxx",
          "Accept": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch { throw new WorkspaceUnavailable(); }
    if (!response.ok) throw new WorkspaceUnavailable();
    let data: unknown;
    try { data = await response.json(); } catch { throw new WorkspaceUnavailable(); }
    if (!Array.isArray(data)) throw new WorkspaceUnavailable();
    return data as RecordRow[];
  }

  async function listForUser(userId: string): Promise<ClientWorkspace[]> {
    // Verified Google/Supabase subject. Dev bypass IDs and machine identities
    // cannot use any project capabilities.
    if (!isUUID(userId)) throw new WorkspaceForbidden();
    const orgRoles = await readRows("memberships", {
      select: "organization_id", user_id: "eq." + userId, status: "eq.active", limit: "100",
    });
    const activeOrgs = new Set(orgRoles.map(r => r.organization_id).filter(isUUID));
    if (!activeOrgs.size) return [];
    const grants = await readRows("project_memberships", {
      select: "organization_id,project_id,role",
      user_id: "eq." + userId, status: "eq.active", limit: "100",
    });
    const allow = new Map<string, {orgId:string; role:ClientWorkspace["role"]}>();
    for (const grant of grants) {
      if (!isUUID(grant.organization_id) || !isUUID(grant.project_id)) continue;
      const role = grant.role;
      if (!["owner","admin","operator","reviewer","viewer"].includes(String(role))) continue;
      if (!activeOrgs.has(grant.organization_id)) continue;
      allow.set(grant.project_id, {orgId:grant.organization_id,role:role as ClientWorkspace["role"]});
    }
    if (!allow.size) return [];
    const ids = [...allow.keys()];
    const projects = await readRows("projects", {
      select: "id,organization_id,slug,name,status",
      id: "in.(" + ids.join(",") + ")", limit: "100",
    });
    const workspaces: ClientWorkspace[] = [];
    for (const row of projects) {
      if (!isUUID(row.id) || !isUUID(row.organization_id)) continue;
      const grant = allow.get(row.id);
      if (!grant || grant.orgId !== row.organization_id) continue;
      if (!["active","paused","archived"].includes(String(row.status))) continue;
      if (typeof row.name !== "string" || typeof row.slug !== "string") continue;
      workspaces.push({
        id: row.id, organizationId: row.organization_id,
        slug: row.slug, name: row.name,
        role: grant.role, status: row.status as ClientWorkspace["status"],
        pendingApprovalCount: null, // requires separately verified project join
      });
    }
    return workspaces.sort((a,b) => a.name.localeCompare(b.name));
  }
  async function authorize(userId: string, projectId: string, write = false): Promise<ClientWorkspace> {
    if (!isUUID(projectId)) throw new WorkspaceForbidden();
    const workspace = (await listForUser(userId)).find(item => item.id === projectId);
    if (!workspace || workspace.status !== "active" ||
      (write && !["owner","admin","operator"].includes(workspace.role))) {
      throw new WorkspaceForbidden();
    }
    return workspace;
  }
  return { listForUser, authorize };
}
