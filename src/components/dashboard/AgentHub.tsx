import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightCircle, Brain, Database, Globe2, Layers, Workflow } from "lucide-react";

const agents = [
  {
    title: "Customer Concierge",
    description: "Multilingual support agent powered by Coze conversational flows and RAG tuned for MACS product docs.",
    icon: <Globe2 className="h-5 w-5 text-sky-300" aria-hidden="true" />, 
    responsibilities: ["Omnichannel chat", "Upsell routing", "Session transcripts"],
    status: "Ready",
    latency: "220ms avg",
  },
  {
    title: "Research Analyst",
    description: "Aggregates industry intel by chaining Coze workflows with Maxx data crawlers and summarization prompts.",
    icon: <Brain className="h-5 w-5 text-emerald-300" aria-hidden="true" />, 
    responsibilities: ["Market scans", "Opportunity scoring", "Alert digests"],
    status: "Ready",
    latency: "340ms avg",
  },
  {
    title: "Workflow Orchestrator",
    description: "Automates internal approvals by calling Studio plugins, Slack webhooks, and contract generators.",
    icon: <Workflow className="h-5 w-5 text-purple-300" aria-hidden="true" />, 
    responsibilities: ["Task routing", "Escalations", "Audit logging"],
    status: "Ready",
    latency: "410ms avg",
  },
  {
    title: "Data Steward",
    description: "Maintains synced knowledge bases, vector indexes, and dataset rollbacks leveraging the Coze storage layer.",
    icon: <Database className="h-5 w-5 text-amber-300" aria-hidden="true" />, 
    responsibilities: ["ETL refresh", "Schema drift alerts", "Dataset QA"],
    status: "Ready",
    latency: "275ms avg",
  },
  {
    title: "Launch Director",
    description: "Preflight checker validating prompts, testing tool calls, and bundling release notes across environments.",
    icon: <Layers className="h-5 w-5 text-rose-300" aria-hidden="true" />, 
    responsibilities: ["Sandbox mirroring", "Regression suites", "Deployment locks"],
    status: "Ready",
    latency: "365ms avg",
  },
];

const AgentHub = () => {
  return (
    <section id="agent-hub" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Agent command hub</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Every agent imported from Maxx Coze Studio is validated, versioned, and staged for go-live. Use the cards below to
          inspect core responsibilities, latency guarantees, and certification state before handing them production traffic.
        </p>
      </div>
      <motion.div
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.08 }}
      >
        {agents.map((agent) => (
          <motion.div
            key={agent.title}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          >
            <Card className="h-full border-white/10 bg-white/5 backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">{agent.icon}</span>
                  <div>
                    <CardTitle className="text-lg text-white">{agent.title}</CardTitle>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">{agent.status}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{agent.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {agent.responsibilities.map((item) => (
                    <Badge key={item} variant="outline" className="border-white/20 bg-white/5 text-xs text-white">
                      {item}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                  <span>Latency budget</span>
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <ArrowRightCircle className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    {agent.latency}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Certification pipelines pull from the repository's CI workflows. Any change to prompts, tools, or connectors
                  triggers automated validation before promoting to this dashboard.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default AgentHub;
