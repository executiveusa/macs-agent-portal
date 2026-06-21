import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const maxxSkills = [
  "maxx-onboarding",
  "maxx-gsap-motion",
  "maxx-browser-verify",
  "maxx-code-search",
  "maxx-video-dossier",
  "maxx-opusclip",
  "maxx-software-factory",
  "maxx-skill-router",
  "land-the-plane",
] as const;

export default function registerMaxxLane(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("maxx", `MAXX lane active: ${maxxSkills.length} skills`);
  });

  pi.registerCommand("maxx-lane", {
    description: "Show the active MAXX Pi lane and its loaded skills",
    handler: async (_args, ctx) => {
      ctx.ui.notify(`MAXX lane loaded: ${maxxSkills.join(", ")}`, "info");
    },
  });

  pi.registerCommand("maxx-browser-verify", {
    description: "Show the remote browser smoke-test command",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Run `npm run maxx:browser-smoke -- http://127.0.0.1:4173/` with MAXX_BROWSER_WS_ENDPOINT set.",
        "info",
      );
    },
  });

  pi.registerCommand("maxx-video-dossier", {
    description: "Show the video dossier generation command",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Run `npm run maxx:video-dossier -- --source https://www.youtube.com/@stefan_3d_ai/videos --out ops/reports/MAXX-STEFAN-3D-AI-DOSSIER.md`.",
        "info",
      );
    },
  });

  pi.registerCommand("maxx-opusclip", {
    description: "Show the backend-only OpusClip command lane",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Run `npm run maxx:opusclip -- --help`. Live OpusClip calls require OPUSCLIP_API_KEY and explicit confirmation flags for submit, publish, schedule, thumbnail, and edit actions.",
        "info",
      );
    },
  });

  pi.registerCommand("maxx-software-factory", {
    description: "Show the Agent Maxx skill-router and registry workflow",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Read pi-packages/maxx/skills/maxx-software-factory/SKILL.md, then use pi-packages/maxx/registry/ as the lazy-loaded registry scaffold.",
        "info",
      );
    },
  });

  pi.registerCommand("maxx-skill-router", {
    description: "Show the lightweight MAXX router skill",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Read pi-packages/maxx/skills/maxx-skill-router/SKILL.md to classify the task before loading broader factory docs.",
        "info",
      );
    },
  });

  pi.registerCommand("land-the-plane", {
    description: "Show the MAXX merge-and-close workflow",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        "Read pi-packages/maxx/skills/land-the-plane/SKILL.md for the branch-close and merge gate workflow.",
        "info",
      );
    },
  });
}
