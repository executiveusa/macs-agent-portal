import React from 'react';
import { LayoutDashboard, Users, Workflow, CreditCard, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-maxx-secondary text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-maxx-bg border-r border-gray-800 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-800">
          <div className="text-xl font-black tracking-tighter text-white">MAXX<span className="text-maxx-cyan">.AI</span></div>
          <div className="text-xs text-gray-500 tracking-widest mt-1">AGENCY PROTOCOL v2.0</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Command Center" active />
          <NavItem icon={<Users size={20} />} label="Avatar Factory" />
          <NavItem icon={<Workflow size={20} />} label="Pipelines" />
          <NavItem icon={<CreditCard size={20} />} label="Treasury" />
          <div className="pt-8 text-xs text-gray-600 font-bold px-4 uppercase">System</div>
          <NavItem icon={<Settings size={20} />} label="Configuration" />
        </nav>

        <div className="p-4 border-t border-gray-800">
           <button className="flex items-center gap-3 w-full text-gray-400 hover:text-white transition-colors">
             <LogOut size={18} />
             <span className="text-sm">Disconnect Link</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold uppercase tracking-wide">Command Center</h1>
           <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-maxx-cyan/10 border border-maxx-cyan text-maxx-cyan text-xs rounded-full font-mono animate-pulse">
               NETWORK STATUS: ONLINE
             </div>
             <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-maxx-cyan">
               <img src="/MUSTANG MAXX/006/ChatGPT Image Jun 19, 2025, 01_06_02 PM.png" alt="User" />
             </div>
           </div>
        </header>

        {children}
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active }: { icon: any, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-maxx-cyan/10 text-maxx-cyan border border-maxx-cyan/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);
