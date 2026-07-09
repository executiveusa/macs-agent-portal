/**
 * MAXX Community Operating System — single source of truth for the offer.
 *
 * Brand framing: Agent MAXX is the field operative (secret-agent mascot).
 * Business promise: recover the follow-ups nonprofits and social-purpose
 * teams are too busy to chase. Powered by Hermes. Managed as MAXX.
 *
 * Every scene and section reads copy from here so the message stays
 * consistent and the Hormozi value equation is carried end to end.
 */

export interface ValueStackItem {
  id: string;
  title: string;
  detail: string;
}

export interface PainCard {
  id: string;
  title: string;
  detail: string;
  cost: string;
}

export interface OutcomeCard {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  outcome: string;
}

export interface HowItWorksStep {
  id: string;
  step: string;
  title: string;
  detail: string;
}

export interface OfferPackage {
  id: string;
  codename: string;
  name: string;
  tagline: string;
  setup: string;
  ownership: string;
  management?: string;
  popular?: boolean;
  includes: string[];
  bestFor: string;
}

/* ---------- Brand positioning ---------- */

export const maxxBrand = {
  company: "MACS Digital Media",
  agent: "Agent MAXX",
  runtime: "Hermes",
  region: "Seattle & the Pacific Northwest",
  audience: "Nonprofits, social-purpose companies, and community organizations",
  oneLiner: "The follow-up recovery operator for nonprofits and social-purpose teams.",
  poweredBy: "Powered by Hermes. Managed as MAXX.",
  riskReversal:
    "If we cannot produce a usable recovery audit, a live agent workspace, and a first approved follow-up workflow inside the activation window, we keep working at no extra implementation fee until they are live. Pass-through provider fees are excluded.",
} as const;

/* ---------- Hero ---------- */

export const maxxHero = {
  eyebrow: "AGENT MAXX // FIELD OPERATIVE",
  headlineLine1: "Recover the follow-ups",
  headlineLine2: "your team is too",
  headlineLine3: "busy to chase.",
  subhero:
    "MAXX is a managed AI operator for nonprofits and social-purpose teams. We find missed calls, forms, donors, and volunteers — draft the follow-up — and wait for your approval before a single message goes out.",
  primaryCta: "Book a Recovery Audit",
  secondaryCta: "Get the Missed Follow-Up Checklist",
  proofLine:
    "First sprint: find the missed opportunities, clean the list, draft the campaign — and let you approve every message before it leaves.",
} as const;

export const maxxHeroBeats = [
  "Find missed calls, forms, donors, and volunteers before they go cold.",
  "Draft the follow-up and queue it for your approval — never auto-sends.",
  "Keep the context, history, and next step attached to every person.",
] as const;

/* ---------- Pain stack (what hurts now) ---------- */

export const maxxPains: PainCard[] = [
  {
    id: "missed-inquiries",
    title: "Inquiries fall through the cracks",
    detail:
      "Calls, forms, DMs, and donor replies land in five different places. By the time someone answers, the moment has passed.",
    cost: "Lost donors. Lost volunteers. Lost trust.",
  },
  {
    id: "messy-crm",
    title: "The CRM is rented and avoided",
    detail:
      "You pay for a database your team runs from memory. Contacts are duplicated, tags are stale, and no one trusts the next action.",
    cost: "Decisions made on gut, not on the list.",
  },
  {
    id: "staff-overload",
    title: "The team is overloaded",
    detail:
      "Two people are doing the work of six. Follow-up is the first thing that slips — and it is the thing that keeps the mission funded.",
    cost: "Burnout. Turnover. Quiet mission drift.",
  },
];

/* ---------- Outcomes (what MAXX delivers) ---------- */

export const maxxOutcomes: OutcomeCard[] = [
  {
    id: "recover",
    eyebrow: "Mission 01",
    title: "Recover conversations",
    detail:
      "MAXX surfaces every missed call, form, and stale lead — ranks them by likelihood to re-engage — and drafts the warm follow-up.",
    outcome: "Fewer people fall through the cracks.",
  },
  {
    id: "own",
    eyebrow: "Mission 02",
    title: "Own your data",
    detail:
      "Your contacts, workflows, files, and agent memory live in a workspace you control. We manage it like a property manager — you own the house.",
    outcome: "No vendor lock-in. No hostage data.",
  },
  {
    id: "approve",
    eyebrow: "Mission 03",
    title: "Approve automation safely",
    detail:
      "MAXX drafts every consequential message and waits for a human yes. You see the source, the action, the risk level, and the approval state.",
    outcome: "AI that helps without becoming a liability.",
  },
];

/* ---------- How it works ---------- */

export const maxxHowItWorks: HowItWorksStep[] = [
  {
    id: "audit",
    step: "Step 01",
    title: "Recovery Audit",
    detail:
      "We find every missed inquiry from the last 90 days — calls, forms, donors, volunteers — and rank them by recoverability.",
  },
  {
    id: "cleanup",
    step: "Step 02",
    title: "Data Cleanup",
    detail:
      "We normalize contacts, tags, statuses, and pipelines into one list you can trust. Duplicates merged. Next actions assigned.",
  },
  {
    id: "sprint",
    step: "Step 03",
    title: "Reactivation Sprint",
    detail:
      "We launch one approved follow-up campaign to the warmest segment — often producing real conversations before the full install.",
  },
  {
    id: "install",
    step: "Step 04",
    title: "Owned System Install",
    detail:
      "We install the MAXX agent, trained on your mission, into a workspace you own — missed-call text-back, form follow-up, donor thank-yous.",
  },
  {
    id: "operate",
    step: "Step 05",
    title: "You Operate or We Manage",
    detail:
      "Run it yourself with our training, or keep us on as your technology property manager for updates, reviews, and optimization.",
  },
];

/* ---------- Hormozi value equation ---------- */

export const maxxValueEquation = {
  headline: "Why this is a grand-slam offer, not a software subscription",
  dream:
    "More support, more qualified conversations, fewer missed opportunities, less staff overload.",
  likelihood:
    "Proof first: a real recovery audit, visible workflows, logs, and human-approved drafts before anything consequential ships.",
  timeDelay: "First reactivation sprint starts before the full install is complete.",
  effort: "Done-for-you setup, migration, templates, staff training, and approval-first automation.",
} as const;

/* ---------- Pricing packages ---------- */

export const maxxPackages: OfferPackage[] = [
  {
    id: "recovery-starter",
    codename: "OPERATION RECOVERY",
    name: "MAXX Recovery Starter",
    tagline: "The fastest first win. Best for a first client.",
    setup: "$7,500",
    ownership: "$850/mo × 12",
    management: "$750/mo optional",
    popular: true,
    bestFor: "A nonprofit that needs to prove the follow-up fix fast.",
    includes: [
      "Recovery audit (90 days of missed inquiries)",
      "CRM cleanup starter (contacts, tags, statuses)",
      "One approved reactivation campaign",
      "One Hermes/MAXX agent trained on your mission",
      "One owned ICM workspace",
      "Operator dashboard access",
      "Live walkthrough + plain-English owner manual",
    ],
  },
  {
    id: "field-office",
    codename: "OPERATION FIELD OFFICE",
    name: "MAXX Field Office",
    tagline: "The full follow-up system for a working team.",
    setup: "$15,000",
    ownership: "$1,650/mo × 12",
    management: "$1,500/mo optional",
    bestFor: "An organization ready to own its whole follow-up operation.",
    includes: [
      "Everything in Recovery Starter, plus:",
      "CRM / GHL migration into your owned workspace",
      "Missed-call text-back",
      "Form follow-up automation",
      "Donor & volunteer reactivation workflows",
      "Social / content planner",
      "Monthly optimization review",
    ],
  },
  {
    id: "mission-control",
    codename: "OPERATION MISSION CONTROL",
    name: "MAXX Mission Control",
    tagline: "Multi-agent operations for a funded, scaled mission.",
    setup: "$30,000",
    ownership: "$2,950/mo × 12",
    management: "$2,500/mo+ optional",
    bestFor: "Foundations and multi-program organizations.",
    includes: [
      "Everything in Field Office, plus:",
      "Multi-agent workflows",
      "Custom integrations (Twilio, grant tools, board reporting)",
      "Voice / SMS / email operator layer",
      "Board packet & grant deadline automation",
      "Observability and audit trail",
      "Managed deployment",
    ],
  },
];

export const maxxPricingNote =
  "Like a phone: pay upfront or finance the setup over 12 months. At the end, the system is yours. Keep us on to manage it, or run it yourself." as const;

/* ---------- Quick-win workflows MAXX runs ---------- */

export const maxxQuickWins: { id: string; title: string; detail: string }[] = [
  { id: "missed-call", title: "Missed-call text-back", detail: "Every missed call gets a compliant reply and a task." },
  { id: "missed-form", title: "Missed-form recovery", detail: "Old form submissions get ranked and followed up." },
  { id: "donor-react", title: "Donor reactivation", detail: "Stale donors get segmented, thanked, and invited back." },
  { id: "volunteer-react", title: "Volunteer reactivation", detail: "Inactive volunteers get a low-friction next step." },
  { id: "event-followup", title: "Event follow-up", detail: "Attendees become contacts, tasks, thank-yous, and asks." },
  { id: "grant-tracker", title: "Grant tracker", detail: "Deadlines, owners, attachments, and draft checklists." },
];

/* ---------- Final mission CTA ---------- */

export const maxxFinalCta = {
  eyebrow: "Start Mission",
  headline: "Book the recovery audit. MAXX handles the rest.",
  detail:
    "In 14 AI-days we install a working operator that recovers missed opportunities, organizes your contacts, and gives your team a follow-up system you own.",
  primaryCta: "Book a Recovery Audit",
  secondaryCta: "Get the Missed Follow-Up Checklist",
} as const;

/* ---------- Final mission cards (3-step operator loop) ---------- */

export const maxxFinalMissionCards = [
  {
    id: "choose",
    title: "Choose the outcome",
    body: "Start with the result you actually want — recovered donors, cleaner intake, fewer missed calls — so the workflow aims at something real.",
  },
  {
    id: "launch",
    title: "Launch the workflow",
    body: "MAXX assembles the steps, tools, and context. It drafts the follow-up, never sends without your approval.",
  },
  {
    id: "control",
    title: "Keep control",
    body: "Approve, edit, or reject. Every action is logged with its source, risk level, and model — so the mission stays auditable.",
  },
];

/* ---------- Department cards (operations) ---------- */

export const maxxDepartmentCards = [
  {
    id: "daily-mission",
    eyebrow: "Daily Mission Board",
    title: "Daily Mission Board",
    summary: "See the work that needs attention now without digging through three tabs.",
    outcome: "The team gets one place to queue the next move and keep the day moving.",
    image: "/MUSTANG MAXX/006/ChatGPT Image Dec 10, 2025, 01_05_14 PM.png",
  },
  {
    id: "dossier",
    eyebrow: "Memory & Context",
    title: "Memory & Context",
    summary: "Keep the details, decisions, and history attached to every person and conversation.",
    outcome: "MAXX remembers what matters so follow-up never starts from zero.",
    image: "/MUSTANG MAXX/COMIC/ChatGPT Image Jun 19, 2025, 01_04_43 PM.png",
  },
  {
    id: "command",
    eyebrow: "Tool Command Layer",
    title: "Tool Command Layer",
    summary: "Turn the stack of apps into a single operator surface.",
    outcome: "Launch the right tool at the right time without bouncing between systems.",
    image: "/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_45 PM.png",
  },
];

/* ---------- Briefing stats (the system behind the story) ---------- */

export const maxxBriefingStats = [
  {
    label: "Recovery Engine",
    value: "Scans calls, forms, DMs, and CRM notes to surface every inquiry that slipped through.",
  },
  {
    label: "Owned Workspace",
    value: "Your contacts, workflows, files, and agent memory — in a system you control, not rent.",
  },
  {
    label: "Approval Layer",
    value: "MAXX drafts every consequential message and waits for a human yes before it ships.",
  },
];
