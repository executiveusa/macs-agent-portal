import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import MaxxChat from "@/pages/MaxxChat";

export function StacyDashboardShell() {
  return (
    <div className="relative">
      <MaxxChat />
      <Link
        to="/dashboard/pups"
        className="fixed bottom-20 left-4 z-40 flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-[#fffefa]/95 px-4 text-sm font-semibold text-[#2d352f] shadow-[0_12px_32px_rgba(31,28,23,0.12)] backdrop-blur-md transition hover:-translate-y-0.5 sm:bottom-6 sm:left-6"
        aria-label="Open MAXX Pups"
      >
        <Bot size={16} />
        Pups
      </Link>
    </div>
  );
}
