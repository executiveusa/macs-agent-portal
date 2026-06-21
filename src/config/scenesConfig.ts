import { FeatureSpec, SceneConfig, PaymentPlan } from "../types/maxxpost";

const maxxCarFeatureSpecs: FeatureSpec[] = [
  {
    id: "shadowthread",
    label: "Smart Follow-Up",
    description: "Keep the right next message in motion before the lead cools off.",
    original_007_ref: "Armrest",
  },
  {
    id: "ghostrecall",
    label: "Offer Builder",
    description: "Turn a warm conversation into a clear next step, price, or package.",
    original_007_ref: "Number Plate",
  },
  {
    id: "closecircuit",
    label: "Conversation Memory",
    description: "Keep the context attached so every reply feels like a continuation, not a reset.",
    original_007_ref: "Ejector Seat",
  },
];

const maxxTechFeatureSpecs: FeatureSpec[] = [
  {
    id: "websites",
    label: "Websites & Landing Pages",
    description: "Ship the pages, funnels, and launch surfaces that carry the message forward.",
    original_007_ref: "Tyre Slasher",
  },
  {
    id: "automations",
    label: "Automations & Workflows",
    description: "Wire the follow-up, routing, and repetitive work so the team stays focused.",
    original_007_ref: "Armrest",
  },
  {
    id: "skills",
    label: "Custom Agent Skills",
    description: "Package repeatable behaviors into reusable commands the operator can trigger again.",
    original_007_ref: "Number Plate",
  },
];

export const scenesConfig: SceneConfig[] = [
  {
    id: "hero",
    title: "AGENT MAXX // MEET MAXX",
    scrollBehavior: "pinned",
    visualContent: "/MUSTANG MAXX/HERO FULL PAGE IMAGE/MUSTANG MAX COVER.png",
    interaction: "Scroll to meet MAXX",
  },
  {
    id: "briefing",
    title: "Find Leads",
    scrollBehavior: "scrolling_text_over_parallax",
    visualContent: "/MUSTANG MAXX/006/ChatGPT Image Jun 19, 2025, 01_06_02 PM.png",
    interaction: "Surface the lead brief",
  },
  {
    id: "car_intro",
    title: "Create Content",
    scrollBehavior: "pinned",
    visualContent: "/MUSTANG MAXX/CAR INTRO/Mustang-MAXX-car-reveal.png",
    interaction: "Reveal the content engine before the platform modules",
  },
  {
    id: "the_car",
    title: "Close Deals",
    scrollBehavior: "horizontal_pin",
    visualContent: "/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_31 PM.png",
    features: maxxCarFeatureSpecs,
  },
  {
    id: "tech_specs",
    title: "Build Systems",
    scrollBehavior: "vertical_scroll",
    visualContent: "/MUSTANG MAXX/COMIC/1920x0.jpg",
    interaction: "Map the system behind the story",
    features: maxxTechFeatureSpecs,
  },
  {
    id: "mission",
    title: "Start Mission",
    scrollBehavior: "scrolling_panels",
    visualContent: "comic_panels",
    interaction: "Run the final sequence",
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
