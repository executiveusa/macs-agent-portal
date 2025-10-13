import { motion } from "framer-motion";
import { TrendingUp, Gauge, ArrowLeftRight } from "lucide-react";

const metrics = [
  {
    title: "Buy-side demand",
    value: "312 buyers",
    change: "+28%",
    description: "Qualified Mustang hunters actively tracked inside the garage.",
    icon: TrendingUp,
  },
  {
    title: "Arbitrage spread",
    value: "$7,850 avg",
    change: "+$1,120",
    description: "Net profit potential once reconditioning and logistics are modeled in.",
    icon: ArrowLeftRight,
  },
  {
    title: "Agent velocity",
    value: "11h turnaround",
    change: "-4h",
    description: "Time from Firecrawl scrape to matched buyer introduction with Mustang Max.",
    icon: Gauge,
  },
];

const variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const MustangInsights = () => (
  <motion.section
    id="insights"
    className="rounded-3xl border border-primary/20 bg-slate-950/70 p-8 text-slate-100 shadow-2xl"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    transition={{ staggerChildren: 0.08 }}
  >
    <motion.div variants={variants} className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Stable performance dashboard</h2>
        <p className="text-sm text-slate-400">
          Monitor the key signals Mustang Max uses to create irresistible matches between buyers and inventory.
        </p>
      </div>
      <motion.div
        className="hidden rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 md:inline-flex"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        Live telemetry
      </motion.div>
    </motion.div>

    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <motion.article
          key={metric.title}
          variants={variants}
          className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 backdrop-blur-sm"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/70 text-yellow-200">
            <metric.icon className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.title}</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-100">{metric.value}</span>
            <span className="text-sm font-semibold text-emerald-300">{metric.change}</span>
          </div>
          <p className="mt-3 text-sm text-slate-300">{metric.description}</p>
        </motion.article>
      ))}
    </div>
  </motion.section>
);

export default MustangInsights;
