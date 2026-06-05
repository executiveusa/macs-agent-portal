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
  chapterStart: "top 68%",
  chapterDuration: 1.08,
  chapterStagger: 0.16,
  finaleStart: "top 70%",
  finaleCopyDuration: 1.05,
  finaleCardDuration: 1.02,
  finaleStagger: 0.14,
} as const;

export const missionChapters = [
  { id: "hero", label: "Reveal", shortLabel: "Reveal" },
  { id: "briefing", label: "Briefing", shortLabel: "Brief" },
  { id: "car-intro", label: "Vehicle", shortLabel: "Car" },
  { id: "car", label: "Platform", shortLabel: "Modules" },
  { id: "departments", label: "Departments", shortLabel: "Ops" },
  { id: "mission", label: "Mission", shortLabel: "Finale" },
] as const;

export const maxxMissionBeats = [
  "The first reply feels remembered, not generated.",
  "Stalled revenue gets another pass before it disappears.",
  "Buyers get a single clean path to the next step."
];

export const maxxDepartmentCards = [
  {
    id: "shadowthread",
    eyebrow: "Customer Experience Agent",
    title: "ShadowThread\u2122",
    image: "/MUSTANG MAXX/006/ChatGPT Image Dec 10, 2025, 01_05_14 PM.png",
    summary: "Every inbound conversation starts feeling premium, personal, and impossible to drop.",
    outcome:
      "Members get answers that sound like your best operator on their best day, while your team gets its time back."
  },
  {
    id: "ghostrecall",
    eyebrow: "Revenue Recovery Agent",
    title: "GhostRecall\u2122",
    image: "/MUSTANG MAXX/COMIC/ChatGPT Image Jun 19, 2025, 01_04_43 PM.png",
    summary: "Dormant leads stop disappearing into the CRM void.",
    outcome:
      "Agent MAXX reopens stalled conversations with memory, timing, and pressure that feels human instead of automated."
  },
  {
    id: "closecircuit",
    eyebrow: "Commerce Agent",
    title: "CloseCircuit\u2122",
    image: "/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_45 PM.png",
    summary: "Buyers get guided to the right offer, the right next step, and the right payment path.",
    outcome:
      "Friction drops, confidence rises, and the path from question to transaction gets dramatically shorter."
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
