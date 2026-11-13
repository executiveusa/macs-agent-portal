import type { MaxxConfig } from "./config.js";

/** One Supabase service-role-only RPC facade; maxx stays out of Data API. */
export type ClientWorkspace = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  role: "owner" | "admin" | "operator" | "reviewer" | "viewer";
  status: "active" | "paused" | "archived";
  archiveRequestId: string | null;
  recoveryUntil: string | null;
  pendingApprovalCount: number | null;
  urgentApprovalCount: number | null;
  suggestedTasks: string[];
  promptsSource: "verified" | "unavailable";
};
export class WorkspaceUnavailable extends Error {
  readonly status = 503;
  constructor() { super("Project-scoped access is not configured or cannot be verified."); }
}
export class WorkspaceForbidden extends Error {
  readonly status = 403;
  constructor() { super("This identity is not authorized for the requested workspace."); }
}
export class WorkspaceConflict extends Error {
  readonly status = 409;
  constructor() { super("The requested client operation is not valid in its current state."); }
}
export class WorkspaceInvalid extends Error {
  readonly status = 400;
  constructor() { super("Invalid workspace request."); }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (x: unknown): x is string => typeof x === "string" && UUID.test(x);
const memberRoles = ["owner","admin","operator","reviewer","viewer"];
const statuses = ["active","paused","archived"];
const validName = (x:string) => x.trim().length>=2 && x.trim().length<=100;
const validSlug = (x:string) => /^[a-z][a-z0-9-]{2,60}$/.test(x);
type Cfg = Pick<MaxxConfig, "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">;
type ClientRecord = Record<string, unknown>;
function parseWorkspace(row: unknown): ClientWorkspace {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new WorkspaceUnavailable();
  const r = row as ClientRecord;
  if (!isUUID(r.id) || !isUUID(r.organizationId) || typeof r.slug !== "string" ||
      typeof r.name !== "string" || !memberRoles.includes(String(r.role)) ||
      !statuses.includes(String(r.status)) || !Array.isArray(r.suggestedTasks) ||
      r.suggestedTasks.length > 20 || !r.suggestedTasks.every(x => typeof x === "string" && x.length <= 300) ||
      r.promptsSource !== "verified" ||
      (r.archiveRequestId!==null && !isUUID(r.archiveRequestId)) ||
      (r.recoveryUntil!==null && typeof r.recoveryUntil!=="string") ||
      ![r.pendingApprovalCount,r.urgentApprovalCount].every(x=>Number.isInteger(x) && Number(x)>=0)) {
    throw new WorkspaceUnavailable();
  }
  return r as unknown as ClientWorkspace;
}
export function createClientWorkspaceService(config:Cfg,enabled:boolean,request:typeof fetch=fetch) {
  async function rpc(name:string,payload:Record<string,unknown>):Promise<unknown> {
    if (!enabled || !config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY)
      throw new WorkspaceUnavailable();
    let endpoint:URL;
    try {
      endpoint = new URL("/rest/v1/rpc/" + name,config.SUPABASE_URL);
      if(endpoint.protocol!=="https:" && !["localhost","127.0.0.1"].includes(endpoint.hostname))
        throw new WorkspaceUnavailable();
    } catch { throw new WorkspaceUnavailable(); }
    let response:Response;
    try {
      response = await request(endpoint,{
        method:"POST",cache:"no-store",
        signal:AbortSignal.timeout(10_000),
        headers:{
          "apikey":config.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization":"Bearer "+config.SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type":"application/json","Accept":"application/json",
        },
        body:JSON.stringify(payload),
      });
    } catch { throw new WorkspaceUnavailable(); }
    if(!response.ok){
      if(response.status===400 || response.status===409) throw new WorkspaceConflict();
      if(response.status===403) throw new WorkspaceForbidden();
      throw new WorkspaceUnavailable();
    }
    try {return await response.json();} catch {throw new WorkspaceUnavailable();}
  }
  async function listForUser(userId:string):Promise<ClientWorkspace[]> {
    if(!isUUID(userId)) throw new WorkspaceForbidden();
    const raw=await rpc("maxx_service_client_workspaces",{p_user_id:userId});
    if(!Array.isArray(raw) || raw.length>100) throw new WorkspaceUnavailable();
    const seen=new Set<string>();
    const rows=raw.map(parseWorkspace);
    for(const row of rows){
      if(seen.has(row.id)) throw new WorkspaceUnavailable();
      seen.add(row.id);
    }
    return rows;
  }
  async function authorize(userId:string,projectId:string,write=false):Promise<ClientWorkspace> {
    if(!isUUID(projectId)) throw new WorkspaceForbidden();
    const row=(await listForUser(userId)).find(v=>v.id===projectId);
    if(!row || row.status!=="active" ||
       (write && !["owner","admin","operator"].includes(row.role))) throw new WorkspaceForbidden();
    return row;
  }
  async function createClient(userId:string,organizationId:string,name:string,slug:string) {
    if(!isUUID(userId)||!isUUID(organizationId)) throw new WorkspaceForbidden();
    if(!validName(name)||!validSlug(slug)) throw new WorkspaceInvalid();
    const result=await rpc("maxx_service_create_client_workspace",{
      p_actor:userId,p_organization_id:organizationId,p_name:name.trim(),p_slug:slug,
    });
    const r=result as ClientRecord | null;
    if(!r || !isUUID(r.id) || r.status!=="active" || r.slug!==slug) throw new WorkspaceUnavailable();
    return {id:r.id,status:r.status,slug:r.slug};
  }
  async function archiveStep(
    userId:string,projectId:string,step:"start"|"acknowledge"|"type_name"|"archive"|"restore",
    requestId?:string,typedName?:string,
  ) {
    if(!isUUID(userId)||!isUUID(projectId)) throw new WorkspaceForbidden();
    if(step!=="start" && (!requestId || !isUUID(requestId))) throw new WorkspaceInvalid();
    if(step==="type_name" && (!typedName || typedName.length>100)) throw new WorkspaceInvalid();
    const rows=await listForUser(userId);
    const target=rows.find(row=>row.id===projectId);
    if(!target || !["owner","admin"].includes(target.role)) throw new WorkspaceForbidden();
    if(step==="restore" ? target.status!=="archived" : target.status!=="active")
      throw new WorkspaceConflict();
    const result=await rpc("maxx_service_archive_client_step",{
      p_actor:userId,p_project_id:projectId,p_step:step,
      p_request_id:requestId??null,p_typed_name:typedName??null,
    });
    if(!result || typeof result!=="object" || Array.isArray(result)) throw new WorkspaceUnavailable();
    const r=result as ClientRecord;
    if(r.projectId!==projectId || typeof r.state!=="string") throw new WorkspaceUnavailable();
    return result;
  }
  return {listForUser,authorize,createClient,archiveStep};
}
