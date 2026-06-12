---
name: maxx-video-dossier
description: Turns a public YouTube channel or video source into a Markdown briefing that captures the latest uploads, recurring hooks, topic clusters, pacing, visual motifs, and clear instructions for how Agent MAXX should adapt the pattern.
---

# MAXX Video Dossier

Use this skill when the user wants to turn a public video source into a reusable analysis artifact for another model.

## Operating Rule

- Use Firecrawl for source discovery and the remote Browser API for verification.
- Use `MAXX_BROWSER_WS_ENDPOINT` as the only browser transport.
- Do not rely on a local browser binary.
- Write the result to a Markdown file so it can be reused, shared, and downloaded.

## Default Workflow

1. Smoke test the remote browser if needed:

```bash
npm run maxx:browser-smoke -- http://127.0.0.1:4173/
```

2. Generate the dossier:

```bash
npm run maxx:video-dossier -- --source https://www.youtube.com/@stefan_3d_ai/videos --out ops/reports/MAXX-STEFAN-3D-AI-DOSSIER.md
```

3. Review the Markdown output and convert the strongest patterns into a reusable skill, dashboard action, or front-page behavior.

## What the Dossier Must Include

- The latest 30 uploads from the source.
- Title, duration, views, published age, and URL where available.
- Recurring hook patterns.
- Topic clusters and repeated terms.
- Pacing notes.
- Visual motifs.
- What MAXX should copy.
- What MAXX should avoid.

## How to Think About the Result

- Treat each video source as a pattern library, not a one-off summary.
- Identify the repeatable structure that makes the channel work.
- Convert that structure into instructions another model can follow.
- Keep the output outcome-first, concrete, and reusable.

## Stop Conditions

- Stop if the remote browser endpoint is missing.
- Stop if Firecrawl is unavailable and no fallback path can recover the source list.
- Stop if the source is private, auth-locked, or cannot be reached without credentials.
- Stop if the dossier would be vague enough that another model could not reuse it.
