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
  approvalCoverage: "maxx_only";
  suggestedTasks: string[];
  promptsSource: "operator_template" | "verified" | "unavailable";
};
export type ClientApprovalSummary = {
  id:string;
  actionKey:string;
  actionClass:string;
  riskClass:string;
  status:"pending";
  requestedAt:string;
  expiresAt:string;
};
export type ClientChatMessage = {id:string;role:"stacy"|"maxx";text:string;createdAt:string};
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
      !["operator_template","verified"].includes(String(r.promptsSource)) || r.approvalCoverage !== "maxx_only" ||
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
    userId:string,projectId:string,step:"start"|"acknowledge"|"type_name"|"archive"|"restore"|"cancel",
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
    // Restore RPC returns {status:"restored",projectId}; archive steps return
    // {state,projectId,...}. Reject unexpected responses without reporting a
    // successfully restored project as a service failure.
    if(r.projectId!==projectId ||
       (step==="restore" ? r.status!=="restored" : typeof r.state!=="string")) {
      throw new WorkspaceUnavailable();
    }
    return result;
  }
  function parseChatMessage(item:unknown):ClientChatMessage {
    if(!item || typeof item!=="object" || Array.isArray(item)) throw new WorkspaceUnavailable();
    const r=item as ClientRecord;
    if(!isUUID(r.id) || !["stacy","maxx"].includes(String(r.role)) ||
       typeof r.text!=="string" || r.text.length<1 || r.text.length>20_000 ||
       typeof r.createdAt!=="string" || !Number.isFinite(Date.parse(r.createdAt)))
      throw new WorkspaceUnavailable();
    return r as unknown as ClientChatMessage;
  }
  async function listChatHistory(userId:string,projectId:string,limit=100):Promise<ClientChatMessage[]> {
    await authorize(userId,projectId);
    if(!Number.isInteger(limit)||limit<1||limit>200) throw new WorkspaceInvalid();
    const raw=await rpc("maxx_service_client_chat_history",{
      p_actor:userId,p_project_id:projectId,p_limit:limit,
    });
    if(!Array.isArray(raw)||raw.length>limit) throw new WorkspaceUnavailable();
    return raw.map(parseChatMessage);
  }
  async function recordChatExchange(userId:string,projectId:string,exchangeId:string,
    question:string,answer:string):Promise<void> {
    await authorize(userId,projectId,true);
    if(!isUUID(exchangeId)||typeof question!=="string"||!question.trim()||question.length>20_000||
       typeof answer!=="string"||!answer.trim()||answer.length>20_000)
      throw new WorkspaceInvalid();
    const raw=await rpc("maxx_service_record_client_chat_exchange",{
      p_actor:userId,p_project_id:projectId,p_exchange_id:exchangeId,
      p_request:question,p_response:answer,
    });
    if(!Array.isArray(raw)||raw.length!==2) throw new WorkspaceUnavailable();
    // SQL returns the two immutable rows. Never claim persistence from a 2xx
    // with a malformed/empty payload.
    const roles=raw.map((x:unknown)=>x&&typeof x==="object"?(x as ClientRecord).role:null);
    if(roles[0]!=="stacy"||roles[1]!=="maxx"||
       !raw.every((x:unknown)=>x&&typeof x==="object"&&isUUID((x as ClientRecord).id)))
      throw new WorkspaceUnavailable();
  }
  async function listPendingApprovals(userId:string,projectId:string):Promise<ClientApprovalSummary[]> {
    await authorize(userId,projectId);
    const raw=await rpc("maxx_service_client_pending_approvals",{
      p_actor:userId,p_project_id:projectId,p_limit:20,
    });
    if(!Array.isArray(raw)||raw.length>20) throw new WorkspaceUnavailable();
    return raw.map((item:unknown)=>{
      if(!item||typeof item!=="object"||Array.isArray(item)) throw new WorkspaceUnavailable();
      const v=item as ClientRecord;
      if(!isUUID(v.id)||v.status!=="pending"||
         !["actionKey","actionClass","riskClass"].every(k=>
           typeof v[k]==="string" && (v[k] as string).length<=300)||
         typeof v.requestedAt!=="string"||!Number.isFinite(Date.parse(v.requestedAt))||
         typeof v.expiresAt!=="string"||!Number.isFinite(Date.parse(v.expiresAt)))
        throw new WorkspaceUnavailable();
      return v as unknown as ClientApprovalSummary;
    });
  }
  // Scoped ICM deliberately reuses the existing maxx.workflow_runs,
  // maxx.action_proposals, maxx.approvals and maxx.evidence_receipts ledger.
  // None of these RPCs can be called by browser roles or machine API keys.
  const validMission = (x:unknown):x is string => isUUID(x);
  const validHash = (x:unknown):x is string => typeof x==="string" && /^[a-f0-9]{64}$/.test(x);
  function missionObject(raw:unknown):ClientRecord {
    if(!raw || typeof raw!=="object" || Array.isArray(raw)) throw new WorkspaceUnavailable();
    return raw as ClientRecord;
  }
  async function proposeClientMission(userId:string,projectId:string,missionId:string,objective:string) {
    await authorize(userId,projectId,true);
    if(!validMission(missionId)||objective.trim().length<3||objective.length>2000)
      throw new WorkspaceInvalid();
    const r=missionObject(await rpc("maxx_service_client_mission_propose",{
      p_actor:userId,p_project_id:projectId,p_mission_id:missionId,p_objective:objective,
    }));
    if(r.missionId!==missionId||r.projectId!==projectId||!isUUID(r.approvalId)||
       !validHash(r.actionHash)||r.action!=="client_draft_only"||
       !["pending","approved","rejected"].includes(String(r.status)) ||
       typeof r.expiresAt!=="string")
      throw new WorkspaceUnavailable();
    return r;
  }
  async function decideClientMission(userId:string,projectId:string,missionId:string,
      decision:"approved"|"rejected") {
    await authorize(userId,projectId);
    if(!validMission(missionId)) throw new WorkspaceInvalid();
    const r=missionObject(await rpc("maxx_service_client_mission_decide",{
      p_actor:userId,p_project_id:projectId,p_mission_id:missionId,p_decision:decision,
    }));
    if(r.missionId!==missionId||r.projectId!==projectId||r.status!==decision||
       !isUUID(r.approvalId)||typeof r.duplicate!=="boolean") throw new WorkspaceUnavailable();
    return r;
  }
  async function claimClientMission(userId:string,projectId:string,missionId:string) {
    await authorize(userId,projectId,true);
    if(!validMission(missionId)) throw new WorkspaceInvalid();
    const r=missionObject(await rpc("maxx_service_client_mission_claim",{
      p_actor:userId,p_project_id:projectId,p_mission_id:missionId,
    }));
    if(r.missionId!==missionId||r.projectId!==projectId||!isUUID(r.organizationId)||
       !isUUID(r.approvedBy)||r.approvedBy===userId||!validHash(r.actionHash)||
       r.action!=="client_draft_only"||!Array.isArray(r.allowedTools)||
       r.allowedTools.length!==0||r.externalSideEffects!==false||r.budgetUsd!==0||
       typeof r.objective!=="string"||r.objective.length<3||r.objective.length>2000)
      throw new WorkspaceUnavailable();
    return r as {
      missionId:string;projectId:string;organizationId:string;approvedBy:string;
      actionHash:string;action:"client_draft_only";allowedTools:[];externalSideEffects:false;
      budgetUsd:0;objective:string;
    };
  }
  async function recordClientDispatch(userId:string,projectId:string,missionId:string,
      source:"hermes"|"instinct",externalRunId:string) {
    await authorize(userId,projectId,true);
    if(!validMission(missionId)||!externalRunId||externalRunId.length>150)
      throw new WorkspaceInvalid();
    const r=missionObject(await rpc("maxx_service_client_mission_record_dispatch",{
      p_actor:userId,p_project_id:projectId,p_mission_id:missionId,
      p_source:source,p_external_run_id:externalRunId,
    }));
    if(r.projectId!==projectId||r.missionId!==missionId||r.source!==source||
       r.externalRunId!==externalRunId||r.status!=="dispatched")
      throw new WorkspaceUnavailable();
    return r;
  }
  async function finishClientMission(userId:string,projectId:string,missionId:string,
    receiptId:string,outcome:"completed"|"failed",receipt:{
      source:"hermes"|"instinct";externalRunId:string;summary:string;
      projectId:string;missionId:string;
    }) {
    await authorize(userId,projectId,true);
    if(!validMission(missionId)||!isUUID(receiptId)||receipt.projectId!==projectId||
      receipt.missionId!==missionId||!receipt.externalRunId||
      receipt.externalRunId.length>150||!receipt.summary||receipt.summary.length>1000)
      throw new WorkspaceInvalid();
    const r=missionObject(await rpc("maxx_service_client_mission_finish",{
      p_actor:userId,p_project_id:projectId,p_mission_id:missionId,
      p_receipt_id:receiptId,p_outcome:outcome,p_receipt:receipt,
    }));
    if(r.missionId!==missionId||r.receiptId!==receiptId||r.status!==outcome||
       r.verification!=="human_review_required"||typeof r.duplicate!=="boolean")
      throw new WorkspaceUnavailable();
    return r;
  }
  async function getClientMission(userId:string,projectId:string,missionId:string) {
    await authorize(userId,projectId);
    if(!validMission(missionId)) throw new WorkspaceInvalid();
    const r=missionObject(await rpc("maxx_service_client_mission_status",{
      p_actor:userId,p_project_id:projectId,p_mission_id:missionId,
    }));
    if(r.missionId!==missionId||r.projectId!==projectId||!isUUID(r.approvalId)||
       !["queued","running","blocked","waiting_approval","completed","failed","cancelled"].includes(String(r.status))||
       !["pending","approved","rejected","expired","cancelled"].includes(String(r.approvalStatus))||
       (r.receiptId!==null&&!isUUID(r.receiptId))||
       !["not_yet_executed","human_review_required"].includes(String(r.verification)))
      throw new WorkspaceUnavailable();
    if(r.dispatch!==null && r.dispatch!==undefined &&
       (typeof r.dispatch!=="object"||Array.isArray(r.dispatch)||
        !["hermes","instinct"].includes(String((r.dispatch as ClientRecord).source))||
        typeof (r.dispatch as ClientRecord).externalRunId!=="string"||
        ((r.dispatch as ClientRecord).externalRunId as string).length>150))
      throw new WorkspaceUnavailable();
    return r as {
      missionId:string;projectId:string;status:string;approvalStatus:string;
      approvalId:string;receiptId:string|null;verification:string;
      dispatch?:{source:"hermes"|"instinct";externalRunId:string}|null;
    };
  }
  async function listClientMissions(userId:string,projectId:string,limit=30) {
    await authorize(userId,projectId);
    if(!Number.isInteger(limit)||limit<1||limit>50) throw new WorkspaceInvalid();
    const raw=await rpc("maxx_service_client_missions",{
      p_actor:userId,p_project_id:projectId,p_limit:limit,
    });
    if(!Array.isArray(raw)||raw.length>limit) throw new WorkspaceUnavailable();
    return raw.map(item=>{
      const r=missionObject(item);
      if(!isUUID(r.missionId)||r.projectId!==projectId||!isUUID(r.requestedBy)||
         typeof r.objective!=="string"||r.objective.length<3||r.objective.length>2000||
         !["waiting_approval","queued","running","completed","failed","blocked","cancelled"].includes(String(r.status))||
         !["pending","approved","rejected","expired","cancelled"].includes(String(r.approvalStatus))||
         !isUUID(r.approvalId)||(r.receiptId!==null&&!isUUID(r.receiptId))||
         typeof r.createdAt!=="string"||!Number.isFinite(Date.parse(r.createdAt)))
        throw new WorkspaceUnavailable();
      return r as {
        missionId:string;projectId:string;requestedBy:string;objective:string;
        status:string;approvalStatus:string;approvalId:string;
        receiptId:string|null;createdAt:string;
      };
    });
  }
  return {listForUser,authorize,createClient,archiveStep,listChatHistory,
    recordChatExchange,listPendingApprovals,proposeClientMission,
    decideClientMission,claimClientMission,recordClientDispatch,
    finishClientMission,getClientMission,listClientMissions};
}
