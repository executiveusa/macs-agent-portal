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
    <div className="flex items-center gap-xs xs:gap-2 sm:gap-3">
      <div className="flex h-7 xs:h-8 sm:h-9 w-7 xs:w-8 sm:w-9 items-center justify-center rounded-md xs:rounded-lg sm:rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg flex-shrink-0">
        <Bot size={16} className="xs:size-[18px] sm:size-[20px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] xs:tracking-[0.24em] sm:tracking-[0.28em] text-sidebar-foreground/50 truncate">Private system</p>
        <p className="text-[12px] xs:text-[13px] sm:text-[15px] font-semibold tracking-[-0.01em] xs:tracking-[-0.015em] sm:tracking-[-0.02em] text-sidebar-foreground truncate">MAXX Control Tower</p>
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
            <div className="rounded-lg xs:rounded-xl sm:rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-2 xs:p-2.5 sm:p-3.5">
              <div className="flex items-center gap-1.5 xs:gap-2 text-[10px] xs:text-[11px] sm:text-xs font-medium text-sidebar-foreground">
                <span
                  className={`h-1.5 xs:h-2 w-1.5 xs:w-2 rounded-full ${
                    status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
                  }`}
                />
                <span className="truncate">MAXX <span className="hidden xs:inline">{status}</span></span>
              </div>
              <p className="mt-1 xs:mt-1.5 sm:mt-2 line-clamp-2 text-[9px] xs:text-[10px] sm:text-xs leading-4 xs:leading-5 sm:leading-5 text-sidebar-foreground/60">{currentIntent}</p>
              {devBypass && <p className="mt-1 xs:mt-1.5 sm:mt-2 text-[8px] xs:text-[9px] uppercase tracking-wider text-amber-600">Local auth bypass</p>}
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 xs:gap-2 rounded-lg xs:rounded-lg sm:rounded-xl px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 sm:py-2 text-[10px] xs:text-[11px] sm:text-xs font-medium text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut size={14} className="xs:size-[15px] sm:size-[16px]" />
              <span className="hidden xs:inline">Sign out</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="min-h-screen flex-1 flex flex-col">
          <header className="sticky top-0 z-20 flex h-14 xs:h-16 items-center justify-between gap-2 xs:gap-3 border-b border-border bg-background/85 px-xs xs:px-sm sm:px-md lg:px-lg backdrop-blur-2xl">
            <div className="flex items-center gap-xs xs:gap-2 sm:gap-3 min-w-0 flex-1">
              <SidebarTrigger className="md:hidden h-9 w-9 xs:h-10 xs:w-10" />
              <div className="min-w-0 flex-1">
                <p className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] xs:tracking-[0.22em] sm:tracking-[0.24em] text-foreground/50 truncate">Stacy operator</p>
                <p className="text-xs sm:text-sm font-medium text-foreground/70 truncate">{currentIntent}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2 rounded-full border border-border bg-card/80 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 text-[8px] xs:text-[9px] sm:text-xs font-medium shadow-sm whitespace-nowrap">
              <span
                className={`h-1.5 xs:h-2 w-1.5 xs:w-2 rounded-full ${
                  status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
                }`}
              />
              <span className="hidden xs:inline">{status === "online" ? "Ready" : status === "degraded" ? "Setup" : "Offline"}</span>
            </div>
          </header>
          <div
            className="flex-1 mx-auto w-full px-xs xs:px-sm sm:px-md md:px-lg lg:px-xl py-xs xs:py-sm sm:py-md md:py-lg"
            style={{
              backgroundImage: "linear-gradient(180deg, hsl(222 47% 6.5%) 0%, hsl(var(--background)) 28%)",
              maxWidth: 'clamp(320px, 100%, 1536px)',
            }}
          >
            <div className="w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
