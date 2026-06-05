import { SceneConfig, PaymentPlan } from "../types/maxxpost";

export const scenesConfig: SceneConfig[] = [
  {
    id: "hero",
    title: "AGENT MAXX // FULL REVEAL",
    scrollBehavior: "pinned",
    visualContent: "/MUSTANG MAXX/HERO FULL PAGE IMAGE/MUSTANG MAX COVER.png",
    interaction: "Scroll to enter command",
  },
  {
    id: "briefing",
    title: "The Briefing",
    scrollBehavior: "scrolling_text_over_parallax",
    visualContent: "/MUSTANG MAXX/006/ChatGPT Image Jun 19, 2025, 01_06_02 PM.png",
    interaction: "Reveal the operating doctrine",
  },
  {
    id: "car_intro",
    title: "The Car Reveal",
    scrollBehavior: "pinned",
    visualContent: "/MUSTANG MAXX/CAR INTRO/Mustang-MAXX-car-reveal.png",
    interaction: "Reveal the vehicle before the platform modules",
  },
  {
    id: "the_car",
    title: "The Mustang MAXX",
    scrollBehavior: "horizontal_pin",
    visualContent: "/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_31 PM.png",
    features: [
      {
        id: "shadowthread",
        label: "ShadowThread\u2122",
        description: "High-volume conversations start landing with memory, calm, and premium brand control.",
        original_007_ref: "Armrest",
      },
      {
        id: "ghostrecall",
        label: "GhostRecall\u2122",
        description: "Quiet leads get reactivated with context-rich follow-up before revenue disappears for good.",
        original_007_ref: "Number Plate",
      },
      {
        id: "closecircuit",
        label: "CloseCircuit\u2122",
        description: "Buyers get the right recommendation, the right offer, and the right path to payment.",
        original_007_ref: "Ejector Seat",
      },
      {
        id: "forgestack",
        label: "ForgeStack\u2122",
        description: "Each deployment can absorb custom data, custom APIs, and a full reskin without breaking the engine.",
        original_007_ref: "Tyre Slasher",
      },
    ],
  },
  {
    id: "mission",
    title: "The Mission",
    scrollBehavior: "scrolling_panels",
    visualContent: "comic_panels",
    interaction: "Parallax comic gutters",
  },
];

export const paymentPlans: PaymentPlan[] = [
  {
    id: "agent_starter",
    name: "Field Agent",
    price: 49,
    currency: "USD",
    interval: "month",
    features: ["Access to Avatar Factory", "1 Active Pipeline", "Basic Support"],
    provider: "stripe",
  },
  {
    id: "agency_pro",
    name: "Station Chief",
    price: 99,
    currency: "USD",
    interval: "month",
    features: ["Unlimited Avatars", "3 Active Pipelines", "Priority Support", "Bitcoin Payments"],
    provider: "stripe",
  },
  {
    id: "sats_access",
    name: "Sats Day Pass",
    price: 21000,
    currency: "SATS",
    interval: "one-time",
    features: ["24h Dashboard Access", "Anonymous Login"],
    provider: "bitcoin402",
  },
];
