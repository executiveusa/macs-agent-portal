import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlTowerApi, type AuthorizedWorkspace } from "@/services/controlTowerApi";

/** Client-specific draft requests: server, NOT this UI, enforces membership,
 * independent reviewer, one-time approval, no-tools profile and evidence.
 */
export function ClientMissionPanel({workspace,userId,suggestedObjective}:{
  workspace:AuthorizedWorkspace;
  userId:string;
  suggestedObjective?:string;
}) {
  const qc=useQueryClient();
  const [objective,setObjective]=useState("");
  const [notice,setNotice]=useState("");
  const key=["maxx-client-missions",userId,workspace.id];
  const inbox=useQuery({
    queryKey:key,
    queryFn:()=>controlTowerApi.getClientMissions(workspace.id),
    enabled:Boolean(userId&&workspace.status==="active"),
    retry:false,refetchInterval:15_000,
  });
  const reload=()=>{
    void qc.invalidateQueries({queryKey:key});
    void qc.invalidateQueries({queryKey:["maxx-client-approvals",userId,workspace.id]});
  };
  const mutation=useMutation({
    mutationFn:async(input:{kind:"propose"|"approve"|"reject"|"start"|"poll";id?:string})=>{
      if(input.kind==="propose")return controlTowerApi.proposeClientMission(
        workspace.id,crypto.randomUUID(),objective.trim());
      const id=input.id;
      if(!id)throw new Error("Mission ID required");
      if(input.kind==="approve"||input.kind==="reject")
        return controlTowerApi.decideClientMission(workspace.id,id,
          input.kind==="approve"?"approved":"rejected");
      if(input.kind==="start")return controlTowerApi.startClientMission(workspace.id,id);
      return controlTowerApi.pollClientMission(workspace.id,id);
    },
    onSuccess:(result,params)=>{
      if(params.kind==="propose")setObjective("");
      setNotice(result.note??(
        result.verification==="human_review_required"
          ? "Draft result is recorded but NOT independently verified."
          : "Status recorded; check the approval and evidence ledger before claiming completion."
      ));
      reload();
    },
    onError:(err)=>{
      setNotice(err instanceof Error?err.message:"The operation was denied or unavailable.");
      reload();
    },
  });
  const canRequest=["owner","admin","operator"].includes(workspace.role);
  const canReview=["owner","admin","reviewer"].includes(workspace.role);
  const canStart=canRequest;
  if(workspace.status!=="active")return null;
  return (
    <section aria-label="Scoped client draft missions" className="rounded-2xl border border-black/[0.08] bg-[#f5f6f1] p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-black/80">Client missions · approval required</h3>
          <p className="mt-1 text-xs leading-5 text-black/55">
            Internal drafts only. External tools, publishing, spending and customer messages are disabled.
            An independent reviewer must approve each mission. A worker receipt is not proof of a verified outcome.
          </p>
        </div>
        <button className="shrink-0 rounded-lg border border-black/10 px-2 py-1 text-xs"
          type="button" onClick={()=>void inbox.refetch()}>Refresh</button>
      </div>
      {canRequest&&(
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-black/60">
            New internal draft objective
            {suggestedObjective && (
              <button type="button"
                onClick={()=>setObjective(suggestedObjective.slice(0,2000))}
                className="ml-2 rounded-lg border border-black/10 px-2 py-1 text-[11px] font-normal text-black/60">
                Use latest chat or voice request
              </button>
            )}
            <textarea rows={2} value={objective} maxLength={2000}
              onChange={e=>setObjective(e.target.value)}
              placeholder="Prepare an internal draft for independent review…"
              className="mt-1 w-full rounded-xl border border-black/10 bg-white p-2 text-sm text-black/80"
            />
          </label>
          <button type="button" disabled={mutation.isPending||objective.trim().length<3}
            onClick={()=>mutation.mutate({kind:"propose"})}
            className="rounded-xl bg-[#24241f] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
            Request review
          </button>
        </div>
      )}
      {notice&&<p role="status" className="mt-2 text-xs text-amber-900">{notice}</p>}
      {inbox.isError&&<p role="alert" className="mt-3 text-xs text-red-800">
        Mission status is unavailable—not an empty list. No execution should be assumed.
      </p>}
      {inbox.isLoading&&<p className="mt-3 text-xs text-black/45">Checking verified mission history…</p>}
      {inbox.isSuccess&&inbox.data.missions.length===0&&(
        <p className="mt-3 text-xs text-black/50">No authorized draft missions recorded.</p>
      )}
      {inbox.data?.missions.map(m=>(
        <div key={m.missionId} className="mt-2 rounded-xl border border-black/[0.07] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-black/80">{m.status.replaceAll("_"," ")}</span>
            <span className="text-[11px] text-black/50">Approval: {m.approvalStatus}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-xs text-black/70">{m.objective}</p>
          {m.receiptId&&<p className="mt-1 break-all text-[11px] text-black/50">
            Receipt {m.receiptId} · pending independent verification
          </p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {canReview&&m.approvalStatus==="pending"&&m.requestedBy!==userId&&(
              <>
                <button type="button" disabled={mutation.isPending}
                  onClick={()=>mutation.mutate({kind:"approve",id:m.missionId})}
                  className="rounded-lg border border-black/15 px-2.5 py-1 text-xs disabled:opacity-40">
                  Approve internal draft
                </button>
                <button type="button" disabled={mutation.isPending}
                  onClick={()=>mutation.mutate({kind:"reject",id:m.missionId})}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-800 disabled:opacity-40">
                  Reject
                </button>
              </>
            )}
            {canStart&&m.approvalStatus==="approved"&&m.status==="queued"&&(
              <button type="button" disabled={mutation.isPending}
                onClick={()=>mutation.mutate({kind:"start",id:m.missionId})}
                className="rounded-lg border border-black/15 px-2.5 py-1 text-xs disabled:opacity-40">
                Dispatch approved draft
              </button>
            )}
            {m.status==="running"&&canStart&&(
              <button type="button" disabled={mutation.isPending}
                onClick={()=>mutation.mutate({kind:"poll",id:m.missionId})}
                className="rounded-lg border border-black/15 px-2.5 py-1 text-xs disabled:opacity-40">
                Check verified worker status
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
