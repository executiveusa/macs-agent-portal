# MAXX-POST Frontend (Agent 006)

## System Overview

This repository contains the rebranded "MAXX-POST" homepage and agency dashboard, replacing the previous portal. It is built with React, Vite, Tailwind CSS, and GSAP.

## Key Features

- **Scroll Story**: A 007-style scrolling experience featuring Agent 006 and the Mustang MAXX using GSAP ScrollTrigger.
- **Dashboard Shell**: A "Command Center" interface for the autonomous AI agency.
- **Payment Stubs**: Frontend-only integrations for Stripe and Bitcoin 402 payments.

## Setup & Run

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Dev Server

```bash
npm run dev
```

Access at `http://localhost:8080` (or the port vite selects).

## Architecture

- `src/components/scenes/`: Contains the ScrollTrigger scenes (Hero, Briefing, Mustang).
- `src/config/scenesConfig.ts`: Configuration for images and text (CMS-lite).
- `src/hooks/usePayment.ts`: Unified payment hook.
- `docs/arch/`: Architecture documentation.
- `docs/prd/`: Product Requirements Document.

## Verification

To run tests (Playwright):

```bash
npx playwright test
```

(Ensure playwright is installed).
