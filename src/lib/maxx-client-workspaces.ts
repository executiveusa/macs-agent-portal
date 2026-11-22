/**
 * Operator-confirmed client catalog for initial presentation only.
 * Names are NOT authorization. The canonical project identities, roles,
 * approval counts and durable prompt changes MUST come from MAXX Migrations.
 */
export type ClientSlug =
  | "crown-and-core" | "thp-flooring" | "bunna-restaurant"
  | "macs-digital-media" | "asc3nd" | "3x-plumbers" | "tangles-and-locs";

export type ClientCatalogItem = {
  slug: ClientSlug;
  name: string;
  suggestedTasks: readonly string[];
};

export const MAXX_CLIENT_CATALOG: readonly ClientCatalogItem[] = [
  {
    slug: "crown-and-core", name: "CROWN AND CORE",
    suggestedTasks: [
      "Review outstanding consultation requests and booking questions.",
      "Draft a client follow-up for owner approval.",
      "Find Crown and Core items waiting for a decision.",
      "Prepare a service promotion using verified salon information.",
    ],
  },
  {
    slug: "thp-flooring", name: "THP FLOORING",
    suggestedTasks: [
      "Review open flooring estimates and unanswered leads.",
      "Prepare follow-ups for projects awaiting a decision.",
      "Draft a before-and-after project post using approved photos.",
      "Show what needs approval at THP Flooring.",
    ],
  },
  {
    slug: "bunna-restaurant", name: "BUNNA RESTAURANT",
    suggestedTasks: [
      "Check the ordering path and identify customer friction.",
      "Compare recorded cash and card receipts when a POS is authorized.",
      "Prepare a group-meal campaign for owner approval.",
      "Show Bunna items awaiting approval and their source evidence.",
    ],
  },
  {
    slug: "macs-digital-media", name: "MACS DIGITAL MEDIA",
    suggestedTasks: [
      "Summarize approved tasks across my authorized clients.",
      "Which client approvals need my attention?",
      "Prepare this week's verified revenue and delivery report.",
      "Find the most important follow-up to unblock.",
    ],
  },
  {
    slug: "asc3nd", name: "ASC3ND",
    suggestedTasks: [
      "Review onboarding and activation issues.",
      "Draft a community engagement campaign.",
      "Prepare a weekly progress report with evidence.",
      "Show ASC3ND decisions waiting for owner approval.",
    ],
  },
  {
    slug: "3x-plumbers", name: "3X PLUMBERS",
    suggestedTasks: [
      "Check unanswered service inquiries.",
      "Review outstanding estimates and callback opportunities.",
      "Draft a local repair FAQ using verified company details.",
      "Show urgent owner-approved next actions.",
    ],
  },
  {
    slug: "tangles-and-locs", name: "TANGLES AND LOCS",
    suggestedTasks: [
      "Review booking gaps and cancellations.",
      "Draft a client win-back message for approval.",
      "Prepare an educational haircare content brief.",
      "Show appointments or follow-ups awaiting owner review.",
    ],
  },
] as const;

export function catalogItem(slug: string): ClientCatalogItem | undefined {
  return MAXX_CLIENT_CATALOG.find((client) => client.slug === slug);
}

export type VerifiedClientWorkspace = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  role: "owner" | "admin" | "operator" | "reviewer" | "viewer";
  status: "active" | "paused" | "archived";
  pendingApprovalCount: number | null; // null means not measured, NEVER imply zero
};

export function canSendClientTask(item?: VerifiedClientWorkspace | null): boolean {
  return Boolean(item && item.status === "active" &&
    ["owner", "admin", "operator"].includes(item.role));
}
