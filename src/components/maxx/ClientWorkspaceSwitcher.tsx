import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, CircleHelp, Plus, ShieldCheck, X, ArchiveRestore } from "lucide-react";
import { MAXX_CLIENT_CATALOG } from "@/lib/maxx-client-workspaces";
import type { AuthorizedWorkspace } from "@/services/controlTowerApi";
import { controlTowerApi } from "@/services/controlTowerApi";

type Props = {
  selectedSlug:string|null;
  onSelect:(slug:string|null)=>void;
  verifiedWorkspaces:readonly AuthorizedWorkspace[];
  connectionState:"loading"|"verified"|"unavailable";
};
const protectedSlugs=new Set(["macs-digital-media","client-zero"]);
const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60);
type ArchiveStage="idle"|"review"|"acknowledged"|"typed"|"final";

export function ClientWorkspaceSwitcher({selectedSlug,onSelect,verifiedWorkspaces,connectionState}:Props){
  const queryClient=useQueryClient();
  const [open,setOpen]=useState(false);
  const [view,setView]=useState<"switch"|"alerts"|"manage">("switch");
  const [name,setName]=useState("");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [candidate,setCandidate]=useState<AuthorizedWorkspace|null>(null);
  const [archiveStage,setArchiveStage]=useState<ArchiveStage>("idle");
  const [requestId,setRequestId]=useState<string|null>(null);
  const [typedName,setTypedName]=useState("");
  const [restoreConfirm,setRestoreConfirm]=useState<string|null>(null);
  const known=new Set(MAXX_CLIENT_CATALOG.map(c=>c.slug));
  const visible=[
    ...MAXX_CLIENT_CATALOG.map(c=>({slug:c.slug,name:c.name,
      verified:verifiedWorkspaces.find(w=>w.slug===c.slug)})),
    ...verifiedWorkspaces.filter(w=>!known.has(w.slug as typeof MAXX_CLIENT_CATALOG[number]["slug"]))
      .map(w=>({slug:w.slug,name:w.name,verified:w})),
  ];
  const selected=visible.find(x=>x.slug===selectedSlug);
  const canAdmin=verifiedWorkspaces.some(w=>["owner","admin"].includes(w.role) && w.status==="active");
  const adminOrg=verifiedWorkspaces.find(w=>["owner","admin"].includes(w.role) &&
    w.slug==="macs-digital-media")?.organizationId ??
    verifiedWorkspaces.find(w=>["owner","admin"].includes(w.role))?.organizationId;
  const alertUnknown=connectionState!=="verified" || verifiedWorkspaces.length===0 ||
    verifiedWorkspaces.some(w=>w.pendingApprovalCount===null || w.urgentApprovalCount===null);
  const pendingTotal=verifiedWorkspaces.reduce((sum,w)=>sum+(w.pendingApprovalCount??0),0);
  const urgentTotal=verifiedWorkspaces.reduce((sum,w)=>sum+(w.urgentApprovalCount??0),0);
  const tone=urgentTotal>0?"bg-red-500":pendingTotal>0?"bg-amber-500":
    alertUnknown?"bg-slate-400":"bg-emerald-600";
  const alertLabel=urgentTotal>0?`${urgentTotal} urgent client approvals`:
    pendingTotal>0?`${pendingTotal} pending client approvals`:
      alertUnknown?"Client approval status unknown":"No pending client approvals";
  const refresh=()=>queryClient.invalidateQueries({queryKey:["maxx-client-workspaces"]});
  async function change<T>(action:()=>Promise<T>,onSuccess:(value:T)=>void){
    setBusy(true);setNotice("");
    try {onSuccess(await action());await refresh();}
    catch(error){setNotice(error instanceof Error?error.message:"Client service unavailable");}
    finally {setBusy(false);}
  }
  function beginArchive(workspace:AuthorizedWorkspace){
    setCandidate(workspace);setArchiveStage("review");setRequestId(null);
    setTypedName("");setNotice("");
  }
  async function advanceArchive(){
    if(!candidate || busy)return;
    const step=archiveStage==="review"?"start":
      archiveStage==="acknowledged"?"acknowledge":
      archiveStage==="typed"?"type_name":"archive";
    await change(
      ()=>controlTowerApi.advanceClientArchive(candidate.id,step,requestId??undefined,
        step==="type_name"?typedName:undefined),
      value=>{
        if(step==="start"){setRequestId(value.requestId);setArchiveStage("acknowledged");}
        else if(step==="acknowledge")setArchiveStage("typed");
        else if(step==="type_name")setArchiveStage("final");
        else {setArchiveStage("idle");setCandidate(null);setNotice("Archived with at least 30 days for restoration.");}
      },
    );
  }
  return <div className="relative flex min-w-0 items-center gap-1">
    <button type="button" onClick={()=>{setOpen(!open);setView("switch");}}
      aria-expanded={open} aria-haspopup="dialog" aria-label="Switch client"
      className="flex h-10 max-w-[43vw] items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-black/70 sm:max-w-[285px]">
      <span className="truncate">{selected?.name??"General MAXX"}</span><ChevronDown size={14}/>
    </button>
    <button type="button" onClick={()=>{setOpen(true);setView("alerts");}}
      aria-label={alertLabel} title={alertLabel}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/65">
      <Bell size={17}/><span className={`absolute right-1 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${tone}`}/>
    </button>
    {open&&<div role="dialog" aria-label="Client workspaces"
      className="absolute left-0 top-12 z-50 w-[min(375px,calc(100vw-24px))] max-h-[min(78dvh,630px)] overflow-y-auto rounded-2xl border border-black/10 bg-[#fffefa] p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <strong className="text-sm text-[#24241f]">My client workspaces</strong>
        <button type="button" aria-label="Close client menu" onClick={()=>setOpen(false)} className="rounded-full p-2 hover:bg-black/5"><X size={16}/></button>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/[0.04] p-1 text-xs">
        {(["switch","alerts","manage"] as const).map(tab=><button type="button" key={tab}
          onClick={()=>setView(tab)}
          className={`rounded-md px-2 py-2 capitalize ${view===tab?"bg-white font-semibold shadow-sm":"text-black/55"}`}>{tab}</button>)}
      </div>
      {view==="switch"&&<div className="mt-3 space-y-1">
        <button type="button" onClick={()=>{onSelect(null);setOpen(false);}}
          className={`w-full rounded-xl px-3 py-3 text-left text-sm ${selectedSlug===null?"bg-[#e9eee7] font-semibold":"hover:bg-black/[0.03]"}`}>
          General MAXX <span className="block text-xs font-normal text-black/45">No client-specific records</span>
        </button>
        {visible.map(c=><button type="button" key={c.slug}
          onClick={()=>{onSelect(c.slug);setOpen(false);}}
          className={`w-full rounded-xl px-3 py-3 text-left text-sm ${selectedSlug===c.slug?"bg-[#e9eee7] font-semibold":"hover:bg-black/[0.03]"}`}>
          <span className="flex justify-between gap-2"><span>{c.name}</span>
            <span className={`text-[10px] font-medium ${c.verified?.status==="active"?"text-emerald-700":"text-amber-700"}`}>
              {c.verified?.status==="active"?"Authorized":c.verified?.status==="archived"?"Archived":"Setup needed"}
            </span>
          </span>
        </button>)}
        <p className="pt-2 text-xs text-black/50">Suggested tasks follow the selected company. Access requires server-confirmed permission.</p>
      </div>}
      {view==="alerts"&&<div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${tone}`}/><strong>Needs attention</strong></div>
        <p className="text-black/60">{alertUnknown?"Some approval data is unavailable. Unknown never means zero.":
          pendingTotal>0?`${pendingTotal} verified pending approvals`:"No verified pending client approvals."}</p>
        {verifiedWorkspaces.filter(w=>(w.pendingApprovalCount??0)>0).map(w=>
          <div className="flex justify-between gap-2 rounded-lg border p-3 text-xs" key={w.id}>
            <strong>{w.name}</strong><span>{w.pendingApprovalCount} pending{(w.urgentApprovalCount??0)>0?` · ${w.urgentApprovalCount} urgent`:""}</span>
          </div>)}
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Instinct notifications remain off until authenticated bridge and delivery testing pass.</p>
      </div>}
      {view==="manage"&&<div className="mt-4 space-y-4 text-sm">
        <div className="flex items-center gap-2"><Plus size={16}/><strong>Add a client</strong></div>
        <form onSubmit={e=>{
          e.preventDefault();const slug=slugify(name);
          if(!canAdmin||!adminOrg||slug.length<3||busy)return;
          void change(()=>controlTowerApi.addClientWorkspace(adminOrg,name,slug),()=>{
            setName("");setNotice("Client created; access is limited to verified members.");
          });
        }} className="space-y-2">
          <label htmlFor="new-client-name" className="block text-xs text-black/65">Company name</label>
          <input id="new-client-name" value={name} onChange={e=>setName(e.target.value)} maxLength={100}
            placeholder="Business name" className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"/>
          <button type="submit" disabled={!canAdmin||!adminOrg||busy||slugify(name).length<3}
            className="min-h-10 w-full rounded-xl bg-[#24241f] px-4 text-xs font-semibold text-white disabled:opacity-30">
            {busy?"Checking…":"Create client"}
          </button>
        </form>
        {!canAdmin&&<p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Owner/admin access is required to add or archive clients.</p>}
        <div className="border-t border-black/10 pt-4">
          <strong className="flex items-center gap-2"><ArchiveRestore size={16}/>Archived clients & recovery</strong>
          {verifiedWorkspaces.filter(w=>w.status==="archived").map(w=>
            <div key={w.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0"><strong className="text-xs">{w.name}</strong>
                <p className="text-[11px] text-black/45">{w.recoveryUntil? `Recoverable until ${new Date(w.recoveryUntil).toLocaleDateString()}`:"Recovery status unavailable"}</p>
              </div>
              <button type="button" disabled={busy||!w.archiveRequestId||!["owner","admin"].includes(w.role)}
                className="rounded-lg border px-3 py-2 text-xs disabled:opacity-35"
                onClick={()=>{
                  if(restoreConfirm===w.id){
                    void change(()=>controlTowerApi.restoreClientWorkspace(w.id,w.archiveRequestId!),()=>{
                      setRestoreConfirm(null);setNotice("Client restored.");});
                  }else setRestoreConfirm(w.id);
                }}>{restoreConfirm===w.id?"Confirm restore":"Restore"}</button>
            </div>)}
          <strong className="mt-4 block text-xs">Archive a client</strong>
          {archiveStage==="idle"? verifiedWorkspaces.filter(w=>w.status==="active" &&
            !protectedSlugs.has(w.slug) && ["owner","admin"].includes(w.role))
            .map(w=><button key={w.id} type="button" onClick={()=>beginArchive(w)}
              className="mt-1 block min-h-10 w-full rounded-lg border px-3 text-left text-xs hover:bg-black/[0.03]">
              Archive {w.name}
            </button>):<div className="mt-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold">{candidate?.name}</p>
              <p className="text-xs text-amber-950">
                {archiveStage==="review"?"Confirmation 1/3: review this company and its open work.":
                 archiveStage==="acknowledged"?"Confirmation 2/3: acknowledge impact. Existing data is retained.":
                 archiveStage==="typed"?"Confirmation 3/3: type the exact company name to proceed.":
                 "Final action: archive this company for at least 30 days with restoration available."}
              </p>
              {archiveStage==="typed"&&<input type="text" value={typedName}
                onChange={e=>setTypedName(e.target.value)} placeholder={candidate?.name}
                aria-label="Type exact client name" className="h-11 w-full rounded-lg border px-3 text-sm"/>}
              <div className="flex gap-2">
                <button type="button" onClick={()=>{setArchiveStage("idle");setCandidate(null);}}
                  className="min-h-10 flex-1 rounded-lg border px-3 text-xs">Close</button>
                <button type="button" disabled={busy||(archiveStage==="typed"&&typedName!==candidate?.name)}
                  onClick={()=>void advanceArchive()}
                  className="min-h-10 flex-1 rounded-lg bg-[#24241f] px-3 text-xs font-semibold text-white disabled:opacity-35">
                  {busy?"Verifying…":archiveStage==="final"?"Archive client":"Continue"}
                </button>
              </div>
            </div>}
          <p className="mt-3 flex gap-2 text-xs text-black/60"><ShieldCheck size={16} className="shrink-0"/>
            No permanent deletion. The server requires staged confirmations and preserves a minimum 30-day recovery window.</p>
        </div>
        {notice&&<p role="status" className="rounded-lg bg-[#eef1eb] p-3 text-xs">{notice}</p>}
        <p className="flex items-center gap-2 text-xs text-black/45"><CircleHelp size={14}/>
          Changes require Google sign-in, an authorized owner role and a healthy MAXX server.</p>
      </div>}
    </div>}
  </div>;
}
