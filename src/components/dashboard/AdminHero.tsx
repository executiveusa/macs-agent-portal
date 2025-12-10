import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, PlugZap, ShieldCheck, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusCards = [
  {
    title: "Agent Mesh Online",
    description: "Orchestrated from Maxx Coze Studio with real-time health checks and auto-repair routines enabled.",
    icon: <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />, 
  },
  {
    title: "Functions Synchronized",
    description: "Prompts, workflows, plugins, and RAG datasets imported from the Studio repository and mapped to portal roles.",
    icon: <PlugZap className="h-5 w-5 text-sky-300" aria-hidden="true" />, 
  },
  {
    title: "Enterprise Guard Rails",
    description: "Role-based guard rails, audit trails, and dataset privacy inherited from the open-source Coze engine.",
    icon: <Sparkle className="h-5 w-5 text-purple-300" aria-hidden="true" />, 
  },
];

const AdminHero = () => {
  return (
    <motion.section
      id="hero"
      className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-8 py-16 shadow-2xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 grid gap-10 lg:grid-cols-[2fr,1fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="outline" className="border-emerald-400/60 bg-emerald-500/10 text-emerald-200">
            Maxx Coze Studio Integration
          </Badge>
          <motion.h1
            className="text-4xl font-bold tracking-tight text-white md:text-5xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Build, supervise, and deploy AI agents from a single interactive cockpit.
          </motion.h1>
          <motion.p
            className="max-w-xl text-lg text-slate-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            Your MACS admin dashboard now mirrors the capabilities of the open-source Maxx Coze Studio project. Every agent,
            workflow, and plugin syncs into a curated control surface so ops teams can launch, monitor, and iterate in minutes.
          </motion.p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-emerald-500/80 text-slate-950 hover:bg-emerald-400">
              <a href="https://github.com/executiveusa/maxx-coze-studio" target="_blank" rel="noreferrer">
                Review linked repository <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <a href="#help" className="inline-flex items-center">
                Explore help center <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {statusCards.map((card) => (
              <motion.div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-3 text-sm font-medium text-emerald-100">
                  {card.icon}
                  {card.title}
                </div>
                <p className="mt-3 text-xs text-slate-300">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          className="relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="absolute inset-x-6 -top-6 flex justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>Studio Snapshot</span>
            <span>v1.0</span>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div>
                <p className="text-sm text-slate-400">Agents deployed</p>
                <p className="text-3xl font-semibold text-white">12</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-100">Stable</Badge>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
                <span>Live workflows</span>
                <span className="font-semibold text-white">24</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
                <span>Connected plugins</span>
                <span className="font-semibold text-white">18</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
                <span>Knowledge bases</span>
                <span className="font-semibold text-white">32</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Stats sourced from the latest repository sync. Modify agents inside Maxx Coze Studio and push updates to refresh
              these metrics instantly.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default AdminHero;
