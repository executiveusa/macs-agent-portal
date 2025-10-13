import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface AgentConfiguration {
  buyerName: string;
  maxBudget: string;
  preferredGeneration: string;
  location: string;
  automationNotes: string;
  enableArbitrage: boolean;
  enableFirecrawl: boolean;
}

interface MustangAgentBuilderProps {
  onConfigure: (config: AgentConfiguration) => void;
  isLoading: boolean;
}

const fieldMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const MustangAgentBuilder = ({ onConfigure, isLoading }: MustangAgentBuilderProps) => {
  const [formState, setFormState] = useState<AgentConfiguration>({
    buyerName: "",
    maxBudget: "75000",
    preferredGeneration: "Any Mustang",
    location: "Nationwide",
    automationNotes: "Prioritize low-mileage examples with strong resale upside.",
    enableArbitrage: true,
    enableFirecrawl: true,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfigure(formState);
  };

  return (
    <motion.section
      id="agent-builder"
      className="rounded-3xl border border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-8 text-slate-100 shadow-xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.08 }}
    >
      <motion.div variants={fieldMotion} className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mustang Agent Composer</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure Mustang Max to match the right ponies with the right riders.
          </p>
        </div>
        <motion.span
          className="rounded-full border border-yellow-400/40 bg-yellow-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200"
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          Mustang Max Ready
        </motion.span>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <motion.div variants={fieldMotion} className="space-y-2">
          <Label htmlFor="buyerName">Buyer persona</Label>
          <Input
            id="buyerName"
            value={formState.buyerName}
            onChange={(event) => setFormState((prev) => ({ ...prev, buyerName: event.target.value }))}
            placeholder="Shelby enthusiast, track rat, collector"
            className="bg-slate-950/60"
          />
        </motion.div>

        <motion.div variants={fieldMotion} className="space-y-2">
          <Label htmlFor="maxBudget">Max budget (USD)</Label>
          <Input
            id="maxBudget"
            type="number"
            value={formState.maxBudget}
            onChange={(event) => setFormState((prev) => ({ ...prev, maxBudget: event.target.value }))}
            placeholder="75000"
            className="bg-slate-950/60"
          />
        </motion.div>

        <motion.div variants={fieldMotion} className="space-y-2">
          <Label htmlFor="location">Target market</Label>
          <Input
            id="location"
            value={formState.location}
            onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Nationwide, West Coast, Texas Triangle"
            className="bg-slate-950/60"
          />
        </motion.div>

        <motion.div variants={fieldMotion} className="space-y-2">
          <Label htmlFor="generation">Preferred generation or spec</Label>
          <Input
            id="generation"
            value={formState.preferredGeneration}
            onChange={(event) => setFormState((prev) => ({ ...prev, preferredGeneration: event.target.value }))}
            placeholder="Foxbody, S197, Shelby GT350, Dark Horse"
            className="bg-slate-950/60"
          />
        </motion.div>

        <motion.div variants={fieldMotion} className="md:col-span-2 space-y-2">
          <Label htmlFor="automationNotes">Acquisition notes</Label>
          <Textarea
            id="automationNotes"
            value={formState.automationNotes}
            onChange={(event) => setFormState((prev) => ({ ...prev, automationNotes: event.target.value }))}
            rows={4}
            className="resize-none bg-slate-950/60"
            placeholder="List negotiable terms, hold period, flip strategy, or delivery preferences."
          />
        </motion.div>

        <motion.div variants={fieldMotion} className="flex items-center justify-between rounded-2xl bg-slate-950/40 p-4">
          <div>
            <Label htmlFor="arbitrage" className="flex flex-col text-sm font-medium text-slate-200">
              Enable arbitrage modeling
              <span className="text-xs font-normal text-slate-400">
                Let the agent surface spreads between wholesale acquisition and buyer demand.
              </span>
            </Label>
          </div>
          <Switch
            id="arbitrage"
            checked={formState.enableArbitrage}
            onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, enableArbitrage: checked }))}
          />
        </motion.div>

        <motion.div variants={fieldMotion} className="flex items-center justify-between rounded-2xl bg-slate-950/40 p-4">
          <div>
            <Label htmlFor="firecrawl" className="flex flex-col text-sm font-medium text-slate-200">
              Activate Firecrawl sourcing
              <span className="text-xs font-normal text-slate-400">
                Scrape nationwide listings across classifieds, auctions, and dealer feeds.
              </span>
            </Label>
          </div>
          <Switch
            id="firecrawl"
            checked={formState.enableFirecrawl}
            onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, enableFirecrawl: checked }))}
          />
        </motion.div>

        <motion.button
          variants={fieldMotion}
          type="submit"
          className={cn(
            "group relative flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/50 bg-gradient-to-r from-yellow-500 via-orange-500 to-rose-500 px-6 py-3 font-semibold tracking-wide text-slate-950 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
            isLoading && "cursor-wait opacity-80",
          )}
          disabled={isLoading}
        >
          <span>{isLoading ? "Deploying Mustang Max..." : "Launch sourcing agent"}</span>
          <motion.span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/20"
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ repeat: isLoading ? Infinity : 0, duration: 1.2, ease: "linear" }}
          >
            🐎
          </motion.span>
        </motion.button>
      </form>
    </motion.section>
  );
};

export default MustangAgentBuilder;
