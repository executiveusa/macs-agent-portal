import { motion } from "framer-motion";

const tiers = [
  {
    name: "Pit Lane Pass",
    price: "$197/mo",
    highlights: [
      "Weekly Mustang Max sourcing drops",
      "Firecrawl-backed deal feed",
      "Flip-ready valuations and exit comps",
      "Access to Mustang Max community calls",
    ],
    badge: "Most popular",
    gradient: "from-sky-500 via-indigo-500 to-purple-500",
  },
  {
    name: "Trackside Collective",
    price: "$497/mo",
    highlights: [
      "Everything in Pit Lane",
      "Dedicated arbitrage agent tuned to your buy box",
      "Live deal desk with Mustang Max analysts",
      "Wholesale and collector network introductions",
    ],
    badge: "Investor grade",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    name: "Legends Garage",
    price: "$2,400/quarter",
    highlights: [
      "Alex Hormozi-inspired irresistible offer stack",
      "Done-for-you arbitrage operations",
      "White-glove logistics, inspections, and escrow",
      "First refusal on unicorn Mustangs from our vault",
    ],
    badge: "Limited spots",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
];

const tierVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const MustangPricing = () => (
  <motion.section
    id="pricing"
    className="rounded-3xl border border-primary/20 bg-slate-950/80 p-8 text-slate-100 shadow-xl"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.35 }}
    transition={{ staggerChildren: 0.1 }}
  >
    <motion.div variants={tierVariants} className="mb-8 text-center">
      <h2 className="text-3xl font-bold tracking-tight">Membership built the Hormozi way</h2>
      <p className="mt-2 text-sm text-slate-400">
        Stack value, guarantee outcomes, and create overwhelming clarity for buyers and sellers hunting Mustangs.
      </p>
    </motion.div>

    <div className="grid gap-6 md:grid-cols-3">
      {tiers.map((tier) => (
        <motion.article
          key={tier.name}
          variants={tierVariants}
          className="relative flex h-full flex-col rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6"
        >
          <div
            className={`absolute -top-3 right-6 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase text-yellow-200`}
          >
            <span className="h-2 w-2 rounded-full bg-yellow-300" />
            {tier.badge}
          </div>
          <div className={`h-1 rounded-full bg-gradient-to-r ${tier.gradient}`} />
          <div className="mt-6 space-y-3">
            <h3 className="text-xl font-semibold text-yellow-200">{tier.name}</h3>
            <p className="text-3xl font-bold text-slate-100">{tier.price}</p>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {tier.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-yellow-200">
                  🐴
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 inline-flex items-center justify-center rounded-2xl border border-yellow-400/40 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 px-5 py-2 text-sm font-semibold text-yellow-200"
          >
            Apply for membership
          </motion.button>
        </motion.article>
      ))}
    </div>
  </motion.section>
);

export default MustangPricing;
