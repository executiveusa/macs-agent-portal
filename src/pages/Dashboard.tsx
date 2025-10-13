import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import MustangAgentBuilder, { type AgentConfiguration } from "@/components/dashboard/MustangAgentBuilder";
import MustangMarketplace from "@/components/dashboard/MustangMarketplace";
import MustangInsights from "@/components/dashboard/MustangInsights";
import MustangPricing from "@/components/dashboard/MustangPricing";
import type { MustangListing } from "@/lib/firecrawl";
import { searchMustangListings } from "@/lib/firecrawl";

const heroVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const [listings, setListings] = useState<MustangListing[]>([]);
  const [feedSource, setFeedSource] = useState<"live" | "fallback">("fallback");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    searchMustangListings({ maxResults: 9 }).then((response) => {
      if (!isMounted) return;
      setListings(response.listings);
      setFeedSource(response.source);
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAgentConfigure = async (config: AgentConfiguration) => {
    setIsLoading(true);
    try {
      const response = await searchMustangListings({
        searchTerm: `${config.preferredGeneration} Mustang in ${config.location}`,
        preferredLocations: [config.location],
        maxResults: 9,
      });
      setListings(response.listings);
      setFeedSource(response.source);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Navbar />
      <main className="container mx-auto space-y-12 pb-16 pt-24">
        <motion.section
          id="hero"
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-slate-950/80 p-10 shadow-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div variants={heroVariants} className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-200">
              Mustang Max Garage
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              A Web3 agent studio for Mustang arbitrage
            </h1>
            <p className="text-base text-slate-300 md:text-lg">
              Deploy AI pit crews that scrape nationwide inventory with Firecrawl, negotiate spreads, and match every buyer to
              their dream Mustang. Classic barn finds, modern Dark Horses, and limited-run Shelbys—all curated under one hood.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-1 text-emerald-200">
                🐎 Mustang Max mascot ready
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-1 text-sky-200">
                🔥 Firecrawl integrated
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/20 px-4 py-1 text-purple-100">
                ⛓️ Web3-ready memberships
              </span>
            </div>
          </motion.div>
          <motion.div
            variants={heroVariants}
            className="mt-10 grid gap-4 rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 md:grid-cols-3"
          >
            {["Source", "Match", "Scale"].map((step, index) => (
              <motion.div key={step} className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Step {index + 1}</p>
                <p className="text-lg font-semibold text-yellow-200">{step}</p>
                <p className="text-sm text-slate-300">
                  {index === 0 && "Firecrawl scrapes listings, auctions, and private sellers for Mustangs that fit your buy box."}
                  {index === 1 && "Mustang Max pairs live inventory with member demand, surfacing spreads worth acting on now."}
                  {index === 2 && "Framer Motion dashboards keep your pit crew aligned while smart contracts secure the deal."}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <MustangAgentBuilder onConfigure={handleAgentConfigure} isLoading={isLoading} />

        <MustangMarketplace listings={listings} source={feedSource} />

        <MustangInsights />

        <MustangPricing />
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
