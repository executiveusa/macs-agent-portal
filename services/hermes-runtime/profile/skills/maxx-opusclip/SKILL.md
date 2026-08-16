---
name: maxx-opusclip
description: Create and inspect OpusClip projects from customer-owned video using the OpusClip API directly from the private MAXX runtime; publishing/scheduling stays approval-gated.
---

# MAXX OpusClip

Use when the user explicitly wants OpusClip or when its curation workflow is materially better than the general NCA media edge.

## Runtime contract

Required:
- `OPUSCLIP_API_KEY`

Optional:
- `OPUSCLIP_BASE_URL` (default `https://api.opus.pro/api`)

This skill runs from Hermes using its normal HTTP/terminal capability. Do not depend on the `macs-agent-portal` npm workspace being present in the runtime.

Authenticate every request with:

```text
Authorization: Bearer <OPUSCLIP_API_KEY>
Accept: application/json
Content-Type: application/json
```

Never print or persist the key.

## Ownership gate

Before creating a project from a supplied video URL, make sure the user is authorized to process the source. If ownership/permission is genuinely ambiguous and matters, ask one short question rather than silently ingesting third-party copyrighted media.

## Core API operations

Base: `${OPUSCLIP_BASE_URL:-https://api.opus.pro/api}`

### Usage / credits
`GET /api-usage?q=mine`

Use before a potentially costly batch when remaining credits/cost matter.

### Create clip project
`POST /clip-projects`

Minimal payload:

```json
{
  "sourceUri": "https://...",
  "curationPref": {
    "clipDurations": [30, 60, 90],
    "aspectRatio": "portrait",
    "model": "ClipBasic"
  }
}
```

Optional fields include `curationPref.prompt`, `curationPref.keywords`, selected ranges, brand template, language, genre, title, webhook, filler-word removal, and skip-curate when the mission needs them.

### Inspect project/outputs
- `GET /clip-projects?q=mine&page=0&pageSize=20`
- `GET /exportable-clips?q=findByProjectId&projectId=<id>`
- `GET /transcripts?q=findByProjectId&projectId=<id>`
- `GET /brand-templates?q=mine`

### Social support
- `GET /social-accounts?q=mine`
- `POST /social-copy-jobs`
- `GET /social-copy-jobs/<jobId>`

### Publish / schedule
- `POST /post-tasks`
- `POST /publish-schedules`
- `DELETE /publish-schedules/<scheduleId>`

Publishing, scheduling, cancellation of a scheduled public post, or changes to connected public accounts are consequential actions. Route them through the MAXX approval policy; never treat possession of the Opus credential as publication authority.

## Workflow

1. Confirm the desired outcome, source authorization, target platform/aspect, and any required clip length/topic constraints.
2. Check usage when the operation could consume meaningful credits.
3. Create the smallest project that satisfies the request.
4. Poll/inspect clips rather than claiming success from the creation response.
5. Review the actual candidate clip metadata/transcript and, where visual quality matters, send the produced media through an independent review path.
6. Prepare caption/social copy if requested.
7. Stop at the owner approval gate before public publish/schedule unless a narrow pre-approved publication policy explicitly covers the action.
8. Return project/clip IDs, produced asset references, cost/usage evidence when available, and the next material action.

## Failure behavior

- 401/403: treat as credential/permission blocker; do not retry blindly.
- 429: honor Retry-After or bounded backoff.
- repeated 5xx/network failure: stop after bounded retries and preserve the project/job id if one was already created.
- do not create duplicate projects merely because polling failed.
