import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const maxxSkills = ["maxx-onboarding", "maxx-gsap-motion", "maxx-browser-verify", "maxx-code-search"] as const;

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
}
