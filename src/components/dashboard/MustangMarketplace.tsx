import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { MustangListing } from "@/lib/firecrawl";

interface MustangMarketplaceProps {
  listings: MustangListing[];
  source: "live" | "fallback";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const badges = {
  live: {
    text: "Firecrawl live feed",
    className: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
  },
  fallback: {
    text: "Sample Mustang inventory",
    className: "bg-slate-500/20 text-slate-300 border border-slate-400/40",
  },
};

export const MustangMarketplace = ({ listings, source }: MustangMarketplaceProps) => {
  return (
    <motion.section
      id="mustang-marketplace"
      className="rounded-3xl border border-primary/20 bg-slate-950/60 p-8 text-slate-100 shadow-2xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Mustang deal board</h2>
          <p className="text-sm text-slate-400">
            Curated nationwide listings focused on spreads and standout builds. Updated continuously by our agents.
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase ${badges[source].className}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {badges[source].text}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <motion.article
            key={listing.id}
            className="group flex h-full flex-col justify-between rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 backdrop-blur-sm transition-transform hover:-translate-y-1 hover:border-yellow-400/50"
            variants={cardVariants}
          >
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-yellow-200 group-hover:text-yellow-100">
                {listing.title}
              </h3>
              <p className="text-sm text-slate-300">{listing.summary}</p>
              <dl className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Provider</dt>
                  <dd className="font-medium text-slate-200">{listing.provider}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-200">{listing.location}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Asking</dt>
                  <dd className="font-medium text-yellow-200">{listing.askingPrice}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-slate-500">Mileage</dt>
                  <dd className="font-medium text-slate-200">{listing.mileage}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
              <span>{listing.freshness}</span>
              <a
                href={listing.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-yellow-400/40 px-3 py-1 font-semibold text-yellow-200 transition-colors hover:bg-yellow-500/20"
              >
                View listing
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
};

export default MustangMarketplace;
