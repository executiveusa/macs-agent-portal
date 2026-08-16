---
name: maxx-social-postiz
description: Prepare, draft, schedule, and inspect social posts through the Postiz public API while keeping public publishing approval-gated.
---

# MAXX social publishing via Postiz

Use when the customer wants social content prepared, drafted, scheduled, or published and a Postiz connection is configured.

## Runtime contract

Required:
- `POSTIZ_API_KEY`

Optional:
- `POSTIZ_BASE_URL` (default `https://api.postiz.com/public/v1`)

Authenticate server-to-server with:

```text
Authorization: <POSTIZ_API_KEY>
Content-Type: application/json
```

Never expose the credential to the browser/user or durable evidence logs.

## Current public API surface used by MAXX

Read current Postiz public API docs before a consequential call. The stable operations MAXX relies on are:

- `GET /integrations` — list connected social integrations/accounts;
- `POST /posts` — create a draft, scheduled post, or immediate post according to the current API schema;
- `GET /posts` — inspect existing post records where needed;
- media upload endpoints only when the current Postiz API documentation confirms the required payload for the target network.

Do not guess network-specific settings. Fetch the current integration record and current API schema first.

## Approval policy

MAXX may automatically:
- research/plan a campaign;
- create copy/media drafts;
- inspect connected integrations;
- prepare a proposed schedule;
- create a Postiz **draft** when the API supports a non-public draft state and the mission authorizes it.

MAXX must stop at `Needs you` before:
- publishing immediately;
- scheduling a post that will become public later;
- cancelling/rescheduling an already approved public post when that materially changes a campaign;
- connecting/disconnecting social accounts;
- posting sensitive, legal, health, financial, political, or reputation-sensitive claims unless the explicit policy for that customer permits it.

A future customer policy may grant a narrow pre-approved publishing envelope, but possession of `POSTIZ_API_KEY` alone is never publication authority.

## Workflow

1. Determine the campaign outcome, audience, platforms, dates, source facts, and brand constraints.
2. Interview the customer for missing material facts instead of inventing them.
3. Run content through the relevant truth/taste/privacy review.
4. `GET /integrations` and resolve the exact intended account IDs.
5. Build the current Postiz request payload from the live API documentation and integration requirements.
6. For drafts, create only the non-public draft state.
7. For schedule/publish, create the MAXX approval receipt first; execute only after valid approval.
8. Re-read the resulting post record / provider result and return its ID/status as evidence.
9. Never say `Done` merely because Postiz accepted a request; distinguish draft, scheduled, published, failed, and partially delivered states.

## Failure behavior

- 401/403: credential/permission blocker; do not retry blindly.
- 429: bounded backoff respecting provider guidance.
- validation error: inspect current API/network-specific schema and fix the payload; do not loop the same request.
- partial multi-network failure: report each network separately and preserve successful post IDs; do not silently duplicate successful posts during retry.
