import { SceneConfig, PaymentPlan } from '../types/maxxpost';

export const scenesConfig: SceneConfig[] = [
  {
    id: 'hero',
    title: 'MAXX-POST: Agent 006',
    scrollBehavior: 'pinned',
    visualContent: '/MUSTANG MAXX/HERO FULL PAGE IMAGE/ChatGPT Image Dec 10, 2025, 01_05_29 PM.png',
    interaction: 'Scroll to initiate mission'
  },
  {
    id: 'briefing',
    title: 'The Briefing',
    scrollBehavior: 'scrolling_text_over_parallax',
    visualContent: '/MUSTANG MAXX/006/ChatGPT Image Jun 19, 2025, 01_06_02 PM.png', // Selecting a good profile shot
    interaction: 'Fade in dossier text'
  },
  {
    id: 'the_car',
    title: 'The Mustang MAXX',
    scrollBehavior: 'horizontal_pin',
    visualContent: '/MUSTANG MAXX/MUSTANG MAXX/ChatGPT Image Jun 19, 2025, 01_04_31 PM.png', // Side profile
    features: [
      { 
        id: 'ai_console', 
        label: 'AI Neural Link', 
        description: 'Direct interface with the Agency DAO. Autonomous decision making at 6000 RPM.',
        original_007_ref: 'Armrest' 
      },
      { 
        id: 'plates', 
        label: 'Crypto-ledger Plates', 
        description: 'Dynamic identity shifting via verified blockchain transactions.', 
        original_007_ref: 'Number Plate' 
      },
      { 
        id: 'eject', 
        label: 'Emergency Rug-Pull Eject', 
        description: 'Standard issue vertical escape velocity.', 
        original_007_ref: 'Ejector Seat' 
      },
      { 
        id: 'drone', 
        label: 'Drone Swarm Deployer', 
        description: 'Autonomous aerial reconnaissance and defense perimeter.', 
        original_007_ref: 'Tyre Slasher' 
      }
    ]
  },
  {
    id: 'mission',
    title: 'The Mission',
    scrollBehavior: 'scrolling_panels',
    visualContent: 'comic_panels',
    interaction: 'Parallax comic gutters'
  }
];

export const paymentPlans: PaymentPlan[] = [
  {
    id: 'agent_starter',
    name: 'Field Agent',
    price: 49,
    currency: 'USD',
    interval: 'month',
    features: ['Access to Avatar Factory', '1 Active Pipeline', 'Basic Support'],
    provider: 'stripe'
  },
  {
    id: 'agency_pro',
    name: 'Station Chief',
    price: 99,
    currency: 'USD',
    interval: 'month',
    features: ['Unlimited Avatars', '3 Active Pipelines', 'Priority Support', 'Bitcoin Payments'],
    provider: 'stripe'
  },
  {
    id: 'sats_access',
    name: 'Sats Day Pass',
    price: 21000,
    currency: 'SATS',
    interval: 'one-time',
    features: ['24h Dashboard Access', 'Anonymous Login'],
    provider: 'bitcoin402'
  }
];
