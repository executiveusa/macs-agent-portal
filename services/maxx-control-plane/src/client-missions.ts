import { randomUUID } from "node:crypto";
import type { MaxxConfig } from "./config.js";
import type { HermesAdapter } from "./hermes-adapter.js";
import { createIcmRun } from "./icm-runtime.js";
import { dispatchInstinctDraft, type ScopedClientDraftClaim } from "./instinct-a2a.js";
import type { createClientWorkspaceService } from "./client-workspaces.js";

type Workspaces = ReturnType<typeof createClientWorkspaceService>;

export class ClientExecutorUnavailable extends Error {
  readonly status = 503;
  constructor(detail="Scoped client draft execution has not been approved on this server.") { super(detail); }
}

export function createClientMissionController(
  config: MaxxConfig, workspaces: Workspaces, hermes: HermesAdapter,
  fetchImpl: typeof fetch = fetch,
) {
  function executorReady(): void {
    if(!config.clientWorkspacesEnabled || config.MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED!=="true" ||
        config.emergencyDisabled)
      throw new ClientExecutorUnavailable();
    if(config.MAXX_CLIENT_DRAFT_EXECUTOR==="hermes" &&
       (!config.featureFlags.MAXX_HERMES_ENABLED || !config.MAXX_HERMES_ENDPOINT ||
        !config.MAXX_HERMES_API_KEY || !config.MAXX_CLIENT_DRAFT_HERMES_PROFILE))
      throw new ClientExecutorUnavailable("Dedicated no-tools Hermes profile is not verified/configured.");
    if(config.MAXX_CLIENT_DRAFT_EXECUTOR==="instinct" &&
       (!config.MAXX_INSTINCT_A2A_KEY || !config.MAXX_INSTINCT_A2A_URL))
      throw new ClientExecutorUnavailable("Signed Instinct A2A endpoint is not configured.");
  }

  async function propose(actor:string,projectId:string,missionId:string,objective:string) {
    if(!config.clientWorkspacesEnabled) throw new ClientExecutorUnavailable();
    return workspaces.proposeClientMission(actor,projectId,missionId,objective);
  }

  async function decide(actor:string,projectId:string,missionId:string,decision:"approved"|"rejected") {
    if(!config.clientWorkspacesEnabled) throw new ClientExecutorUnavailable();
    return workspaces.decideClientMission(actor,projectId,missionId,decision);
  }

  async function list(actor:string,projectId:string) {
    if(!config.clientWorkspacesEnabled) throw new ClientExecutorUnavailable();
    return workspaces.listClientMissions(actor,projectId);
  }

  async function get(actor:string,projectId:string,missionId:string) {
    if(!config.clientWorkspacesEnabled) throw new ClientExecutorUnavailable();
    return workspaces.getClientMission(actor,projectId,missionId);
  }

  async function start(actor:string,projectId:string,missionId:string) {
    executorReady(); // Must fail BEFORE the SQL claim, so disabling tools leaves state untouched.
    // Approval, active membership and one-time dispatch claim are checked under
    // a PostgreSQL row lock. No browser-supplied objective, key or tool is used.
    const claim=await workspaces.claimClientMission(actor,projectId,missionId);
    // The SQL claim must never be replayed after an ambiguous network failure.
    // A remote worker may already have accepted it. Quarantine uncertainty
    // and require a human to reconcile the actual provider run ID.
    try {
      const typedClaim:ScopedClientDraftClaim=claim;
      let source:"hermes"|"instinct"=config.MAXX_CLIENT_DRAFT_EXECUTOR;
      let externalRunId:string;
      if(source==="instinct"){
        externalRunId=await dispatchInstinctDraft(config,typedClaim,actor,fetchImpl);
      } else {
        // Only a SEPARATELY-reviewed no-tools Hermes profile may be configured.
        // Free-form client instructions must never bypass the worker's sandbox.
        const icm=await createIcmRun({
          root:config.MAXX_ICM_ROOT,
          missionId,operatorId:actor,
          objective:claim.objective,
        });
        const boundedObjective=[
          "APPROVED CLIENT-DRAFT-ONLY ICM TASK. NO TOOLS OR EXTERNAL SIDE EFFECTS.",
          "The worker profile MUST have an empty tool allowlist.",
          "Do not read files, databases, APIs, customers or third-party systems.",
          "Do not send, publish, spend, deploy, or execute code.",
          "Return an unverified internal draft; an independent human must review it.",
          "Trusted scope (not model-granted permissions):",
          JSON.stringify({organizationId:claim.organizationId,projectId,missionId,
            actionHash:claim.actionHash,allowedTools:claim.allowedTools,
            externalSideEffects:false,budgetUsd:0,approvedBy:claim.approvedBy}),
          "Untrusted client request (text ONLY):",
          claim.objective,
        ].join("\n");
        const response=await hermes.startRun({
          runId:missionId,missionId,objective:boundedObjective,
          workspacePath:icm.runPath,stage:"04_execute",
          profile:config.MAXX_CLIENT_DRAFT_HERMES_PROFILE!,
        });
        if(!response.runId || response.runId.length>150 || response.status==="failed" ||
           response.status==="error") throw new Error("Hermes did not acknowledge a safe scoped draft run");
        externalRunId=response.runId;
      }
      const ack=await workspaces.recordClientDispatch(
        actor,projectId,missionId,source,externalRunId,
      );
      return {status:"dispatched",projectId,missionId,
        externalRunId:ack.externalRunId,source,verification:"human_review_required",
        note:"Worker acknowledgement only; no action or commercial outcome is verified."};
    } catch {
      try {
        await workspaces.blockUnconfirmedClientDispatch(actor,projectId,missionId);
      } catch {
        // Another committed dispatch acknowledgement may exist. Do not
        // overwrite it or claim either successful execution or rollback.
      }
      throw new ClientExecutorUnavailable(
        "Remote dispatch was not confirmed. Mission requires operator reconciliation; do not retry automatically.",
      );
    }
  }

  async function poll(actor:string,projectId:string,missionId:string) {
    const status=await get(actor,projectId,missionId);
    if(status.status!=="running" || !status.dispatch) return status;
    if(status.dispatch.source!=="hermes") return status; // Instinct reports only by signed callback.
    executorReady();
    const state=await hermes.getRunState(status.dispatch.externalRunId,
      config.MAXX_CLIENT_DRAFT_HERMES_PROFILE);
    if(!state) throw new ClientExecutorUnavailable("Hermes run receipt is unavailable for reconciliation.");
    if(!["completed","failed","timeout","error","cancelled"].includes(state.status))
      return {...status,workerStatus:state.status,verification:"not_yet_executed"};
    const outcome=state.status==="completed"?"completed":"failed";
    const summary=typeof state.result?.output==="string" && state.result.output.trim()
      ? (state.result.output as string).trim().slice(0,1000)
      : `Hermes reported ${state.status}; draft content requires independent verification.`;
    // The mission ID is a durable, deterministic receipt identity. Repeated
    // polls cannot mint a second independent success/receipt.
    return workspaces.finishClientMission(actor,projectId,missionId,missionId,outcome,{
      source:"hermes",externalRunId:status.dispatch.externalRunId,
      summary,projectId,missionId,
    });
  }

  async function finishFromInstinct(payload:{
    actorId:string; projectId:string; missionId:string; deliveryId:string;
    externalRunId:string; outcome:"completed"|"failed"; summary:string;
  }) {
    if(!config.clientWorkspacesEnabled || config.emergencyDisabled ||
      config.MAXX_CLIENT_DRAFT_EXECUTOR_ENABLED!=="true" ||
      config.MAXX_CLIENT_DRAFT_EXECUTOR!=="instinct")
      throw new ClientExecutorUnavailable();
    const current=await workspaces.getClientMission(
      payload.actorId,payload.projectId,payload.missionId);
    if(current.status!=="running"||current.dispatch?.source!=="instinct"||
       current.dispatch.externalRunId!==payload.externalRunId)
      throw new ClientExecutorUnavailable("Instinct result does not match an acknowledged client mission.");
    return workspaces.finishClientMission(
      payload.actorId,payload.projectId,payload.missionId,payload.deliveryId,
      payload.outcome,{
        source:"instinct",externalRunId:payload.externalRunId,
        summary:payload.summary,projectId:payload.projectId,missionId:payload.missionId,
      },
    );
  }

  return {propose,decide,get,list,start,poll,finishFromInstinct,executorReady};
}
