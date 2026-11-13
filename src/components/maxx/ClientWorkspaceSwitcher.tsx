import { useState } from "react";
import { Bell, ChevronDown, CircleHelp, Plus, ShieldCheck, X } from "lucide-react";
import { MAXX_CLIENT_CATALOG, catalogItem, type ClientSlug } from "@/lib/maxx-client-workspaces";
import type { AuthorizedWorkspace } from "@/services/controlTowerApi";

type Props = {
  selectedSlug: ClientSlug | null;
  onSelect: (slug: ClientSlug | null) => void;
  verifiedWorkspaces: readonly AuthorizedWorkspace[];
  connectionState: "loading" | "verified" | "unavailable";
};

export function ClientWorkspaceSwitcher({selectedSlug, onSelect, verifiedWorkspaces, connectionState}: Props) {
  const [open,setOpen] = useState(false);
  const [view,setView] = useState<"switch" | "manage" | "alerts">("switch");
  const selected = selectedSlug ? catalogItem(selectedSlug) : null;
  const approvedSlugs = new Set(verifiedWorkspaces.map(item => item.slug));
  // No fabricated approval counts. The canonical approvals join is a later
  // source-verified module; an unknown value never maps to a green badge.
  const alertUnknown = verifiedWorkspaces.some(item => item.pendingApprovalCount === null);
  return (
    <div className="relative min-w-0">
      <button type="button" onClick={() => {setOpen(!open);setView("switch");}}
        className="flex h-10 max-w-[48vw] items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-xs font-semibold text-black/70 hover:border-black/20 sm:max-w-[280px]"
        aria-haspopup="dialog" aria-expanded={open} aria-label="Switch client workspace">
        <span className="truncate">{selected?.name ?? "General MAXX"}</span><ChevronDown size={14}/>
      </button>
      {open && <div role="dialog" aria-label="Client workspaces"
        className="absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-28px))] max-h-[min(75dvh,620px)] overflow-y-auto rounded-2xl border border-black/10 bg-[#fffefa] p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#24241f]">Stacy's client workspaces</p>
          <button onClick={() => setOpen(false)} aria-label="Close client menu" className="rounded-full p-2 hover:bg-black/5"><X size={16}/></button>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/[0.04] p-1 text-xs">
          {(["switch","alerts","manage"] as const).map(tab => (
            <button type="button" key={tab} onClick={() => setView(tab)}
              className={`rounded-md px-2 py-2 capitalize ${view===tab?"bg-white font-semibold shadow-sm":"text-black/55"}`}>{tab}</button>
          ))}
        </div>
        {view === "switch" && <div className="mt-3 space-y-1">
          <button onClick={() => {onSelect(null);setOpen(false);}}
            className={`w-full rounded-xl px-3 py-3 text-left text-sm ${selectedSlug===null?"bg-[#e9eee7] font-semibold":"hover:bg-black/[0.03]"}`}>
            General MAXX <span className="block text-xs font-normal text-black/45">No client-specific tools or records</span>
          </button>
          {MAXX_CLIENT_CATALOG.map(item => {
            const authorized = approvedSlugs.has(item.slug);
            return <button key={item.slug} type="button" onClick={() => {onSelect(item.slug);setOpen(false);}}
              className={`w-full rounded-xl px-3 py-3 text-left text-sm ${item.slug === selectedSlug?"bg-[#e9eee7] font-semibold":"hover:bg-black/[0.03]"}`}>
              <span className="flex items-center justify-between gap-2">
                <span>{item.name}</span>
                <span className={`text-[10px] font-medium ${authorized?"text-emerald-700":"text-amber-700"}`}>
                  {authorized?"Authorized":"Setup needed"}
                </span>
              </span>
            </button>;
          })}
          <p className="pt-2 text-xs text-black/45">Company names are preloaded. Records and actions require verified account and client membership.</p>
        </div>}
        {view === "alerts" && <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2"><Bell size={16}/><strong>Needs attention</strong></div>
          <p className="text-black/60">
            {connectionState !== "verified" ? "Approval status unavailable until MAXX verifies your client permissions." :
             alertUnknown ? "Client permissions verified. Project-specific approval counts are not connected yet." :
             "No project approval records were returned."}
          </p>
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Instinct notification dispatch remains disabled until the authenticated FastAPI bridge and delivery receipts are tested.</p>
        </div>}
        {view === "manage" && <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2"><Plus size={16}/><strong>Add a client</strong></div>
          <p className="text-black/60">New workspaces require an authorized server-side request and project membership assignment. This preview does not write to shared Supabase.</p>
          <div className="flex items-start gap-2 rounded-xl bg-[#eef1eb] p-3 text-xs text-black/60"><ShieldCheck className="mt-0.5 shrink-0" size={16}/>Removing a client requires three verified confirmations, a 30-day recoverable archive and an audit trail. No hard-delete UI is enabled.</div>
          <p className="flex items-center gap-2 text-xs text-black/50"><CircleHelp size={14}/>The archive and restore controls unlock after the reviewed database migration and owner-access tests.</p>
        </div>}
      </div>}
    </div>
  );
}
