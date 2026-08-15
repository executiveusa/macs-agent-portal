---
name: maxx-second-brain
description: Query the customer's imported second brain from portable ICM + Open Knowledge Format bundles without context stuffing.
---

# MAXX second brain

Customer knowledge bundles are mounted read-only at:

`/opt/data/maxx-icm/second-brain/`

Each successful import has:

- `CONTEXT.md` — stage contract;
- `index.md` — progressive-disclosure catalog;
- `_catalog/catalog.json` — machine-readable source/concept map;
- `knowledge/sources/*.md` — Open Knowledge Format compatible markdown concepts;
- `sources/` — immutable reconstructed source snapshot.

## Query workflow

1. Identify the relevant customer/user bundle from the mission context. Never mix one customer's bundle into another customer's answer.
2. Read only that bundle's `CONTEXT.md` and `index.md` first.
3. Search `_catalog/catalog.json`, filenames, titles, tags, and concept bodies for the user's topic.
4. Load only the smallest relevant `knowledge/` concepts.
5. Treat imported claims as source material, not automatically verified fact. Preserve the source path/resource in answers or derived knowledge when provenance matters.
6. If the answer requires current external facts, verify them independently rather than assuming an old export is current.
7. New curated/deduced knowledge belongs in a separate durable working/curated area; do not rewrite the immutable import snapshot.

## Privacy

Do not search across customer directories unless the explicit authorized mission is cross-customer administration. Never expose another customer's imported context.

## Output

Return the requested answer/action plus the specific source concepts/paths used when the user asks for proof or the claim materially affects a decision.
