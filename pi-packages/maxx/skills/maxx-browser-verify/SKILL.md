---
name: maxx-browser-verify
description: Verify the current Agent MAXX public 006 site and Stacy private conversational app after visual, auth, interaction, or deployment changes.
---

# MAXX browser verification

Use after any visual/interaction/auth change and before claiming the frontend is verified.

## Runtime selection

- Prefer the configured remote browser/CDP endpoint when `MAXX_BROWSER_WS_ENDPOINT` exists.
- Otherwise use an available browser-capable testing tool in the current environment.
- Never mark a viewport/device-specific behavior verified if the browser could not actually reproduce that viewport/device.

## Public `/` checklist

- Page loads without uncaught console errors.
- Agent 006/MAXX identity and primary offer are understandable without agent-infrastructure jargon.
- Approved MAXX/Mustang imagery is not visibly stretched or unintentionally cropped at 1280px desktop and 390px mobile.
- Navigation and primary CTA are keyboard reachable.
- GSAP/scroll scenes do not trap scrolling, jump during pinned transitions, or obscure the CTA.
- Public page never exposes the private MAXX API URL, credentials, customer state, or internal control tower.

## Private auth checklist

Start logged out.

1. `/dashboard` redirects to `/signin`.
2. Sign-in screen says `Sign in to your private MAXX` and does not teach Hermes, ICM, MCP, models, or infrastructure.
3. Google/email controls are visible and usable at 390px mobile.
4. After valid auth in an environment where credentials are available, redirect lands on `/dashboard`.
5. An unapproved account must not gain control-plane access.

Do not claim the actual Supabase flow verified if a real permitted account was not used.

## Stacy `/dashboard` checklist

At desktop and mobile widths verify:

- MAXX avatar is visible.
- Header status is readable (`Ready`, `Limited`, `Offline`, or `Connecting`).
- `What do you need done?` is the dominant interaction.
- Four starter prompts are reachable.
- text composer works with Enter-to-send and Shift+Enter newline;
- microphone control is present; if browser speech recognition is unsupported, MAXX explains that without breaking typing;
- normal mode does not expose provider/model/tool selectors;
- `Activate MAXX Mode` changes the avatar/state and retains approval/safety copy;
- `MAXX Eyes · coming soon` is informative only and does not block launch;
- pending approval renders `MAXX needs you` with `Approve` and `Not yet`;
- failed requests never render a false `Done` state;
- `View proof` expands the receipt/routing information when available;
- History can open and close;
- Settings opens the simple second-brain page, not the technical control tower;
- advanced control is available only through the intentionally secondary path.

## Second-brain `/control/settings` checklist

- private import panel explains what the upload does in plain language;
- file picker accepts the documented export formats;
- upload progress is visible;
- status labels are `Waiting`, `Organizing`, `Ready for MAXX`, or `Needs attention`;
- no service-role/runtime key is present in browser network payloads;
- for a real test import, wait for Ready and then verify a MAXX query can point to the imported source/concept before calling the feature verified.

## PWA/mobile checklist

- `manifest.webmanifest` is requested successfully;
- service worker registers in production build;
- mobile layout has no horizontal overflow;
- composer remains reachable above safe-area/browser chrome;
- touch targets for microphone/send/mode/settings are comfortably tappable;
- do not claim Galaxy S25 installation, Android intents, or Meta-glasses behavior verified without the actual device/native client test.

## Fast smoke

For repository-local public UI work where the browser worker is configured:

```bash
npm run maxx:browser-smoke -- http://127.0.0.1:4173/
```

A smoke connection is not the full checklist.

## Completion rule

Report exact surfaces/viewports/auth paths exercised and any item that remained untestable. Browser success plus a deployment URL is not proof that backend Hermes, media, second brain, or approvals work.
