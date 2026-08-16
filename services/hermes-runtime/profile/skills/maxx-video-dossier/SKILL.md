---
name: maxx-video-dossier
description: Turn a public video/channel source into a reusable evidence-backed content-pattern dossier using MAXX web/browser tools rather than repo-local npm scripts.
---

# MAXX video dossier

Use when the user wants a channel/video source analyzed into repeatable hooks, topic clusters, pacing, visual motifs, and concrete production instructions.

## Principle

Treat the source as a pattern library, not a one-off summary. Produce an artifact another agent/model can use without redoing the research.

## Tool path

Prefer, in order:
1. authoritative/public structured source data available through a connected API or research tool;
2. Hermes web/browser tools for the public source;
3. remote browser/CDP when the page requires rendered inspection.

Do not assume the `macs-agent-portal` npm workspace exists inside the runtime. This skill must work from the packaged Hermes profile.

## Workflow

1. Confirm the source URL/channel and intended use of the analysis.
2. Collect a representative recent set—target up to 30 accessible uploads unless the user requests another range.
3. Preserve available evidence per item: title, URL, duration, publish time/age, views/engagement where visible, and source retrieval date.
4. Cluster recurring:
   - opening hooks;
   - problem/benefit frames;
   - topic families;
   - title structures;
   - pacing/segment length;
   - visual motifs/edit patterns;
   - CTA patterns.
5. Distinguish observed facts from inference. Do not invent views, durations, upload dates, or visual details that were not inspected.
6. Convert the patterns into `copy / adapt / avoid` guidance tied to the user's brand/outcome.
7. Write a durable Markdown dossier to the mission workspace or return a structured artifact if no writable workspace is available.
8. If the dossier will drive a public campaign, run the resulting creative brief through the relevant taste/truth/privacy review before production.

## Minimum dossier

```text
# Source dossier
## Source and retrieval evidence
## Recent upload table
## Repeated hooks
## Topic clusters
## Pacing/edit patterns
## Visual motifs
## Audience/CTA patterns
## What MAXX should copy
## What MAXX should adapt
## What MAXX should avoid
## Uncertainties / unavailable data
## Reusable production instructions
```

## Stop conditions

Stop or narrow the claim if:
- the source is private/auth-locked and no authorized credential exists;
- the browser/research tool cannot inspect enough of the source to support the requested conclusion;
- metadata is incomplete and no second source can verify it;
- the requested copying would amount to reproducing protected content rather than extracting high-level patterns.

## Completion proof

A dossier is `TESTED` when the artifact exists and its source rows can be traced to inspected URLs/data. It is `VERIFIED` for production use only after a separate reviewer can understand the pattern instructions and confirm they match the evidence without needing the builder's hidden context.
