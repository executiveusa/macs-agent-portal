import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Blocks, BookOpen, Compass, Sparkles } from "lucide-react";

const categories = [
  {
    id: "prompts",
    label: "Prompt kits",
    icon: <Sparkles className="h-4 w-4" aria-hidden="true" />, 
    description:
      "Reusable instruction packs shipped from the Maxx Coze Studio repo. Each kit ships with guard rails, tone presets, and regression prompts.",
    highlights: [
      "Persona pairs for concierge and analyst agents",
      "Tone adapters supporting sales, success, and compliance",
      "Regression prompts auto-run during every release",
    ],
  },
  {
    id: "rag",
    label: "Knowledge & RAG",
    icon: <BookOpen className="h-4 w-4" aria-hidden="true" />, 
    description:
      "Vector indexes managed by the Data Steward agent with automated refresh pipelines. Supports semantic, keyword, and hybrid retrieval modes.",
    highlights: [
      "32 curated knowledge bases synced nightly",
      "Chunking policies aligned with repository templates",
      "PII scrubbing routines executed before ingestion",
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: <Blocks className="h-4 w-4" aria-hidden="true" />, 
    description:
      "Visual automations built inside Maxx Coze Studio and imported through the portal's release pipeline. Connects to CRM, Slack, and HubSpot.",
    highlights: [
      "Approval ladders with timed escalations",
      "Dynamic routing based on CRM priority scores",
      "Observability baked in with step-level logging",
    ],
  },
  {
    id: "plugins",
    label: "Plugins",
    icon: <Compass className="h-4 w-4" aria-hidden="true" />, 
    description:
      "Secure plugin bridge featuring the Studio's official connectors plus MACS-exclusive integrations for analytics, billing, and CRM sync.",
    highlights: [
      "OAuth secrets stored in vault-backed config",
      "Usage quotas tracked per agent per connector",
      "Sandbox toggles for rapid staging tests",
    ],
  },
];

const FunctionShowcase = () => {
  return (
    <section id="functions" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Functions & resources</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          These modules were imported directly from the open-source repository so every agent in the MACS portal has instant
          access to Studio-grade tooling.
        </p>
      </div>
      <Tabs defaultValue="prompts" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent p-0">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-emerald-500/80 data-[state=active]:text-slate-950"
            >
              <span className="mr-2 text-emerald-100">{category.icon}</span>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="focus-visible:outline-none">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  <Badge className="bg-emerald-500/20 text-emerald-100">From Maxx Coze Studio</Badge>
                  <span className="text-slate-300">{category.label}</span>
                </div>
                <p className="max-w-3xl text-sm text-slate-200">{category.description}</p>
              </div>
              <Separator className="border-white/10" />
              <ul className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                {category.highlights.map((highlight) => (
                  <li key={highlight} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    {highlight}
                  </li>
                ))}
              </ul>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

export default FunctionShowcase;
