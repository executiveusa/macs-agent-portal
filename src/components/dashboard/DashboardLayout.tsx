import type { ReactNode } from "react";
import {
  Activity,
  Bot,
  BriefcaseBusiness,
  Command,
  Gauge,
  KanbanSquare,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { path: "/dashboard/command", label: "Command", icon: Command },
  { path: "/dashboard/live", label: "Live", icon: Activity },
  { path: "/dashboard/missions", label: "Missions", icon: KanbanSquare },
  { path: "/dashboard/crm", label: "CRM", icon: BriefcaseBusiness },
  { path: "/dashboard/approvals", label: "Approvals", icon: ShieldCheck },
  { path: "/dashboard/skills", label: "Skills", icon: Sparkles },
  { path: "/dashboard/usage", label: "Usage", icon: Gauge },
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
];

function TowerNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="space-y-1.5">
      {navigation.map((item) => {
        const active =
          location.pathname === "/dashboard" && item.path.endsWith("/command")
            ? true
            : location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
                : "text-black/55 hover:bg-black/[0.055] hover:text-black"
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2.25 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-lg">
        <Bot size={18} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35">Private system</p>
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">MAXX Control Tower</p>
      </div>
    </div>
  );
}

export function DashboardLayout({
  children,
  status,
  currentIntent,
}: {
  children: ReactNode;
  status: "online" | "degraded" | "offline";
  currentIntent: string;
}) {
  const { signOut, devBypass } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-[#1d1d1f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-black/[0.07] bg-[#f9f9f7]/95 px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col">
        <Brand />
        <div className="mt-9 flex-1">
          <TowerNav />
        </div>
        <div className="rounded-2xl border border-black/[0.07] bg-white/70 p-3.5">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
              }`}
            />
            MAXX {status}
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/45">{currentIntent}</p>
          {devBypass && <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-700">Local auth bypass</p>}
        </div>
        <button
          onClick={() => signOut()}
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-black/45 transition hover:bg-black/5 hover:text-black"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </aside>

      <main className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-black/[0.06] bg-[#f4f4f2]/85 px-4 backdrop-blur-2xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white lg:hidden">
                <Menu size={18} />
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-black/10 bg-[#f9f9f7] p-5">
                <Brand />
                <div className="mt-9">
                  <TowerNav />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/35">Stacy operator access</p>
              <p className="max-w-[55vw] truncate text-sm font-medium text-black/70">{currentIntent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5 text-xs font-medium shadow-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
              }`}
            />
            {status === "online" ? "Systems ready" : status === "degraded" ? "Setup needed" : "Offline"}
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">{children}</div>
      </main>
    </div>
  );
}
