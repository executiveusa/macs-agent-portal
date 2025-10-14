import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock3, GitBranch } from "lucide-react";

const steps = [
  {
    title: "Repository sync",
    description: "Fetch latest commits from maxx-coze-studio and align agent manifests.",
    status: "Complete",
    progress: 100,
    icon: <GitBranch className="h-5 w-5 text-emerald-300" aria-hidden="true" />, 
  },
  {
    title: "Validation suite",
    description: "Run prompt linting, tool-call simulations, and dataset checksum comparisons.",
    status: "Complete",
    progress: 100,
    icon: <CheckCircle2 className="h-5 w-5 text-sky-300" aria-hidden="true" />, 
  },
  {
    title: "Launch readiness",
    description: "Ops sign-off collected. Dynamic throttling configured across all agents.",
    status: "In progress",
    progress: 70,
    icon: <Activity className="h-5 w-5 text-amber-300" aria-hidden="true" />, 
  },
  {
    title: "Post-launch monitoring",
    description: "Realtime dashboards and log streams pre-provisioned, ready to activate once traffic flows.",
    status: "Queued",
    progress: 35,
    icon: <Clock3 className="h-5 w-5 text-purple-300" aria-hidden="true" />, 
  },
];

const OperationsCenter = () => {
  return (
    <section id="operations" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Operations center</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Observe every phase from repository sync to production monitoring. The control loop is wired into GitHub workflows and
          Maxx Coze Studio deployment hooks so you always know what's next.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {steps.map((step) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="h-full border-white/10 bg-white/5 backdrop-blur">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">{step.icon}</span>
                  <div>
                    <CardTitle className="text-lg text-white">{step.title}</CardTitle>
                    <Badge className="mt-1 bg-emerald-500/20 text-emerald-100">{step.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{step.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={step.progress} className="h-2 bg-slate-900/60" />
                <p className="text-xs text-slate-400">
                  Automation delivered by GitHub Actions mirrored from the Studio repo. Adjust thresholds inside the portal to
                  tailor alerts for your team.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default OperationsCenter;
