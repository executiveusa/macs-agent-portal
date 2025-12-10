import React from 'react';

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-maxx-bg text-white overflow-x-hidden selection:bg-maxx-cyan selection:text-black">
      <div className="noise-overlay fixed inset-0 z-50 pointer-events-none mix-blend-overlay opacity-30"></div>
      
      {/* Global Navigation (simplified for now) */}
      <nav className="fixed top-0 left-0 w-full z-40 p-6 flex justify-between items-center mix-blend-difference text-white">
        <div className="font-bold text-xl tracking-tighter">MAXX-POST</div>
        <div className="space-x-4 hidden md:block">
          <a href="#hero" className="hover:text-maxx-cyan transition-colors">INTEL</a>
          <a href="#car" className="hover:text-maxx-cyan transition-colors">ASSET</a>
          <a href="#mission" className="hover:text-maxx-cyan transition-colors">MISSION</a>
          <button className="px-4 py-2 border border-maxx-cyan text-maxx-cyan hover:bg-maxx-cyan hover:text-black transition-all uppercase text-sm tracking-widest">
            Login
          </button>
        </div>
      </nav>

      <main>
        {children}
      </main>

      <footer className="py-12 bg-maxx-secondary text-center text-gray-500 text-xs">
        <p>MACS DIGITAL MEDIA © 2025. AGENT 006. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
};
