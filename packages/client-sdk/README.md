# @maxx/client-sdk

Typed HTTP client for the MAXX control plane API (`services/maxx-control-plane`). For external systems integrating with MAXX — the bundled dashboard uses `src/services/controlTowerApi.ts` directly against the Supabase browser session instead of this package.

## Install

This package is not yet published. Reference it locally:

```json
{ "dependencies": { "@maxx/client-sdk": "file:../macs-agent-portal/packages/client-sdk" } }
```

## Usage

```typescript
import { MaxxClient } from "@maxx/client-sdk";

const client = new MaxxClient({
  baseUrl: "https://your-control-plane.example.com",
  getToken: async () => getSupabaseAccessToken(), // any Supabase-issued JWT for an allowlisted operator
});

const chat = await client.chat({ message: "Summarize this week's donor activity" });
console.log(chat.text, chat.model, chat.routingReason);

const mission = await client.createMission("Draft a Q3 donor recap for the board");
await client.updateMissionStatus(mission.id, "ready");

const strategy = await client.setStrategy({ riskTolerance: "conservative" });

const { results } = await client.searchMemory("donor churn");
```

## Error handling

Every method throws `MaxxApiError` on a non-2xx response, with `status` (HTTP status code) and `body` (the parsed JSON error response, if any):

```typescript
import { MaxxApiError } from "@maxx/client-sdk";

try {
  await client.chat({ message: "..." });
} catch (error) {
  if (error instanceof MaxxApiError && error.status === 429) {
    console.log("Rate limited, retry after", (error.body as { retryAfterSeconds: number }).retryAfterSeconds);
  }
}
```

## Methods

| Method | Route |
|---|---|
| `chat(input)` | `POST /v1/chat` |
| `createMission(objective)` | `POST /v1/missions` |
| `updateMissionStatus(id, status)` | `PATCH /v1/missions/:id` |
| `approveAction(id)` / `rejectAction(id)` | `POST /v1/approvals/:id/approve\|reject` |
| `runSkill(id, input)` | `POST /v1/skills/:id/run` |
| `startBrowserAction(action, target)` | `POST /v1/browser/sessions` |
| `startHermesRun(input)` | `POST /v1/hermes/runs` |
| `getHermesRun(id)` / `cancelHermesRun(id)` | `GET /v1/hermes/runs/:id`, `POST .../cancel` |
| `getStrategy()` / `setStrategy(input)` | `GET`/`PUT /v1/strategy` |
| `searchMemory(query, limit?)` | `GET /v1/memory/search` |
| `listSchedulerJobs()` | `GET /v1/scheduler/jobs` |
| `getUsageSummary()` | `GET /v1/usage/summary` |

Routes gated behind a feature flag (Hermes, memory, browser, scheduler) return a 503 with a `reason` field when the corresponding `MAXX_*_ENABLED` flag is off — this SDK does not hide that, it surfaces the response as-is.

## Development

```sh
npm install
npm run typecheck
npm run test    # unit tests against a fake fetch
npm run build
```

Verified against a real running control plane during development (not just the fake-fetch unit tests) — every method in the table above was exercised end-to-end against `services/maxx-control-plane` with `MAXX_DEV_AUTH_BYPASS=true`.
