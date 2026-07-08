import type { ReactNode } from "react";
import {
  Activity,
  Bot,
  BriefcaseBusiness,
  Command,
  Gauge,
  KanbanSquare,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const recoveryNav = [
  { path: "/dashboard/command", label: "Command", icon: Command },
  { path: "/dashboard/live", label: "Live", icon: Activity },
  { path: "/dashboard/missions", label: "Missions", icon: KanbanSquare },
  { path: "/dashboard/crm", label: "CRM", icon: BriefcaseBusiness },
];

const intelligenceNav = [
  { path: "/dashboard/approvals", label: "Approvals", icon: ShieldCheck },
  { path: "/dashboard/skills", label: "Skills", icon: Sparkles },
  { path: "/dashboard/usage", label: "Usage", icon: Gauge },
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
];

function TowerNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === "/dashboard" && path.endsWith("/command")
      ? true
      : location.pathname.startsWith(path);
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Recovery</SidebarGroupLabel>
        <SidebarMenu>
          {recoveryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="py-2.5 px-3 h-auto data-[active=true]:bg-maxx-cyan/15 data-[active=true]:border-l-2 data-[active=true]:border-maxx-cyan data-[active=true]:text-white data-[active=true]:font-medium"
                >
                  <Link to={item.path}>
                    <Icon size={17} strokeWidth={active ? 2.25 : 1.8} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
        <SidebarMenu>
          {intelligenceNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="py-2.5 px-3 h-auto data-[active=true]:bg-maxx-cyan/15 data-[active=true]:border-l-2 data-[active=true]:border-maxx-cyan data-[active=true]:text-white data-[active=true]:font-medium"
                >
                  <Link to={item.path}>
                    <Icon size={17} strokeWidth={active ? 2.25 : 1.8} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg">
        <Bot size={18} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/50">Private system</p>
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-sidebar-foreground">MAXX Control Tower</p>
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
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground w-full flex">
        <Sidebar collapsible="offcanvas" variant="sidebar">
          <SidebarHeader>
            <Brand />
          </SidebarHeader>
          <SidebarContent>
            <TowerNav />
          </SidebarContent>
          <SidebarFooter>
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
                  }`}
                />
                MAXX {status}
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-sidebar-foreground/60">{currentIntent}</p>
              {devBypass && <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-600">Local auth bypass</p>}
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="min-h-screen flex-1 flex flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-2xl sm:px-7 lg:px-9">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground/50">Stacy operator access</p>
                <p className="max-w-[55vw] truncate text-sm font-medium text-foreground/70">{currentIntent}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
                }`}
              />
              {status === "online" ? "Systems ready" : status === "degraded" ? "Setup needed" : "Offline"}
            </div>
          </header>
          <div
            className="flex-1 mx-auto w-full max-w-[1500px] p-4 sm:p-7 lg:p-9"
            style={{
              backgroundImage: "linear-gradient(180deg, hsl(222 47% 6.5%) 0%, hsl(var(--background)) 28%)",
              paddingTop: "1.5rem",
              paddingBottom: "1.5rem",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
