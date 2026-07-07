/**
 * MAXX Blog — seed posts for nonprofit & social-purpose AI operations.
 *
 * These render as a fallback when Supabase has no published posts, so the
 * blog is never an empty page. Titles are pain-point led and PNW-aware.
 * Body copy is intentionally short and useful — value first, not filler.
 */

export interface BlogSeedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  published_at: string;
  read_minutes: number;
  body: string;
}

export const maxxBlogPosts: BlogSeedPost[] = [
  {
    id: "seed-follow-up-leak",
    title: "The 72-Hour Follow-Up Leak Costing Community Organizations Support",
    slug: "72-hour-follow-up-leak",
    excerpt:
      "How missed calls, forms, DMs, and donor replies go cold — and a simple recovery checklist any small team can run.",
    category: "operations",
    tags: ["follow-up", "recovery", "nonprofit"],
    published_at: "2026-07-01T09:00:00.000Z",
    read_minutes: 4,
    body:
      "Most nonprofits do not have a lead problem first. They have a follow-up leak. Someone fills out a form, calls after hours, or replies to a newsletter — and the message sits in an inbox until the moment passes.\n\nThe fix is not more software. It is a 72-hour rule: every inquiry gets acknowledged within three days, ranked by likelihood to engage, and assigned a real next step.\n\nMAXX automates the boring part — capture, rank, draft, task — and waits for human approval before anything consequential goes out.",
  },
  {
    id: "seed-owned-ai-data",
    title: "How Nonprofits Can Use AI Without Giving Away Their Data",
    slug: "nonprofit-ai-without-losing-data",
    excerpt:
      "A practical guide to owned workspaces, approvals, and provider boundaries for community organizations.",
    category: "ai-strategy",
    tags: ["data-ownership", "ai", "security"],
    published_at: "2026-06-26T09:00:00.000Z",
    read_minutes: 5,
    body:
      "The promise of AI for nonprofits is real. The risk is handing your community's data to a vendor you cannot audit.\n\nThe middle path is an owned AI operator: your contacts, files, and workflows live in a workspace you control. The agent reads, drafts, and proposes — but a human approves every consequential action.\n\nThree rules: own the data, approve the action, log the decision. That is the MAXX standard.",
  },
  {
    id: "seed-donor-reactivation",
    title: "A Donor Reactivation Sprint You Can Run This Week",
    slug: "donor-reactivation-sprint",
    excerpt: "Segment old donors, write a useful update, and ask for a small next step.",
    category: "fundraising",
    tags: ["donors", "reactivation", "campaigns"],
    published_at: "2026-06-21T09:00:00.000Z",
    read_minutes: 4,
    body:
      "Your lapsed donors are not lost. They are un-thanked.\n\nA reactivation sprint is simple: pull donors who gave in the last 2–3 years but not this year. Segment them by gift size and recency. Send a warm update — what their last gift made possible — and ask for one small next step, not a big ask.\n\nMAXX drafts each message personalized to the donor's history, queues it for your approval, and tracks who responds.",
  },
  {
    id: "seed-crm-not-memory",
    title: "Your CRM Is Not Your Memory",
    slug: "crm-is-not-your-memory",
    excerpt: "Why contacts, notes, decisions, and follow-ups need an organization brain.",
    category: "operations",
    tags: ["crm", "memory", "context"],
    published_at: "2026-06-16T09:00:00.000Z",
    read_minutes: 3,
    body:
      "If your team runs follow-up from memory, you do not have a CRM. You have a database people avoid.\n\nInstitutional memory should not live in one person's head, one inbox, or one spreadsheet. The fix is a workspace that keeps contacts, notes, decisions, and next actions attached to each person — and an agent that remembers what matters.\n\nMAXX's memory layer does exactly this: context follows the relationship, not the tool.",
  },
  {
    id: "seed-what-agent-does",
    title: "What an AI Agent Should Actually Do For a Small Nonprofit",
    slug: "what-ai-agent-should-do-nonprofit",
    excerpt: "Ten workflows that save time before chasing sci-fi automation.",
    category: "ai-strategy",
    tags: ["agents", "workflows", "automation"],
    published_at: "2026-06-11T09:00:00.000Z",
    read_minutes: 6,
    body:
      "Forget the chatbot. Forget the giant automation map. The useful first AI project for most community organizations is a recovery sprint.\n\nAn agent earns its keep when it: captures every inquiry, drafts every follow-up, finds stale contacts, summarizes conversations, flags opportunities, tracks grant deadlines, drafts board packets, onboards volunteers, thanks donors, and remembers every edit so it learns.\n\nThat is the MAXX lane. Real outcomes, not science fiction.",
  },
  {
    id: "seed-pnw-follow-up",
    title: "Seattle Social Impact Teams Need Follow-Up Systems, Not More Dashboards",
    slug: "seattle-follow-up-systems",
    excerpt: "Why operations bottlenecks usually live between tools, not inside one tool.",
    category: "community",
    tags: ["seattle", "pnw", "operations"],
    published_at: "2026-06-06T09:00:00.000Z",
    read_minutes: 4,
    body:
      "Seattle has thousands of organizations doing meaningful work with overloaded teams — from the Rainier Valley to Beacon Hill to the Central District.\n\nThe next advantage is not more AI content. It is faster donor replies, cleaner volunteer onboarding, no missed service inquiries, grant deadlines that don't sneak up, and a second brain that remembers the work.\n\nThat is the lane MAXX serves for Pacific Northwest social-purpose teams.",
  },
  {
    id: "seed-crm-migration",
    title: "How to Migrate Off Locked-In CRM Tools Without Losing History",
    slug: "migrate-off-locked-crm",
    excerpt: "Field mapping, validation, backups, and a staged cutover for a safe switch.",
    category: "operations",
    tags: ["migration", "crm", "data"],
    published_at: "2026-06-01T09:00:00.000Z",
    read_minutes: 5,
    body:
      "The reason nonprofits stay on a CRM they hate is fear of losing history. The fix is a staged cutover, not a flip of the switch.\n\nStep one: map every field. Step two: validate and deduplicate in a staging environment. Step three: back up everything. Step four: cut over one team at a time, with the old system in read-only mode until the new one is trusted.\n\nMAXX runs the migration for you into a workspace you own — with validation reports you can actually read.",
  },
  {
    id: "seed-board-packet",
    title: "The Board Packet Automation Every Executive Director Deserves",
    slug: "board-packet-automation",
    excerpt: "Turn notes, tasks, metrics, and updates into a repeatable board rhythm.",
    category: "operations",
    tags: ["board", "automation", "reporting"],
    published_at: "2026-05-27T09:00:00.000Z",
    read_minutes: 4,
    body:
      "Every executive director knows the board-packet scramble: notes from five places, metrics you have to chase, action items buried in email.\n\nMAXX turns it into a rhythm. The agent collects updates across tools, drafts the agenda and summary, surfaces open action items, and assembles the packet — all for your review before it goes to the board.",
  },
  {
    id: "seed-volunteer-followup",
    title: "Volunteer Follow-Up: The Small Workflow That Prevents Big Burnout",
    slug: "volunteer-follow-up-workflow",
    excerpt: "Keep volunteers engaged after signup, shifts, and events.",
    category: "community",
    tags: ["volunteers", "follow-up", "retention"],
    published_at: "2026-05-22T09:00:00.000Z",
    read_minutes: 3,
    body:
      "Volunteers who feel forgotten after one shift do not come back. The fix is a simple follow-up loop: thank-you within 24 hours, a low-friction next step within a week, and a check-in before the next big push.\n\nMAXX queues each step, personalized to the volunteer's role and last shift, and waits for your approval. Small workflow, big retention.",
  },
  {
    id: "seed-event-to-relationship",
    title: "From Event Attendance to Relationships",
    slug: "event-attendance-to-relationships",
    excerpt: "How AI-assisted follow-up turns event lists into real community momentum.",
    category: "fundraising",
    tags: ["events", "relationships", "community"],
    published_at: "2026-05-17T09:00:00.000Z",
    read_minutes: 4,
    body:
      "An event list is not a relationship. It is the start of one.\n\nMAXX turns event attendance into momentum: every attendee becomes a contact with a tagged interest, a queued thank-you, a relevant next step, and a reminder for the team to follow up before the moment passes.\n\nThe result: events stop being one-night energy and start building durable community.",
  },
];

export const blogCategoryColors: Record<string, string> = {
  operations: "bg-maxx-orange/20 text-maxx-orange border-maxx-orange/30",
  "ai-strategy": "bg-maxx-cyan/20 text-maxx-cyan border-maxx-cyan/30",
  fundraising: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  community: "bg-white/15 text-white/80 border-white/25",
};

export const formatBlogCategory = (category: string) =>
  category.replace("-", " ");
