import { useEffect, useState } from "react";
import {
  Brain, ChevronRight, CircleHelp, Database, History,
  LockKeyhole, Mic, Monitor, Settings, ShieldCheck, SlidersHorizontal,
  Users, Plug, MessageCircle, LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";

type Category = "general" | "voice" | "permissions" | "connections" | "team" | "proof";
const categories: ReadonlyArray<{ id: Category; title: string; hint: string; icon: typeof Settings }> = [
  { id: "general", title: "General", hint: "Appearance and comfort", icon: SlidersHorizontal },
  { id: "voice", title: "Voice & listening", hint: "How you talk with MAXX", icon: Mic },
  { id: "permissions", title: "Approvals & safety", hint: "Actions requiring consent", icon: ShieldCheck },
  { id: "connections", title: "Connections", hint: "Services and data access", icon: Plug },
  { id: "team", title: "People & agents", hint: "Team and Instinct access", icon: Users },
  { id: "proof", title: "Data & proof", hint: "Results and sources", icon: Database },
];
type Preferences = { largeText: boolean; reduceMotion: boolean; spokenReplies: boolean };
const defaults: Preferences = { largeText: false, reduceMotion: false, spokenReplies: false };
const prefsStoragePrefix = "maxx-ui-preferences-v1:";

export function MaxxSettingsDrawer({
  open, onOpenChange, onOpenHistory,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; onOpenHistory: () => void;
}) {
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const [active, setActive] = useState<Category | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Cosmetic preferences only. No authority, credentials, tenant selection, or
  // approval configuration is ever sourced from browser storage.
  useEffect(() => {
    if (!userId) {
      setPrefs(defaults);
      setLoadedFor(null);
      return;
    }
    try {
      const raw = window.localStorage.getItem(prefsStoragePrefix + userId);
      const value: unknown = raw ? JSON.parse(raw) : null;
      if (value && typeof value === "object") {
        const p = value as Partial<Preferences>;
        setPrefs({
          largeText: p.largeText === true,
          reduceMotion: p.reduceMotion === true,
          spokenReplies: p.spokenReplies === true,
        });
      } else setPrefs(defaults);
    } catch {
      setPrefs(defaults);
    }
    setLoadedFor(userId);
  }, [userId]);

  const changePreference = (key: keyof Preferences, value: boolean) => {
    if (!userId || loadedFor !== userId) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { window.localStorage.setItem(prefsStoragePrefix + userId, JSON.stringify(next)); } catch {
      // Storage may be unavailable; the in-session preference still works.
    }
  };

  const preferenceRow = (title: string, description: string, key: keyof Preferences) => (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-black/[0.07] py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-black/50">{description}</p>
      </div>
      <Switch
        aria-label={title}
        className="data-[state=checked]:bg-[#536458] data-[state=unchecked]:bg-black/20"
        checked={prefs[key]} disabled={!userId || loadedFor !== userId}
        onCheckedChange={(checked) => changePreference(key,checked)}
      />
    </div>
  );

  return <Sheet open={open} onOpenChange={(value) => {onOpenChange(value); if (!value) setActive(null);}}>
    <SheetContent
      side="left"
      className="!w-[min(390px,100vw)] !max-w-none overflow-y-auto border-r border-black/10 bg-[#fffefa] px-4 pb-8 pt-5 text-[#20201d] shadow-2xl sm:px-6"
      aria-label="MAXX navigation and settings"
    >
      <header className="pr-10">
        <p className="text-lg font-bold tracking-[-0.04em]">MAXX</p>
        <SheetTitle className="mt-2 text-xl font-semibold text-[#20201d]">
          {active ? categories.find((c)=>c.id===active)?.title : "Your space"}
        </SheetTitle>
        <SheetDescription className="mt-1 text-xs leading-5 text-black/55">
          {active ? "Change only what you need. MAXX handles the rest." :
            "Conversation first. Your tools are here when needed."}
        </SheetDescription>
      </header>
      <div className="mt-5 rounded-2xl border border-black/[0.07] bg-[#f5f3ed] px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dce4d9] text-[#304936]">
            <Users size={17}/>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "MAXX operator"}
            </p>
            <p className="truncate text-xs text-black/50">{session?.user.email || "Not signed in"}</p>
          </div>
          <LockKeyhole size={15} className="text-black/40"/>
        </div>
      </div>

      {!active ? <>
        <nav aria-label="MAXX navigation" className="mt-5 space-y-1">
          <button type="button" onClick={()=>onOpenChange(false)}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-black/[0.04]">
            <MessageCircle size={17}/> Back to chat
          </button>
          <button type="button" onClick={()=>{onOpenChange(false);onOpenHistory();}}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-black/[0.04]">
            <History size={17}/> Recent work
          </button>
        </nav>
        <div className="mt-5 border-t border-black/10 pt-4">
          <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-black/45">Settings</h3>
          <div className="mt-2 space-y-1">
            {categories.map(({id,title,hint,icon:Icon})=>
              <button type="button" key={id} onClick={()=>setActive(id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-black/[0.04]">
                <Icon size={18} className="shrink-0 text-[#536458]"/>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-black/45">{hint}</span>
                </span>
                <ChevronRight size={16} className="text-black/35"/>
              </button>
            )}
          </div>
        </div>
        <div className="mt-5 border-t border-black/10 pt-4">
          <Link to="/control/settings" onClick={()=>onOpenChange(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-black/[0.04]">
            <Brain size={17}/> Second Brain imports <ChevronRight className="ml-auto" size={16}/>
          </Link>
          <Link to="/control/command" onClick={()=>onOpenChange(false)}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm hover:bg-black/[0.04]">
            <Monitor size={17}/> Advanced dashboard <ChevronRight className="ml-auto" size={16}/>
          </Link>
        </div>
        <button type="button" onClick={()=>{onOpenChange(false);void signOut();}}
          className="mt-4 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-800 hover:bg-red-50">
          <LogOut size={17}/> Sign out
        </button>
      </> : <div className="mt-5 space-y-4">
        <button type="button" onClick={()=>setActive(null)}
          className="min-h-10 rounded-xl px-3 text-xs font-semibold text-[#536458] hover:bg-[#eef1eb]">
          ← All settings
        </button>
        {active==="general" && <div>
          {preferenceRow("Larger text","Saved for your browser; does not alter teammates' accounts.","largeText")}
          {preferenceRow("Reduce motion","Saved preference; system accessibility settings still take precedence.","reduceMotion")}
          <p className="mt-4 rounded-xl bg-[#f4f2ed] p-3 text-xs text-black/60">
            These preferences are stored only in this browser. System-wide changes are not yet connected.
          </p>
        </div>}
        {active==="voice" && <div>
          {preferenceRow("Prefer spoken replies","Saved preference only; automatic playback is not yet connected to this setting.","spokenReplies")}
          <div className="mt-4 rounded-xl bg-[#f4f2ed] p-4 text-xs leading-5 text-black/65">
            <Mic size={18} className="mb-2 text-[#536458]"/>
            Voice input uses the existing chat microphone. Always-on listening and reliable background voice are not yet enabled.
          </div>
        </div>}
        {active==="permissions" && <div className="space-y-3">
          <div className="rounded-xl bg-[#eaf0e7] p-4 text-sm">
            <ShieldCheck size={18} className="mb-2 text-[#536458]"/>
            <strong>Human approval stays required</strong>
            <p className="mt-2 text-xs leading-5 text-black/60">
              Spending, publishing, deleting records, sending customer messages and changing security settings cannot be enabled by a local toggle.
            </p>
          </div>
          <p className="text-xs leading-5 text-black/55">Permissions are enforced by the MAXX control plane and verified client memberships, not this drawer.</p>
        </div>}
        {active==="connections" && <div className="space-y-2">
          {["Supabase account","MAXX control plane","Square / POS","Google / Meta accounts","Stacy’s Instinct agent"].map((label)=>
            <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 p-3">
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[11px] text-black/45">Verify in control plane</span>
            </div>
          )}
          <p className="text-xs leading-5 text-black/55">This list is a reference, not a live provider-connection report. Tokens and access stay server-side.</p>
        </div>}
        {active==="team" && <div className="space-y-3 text-sm">
          <p className="rounded-xl bg-[#f4f2ed] p-4 text-xs leading-5 text-black/65">
            Your Google account identifies you. Client membership, roles, and external agent scopes come from the MAXX server.
          </p>
          <p className="text-xs text-black/55">Use the company switcher in chat to view verified clients, approvals and permitted management controls.</p>
          <button type="button" onClick={()=>onOpenChange(false)}
            className="min-h-11 rounded-xl bg-[#24241f] px-4 text-xs font-semibold text-white">Return to client switcher</button>
        </div>}
        {active==="proof" && <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-black/10 p-4">
            <p className="font-semibold">How MAXX labels evidence</p>
            <p className="mt-2 text-xs leading-6 text-black/60">
              Verified — reconciled source record. Attributed — matched to a campaign, not necessarily incremental.
              Estimated — calculated with stated assumptions. Unknown — source evidence not available.
            </p>
          </div>
          <p className="text-xs text-black/55">Inspect source receipts through the authorized mission result. No demo revenue is shown as a live outcome.</p>
        </div>}
        <div className="flex items-start gap-2 rounded-xl border border-black/10 p-3 text-xs leading-5 text-black/50">
          <CircleHelp size={16} className="mt-0.5 shrink-0"/> Advanced options remain accessible, never mandatory for a normal chat request.
        </div>
      </div>}
    </SheetContent>
  </Sheet>;
}
