export const countdownFrames = ["006", "005", "004", "003", "002", "001"];

export const maxxMotionTiming = {
  introFrameDuration: 360,
  introExitDuration: 320,
  heroTextShift: "18%",
  heroImageScale: 1.03,
  heroImageY: 2,
  briefingStart: "top 72%",
  briefingEnd: "bottom 18%",
  briefingScrub: 1.15,
  briefingImageX: -72,
  briefingTextX: 72,
  briefingImageY: 18,
  briefingTextY: 18,
  briefingImageScale: 1.04,
  carIntroEnd: "+=170%",
  carIntroScrub: 0.9,
  carIntroImageStartScale: 1.08,
  carIntroImageStartY: 4,
  mustangEnd: "+=340%",
  mustangScrub: 1,
  mustangScale: 1.08,
  mustangLift: 14,
  mustangHotspotStagger: 0.08,
  techSpecsStart: "top 68%",
  techSpecsEnd: "bottom bottom",
  techSpecsScrub: 1,
  techSpecsCardDuration: 1,
  techSpecsStagger: 0.12,
  chapterStart: "top 68%",
  chapterDuration: 1.08,
  chapterStagger: 0.16,
  finaleStart: "top 70%",
  finaleCopyDuration: 1.05,
  finaleCardDuration: 1.02,
  finaleStagger: 0.14,
} as const;

export const missionChapters = [
  { id: "hero", label: "Meet MAXX", shortLabel: "MAXX" },
  { id: "briefing", label: "Find Leads", shortLabel: "Leads" },
  { id: "car-intro", label: "Create Content", shortLabel: "Content" },
  { id: "car", label: "Close Deals", shortLabel: "Close" },
  { id: "tech_specs", label: "Build Systems", shortLabel: "Build" },
  { id: "departments", label: "Run Operations", shortLabel: "Ops" },
  { id: "mission", label: "Start Mission", shortLabel: "Start" },
] as const;

export const maxxHeroBeats = [
  "Find the right leads before the opportunity goes cold.",
  "Turn raw ideas into posts, clips, pages, offers, and campaigns.",
  "Follow up, close the loop, and keep the whole operation moving."
];

export const maxxDepartmentCards = [
  {
    id: "shadowthread",
    eyebrow: "Daily Mission Board",
    title: "Daily Mission Board",
    image: "/MUSTANG MAXX/006/ChatGPT Image Dec 10, 2025, 01_05_14 PM.png",
    summary: "See the work that needs attention now without digging through three tabs.",
    outcome: "The team gets one place to queue the next move and keep the day moving."
  },
  {
    id: "ghostrecall",
    eyebrow: "Memory & Context",
    title: "Memory & Context",
    image: "/MUSTANG MAXX/COMIC/ChatGPT Image Jun 19, 2025, 01_04_43 PM.png",
    summary: "Keep the details, decisions, and history attached to every thread.",
    outcome: "MAXX remembers what matters so follow-up never starts from zero."
  },
  {
    id: "closecircuit",
    eyebrow: "Tool Command Layer",
    title: "Tool Command Layer",
    image: "/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_45 PM.png",
    summary: "Turn the stack of apps into a single operator surface.",
    outcome: "Launch the right tool at the right time without bouncing between systems."
  }
];

export const maxxFinalMissionCards = [
  {
    id: "choose",
    title: "Choose the Outcome",
    body: "Start with the result you actually want, so the workflow can aim at something real.",
  },
  {
    id: "launch",
    title: "Launch the Workflow",
    body: "Let MAXX assemble the steps, tools, and context needed to get the work moving.",
  },
  {
    id: "control",
    title: "Keep Control",
    body: "Stay in charge with approvals, context, and a clear view of what happens next.",
  }
];

export const maxxBriefingStats = [
  {
    label: "ForgeStack\u2122",
    value: "Upload your data, swap your APIs, and train a branded MAXX without rebuilding the system."
  },
  {
    label: "Dossier Engine\u2122",
    value: "Every organization gets its own memory, tone, and operating context injected behind the scenes."
  },
  {
    label: "Command Layer\u2122",
    value: "Frontend theater stays clean while the backend runs orchestration, browser control, and deployment logic."
  }
];

export const maxxStoryConfig = {
  briefing: {
    slideInDuration: 1.08,
    scrubAmount: 1.15,
    startOffset: "72%",
  },
} as const;
