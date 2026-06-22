import React from 'react';
import { Bot, LayoutDashboard, LogOut, Menu, Settings, Target, Wand2 } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Today", active: true },
  { icon: <Target size={20} />, label: "Leads" },
  { icon: <Wand2 size={20} />, label: "Content" },
  { icon: <Bot size={20} />, label: "MAXX Skills" },
  { icon: <Settings size={20} />, label: "Settings" },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-maxx-secondary text-white font-sans lg:flex">
      <aside className="hidden fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-gray-800 bg-maxx-bg lg:flex">
        <DashboardBrand />
        <DashboardNav />
        <DashboardDisconnect />
      </aside>

      <div className="min-h-screen flex-1 px-4 py-5 sm:px-6 lg:ml-64 lg:p-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MobileDashboardNav />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Stacy Control Room</p>
              <h1 className="mt-1 text-2xl font-bold uppercase leading-tight tracking-wide">Run Agent MAXX</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-maxx-cyan bg-maxx-cyan/10 px-3 py-1 text-xs font-mono uppercase text-maxx-cyan">
              MAXX Online
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-maxx-cyan bg-gray-700">
              <img src="/MUSTANG MAXX/006/ChatGPT Image Jun 19, 2025, 01_06_02 PM.png" alt="Stacy profile" />
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${active ? 'bg-maxx-cyan/10 text-maxx-cyan border border-maxx-cyan/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const DashboardBrand = () => (
  <div className="border-b border-gray-800 p-6">
    <div className="text-xl font-black tracking-tighter text-white">MAXX<span className="text-maxx-cyan">.AI</span></div>
    <div className="mt-1 text-xs tracking-widest text-gray-500">STACY OPERATOR ACCESS</div>
  </div>
);

const DashboardNav = () => (
  <nav className="flex-1 space-y-2 p-4">
    {navItems.map((item) => (
      <NavItem key={item.label} {...item} />
    ))}
  </nav>
);

const DashboardDisconnect = () => (
  <div className="border-t border-gray-800 p-4">
    <button className="flex w-full items-center gap-3 text-gray-400 transition-colors hover:text-white">
      <LogOut size={18} />
      <span className="text-sm">Sign Out</span>
    </button>
  </div>
);

const MobileDashboardNav = () => (
  <Sheet>
    <SheetTrigger className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:border-maxx-cyan hover:text-maxx-cyan lg:hidden">
      <Menu size={20} />
      <span className="sr-only">Open Stacy dashboard navigation</span>
    </SheetTrigger>
    <SheetContent side="left" className="w-[84vw] border-gray-800 bg-maxx-bg p-0 text-white">
      <SheetHeader className="border-b border-gray-800 p-6 text-left">
        <SheetTitle className="text-xl font-black tracking-tight text-white">MAXX<span className="text-maxx-cyan">.AI</span></SheetTitle>
        <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Stacy operator access</p>
      </SheetHeader>
      <nav className="space-y-2 p-4">
        {navItems.map((item) => (
          <SheetClose asChild key={item.label}>
            <NavItem {...item} />
          </SheetClose>
        ))}
      </nav>
      <div className="absolute inset-x-0 bottom-0 border-t border-gray-800 p-4">
        <DashboardDisconnect />
      </div>
    </SheetContent>
  </Sheet>
);
