---
name: maxx-second-brain
description: Query and curate the customer's durable second brain from portable ICM + Open Knowledge Format bundles, with an Obsidian-compatible working vault for human-readable memory.
---

# MAXX second brain

MAXX has two complementary memory surfaces on the same durable ICM volume.

## 1. Immutable imported source bundles

Customer knowledge bundles are mounted read-only at:

`/opt/data/maxx-icm/second-brain/`

Each successful import has:

- `CONTEXT.md` — stage contract;
- `index.md` — progressive-disclosure catalog;
- `_catalog/catalog.json` — machine-readable source/concept map;
- `knowledge/sources/*.md` — Open Knowledge Format compatible markdown concepts;
- `sources/` — immutable reconstructed source snapshot.

Imported source material is evidence. Do not rewrite it.

## 2. Stacy's live Obsidian-compatible working vault

The production installer seeds a live markdown vault at:

`/opt/data/maxx-icm/second-brain/stacy-vault/`

The same path appears inside the control-plane container as:

`/data/maxx/second-brain/stacy-vault/`

It is ordinary markdown and can be opened or synchronized with Obsidian without making Obsidian the source of truth.

Default structure:

- `HOME.md`
- `00-Inbox/`
- `10-People/`
- `20-Companies/`
- `30-Projects/`
- `40-Meetings/`
- `50-Decisions/`
- `60-Playbooks/`
- `70-Reference/`
- `90-Archive/`

Use Obsidian-style `[[links]]` when they make a relationship clearer.

## Query workflow

1. Identify the relevant customer/user bundle from the mission context. Never mix one customer's bundle into another customer's answer.
2. Read only that bundle's `CONTEXT.md` and `index.md` first.
3. Search `_catalog/catalog.json`, filenames, titles, tags, and concept bodies for the user's topic.
4. Load only the smallest relevant `knowledge/` concepts.
5. Also inspect Stacy's live vault when the question concerns an active relationship, project, meeting, decision, playbook, or recent operating context.
6. Treat imported claims as source material, not automatically verified fact. Preserve the source path/resource when provenance materially affects a decision.
7. If the answer requires current external facts, verify them independently rather than assuming an old export is current.

## Curating the live vault

Write to the live vault when durable business memory would reduce future re-explanation, especially:

- a decision was made;
- a person/company relationship materially changed;
- a project reached a new state;
- a meeting produced commitments or follow-ups;
- a repeatable process became clear;
- an imported fact was promoted into a curated operating note.

Prefer small atomic notes over dumping transcripts.

When promoting knowledge from an immutable import, include provenance such as:

```yaml
---
source: imported-bundle/path/to/source
source_kind: imported
updated: 2026-08-22
---
```

Do not copy secrets, access tokens, private keys, passwords, session cookies, or raw provider credentials into markdown notes.

## Bot/Pup memory boundaries

Pups may read the same authorized Stacy business vault, but each Pup keeps its own Hermes session identity and role context. A Pup must not silently rewrite another Pup's role, objective, or permissions through a memory note.

Shared facts belong in the vault. Pup-specific temporary reasoning belongs in that Pup's own session/run evidence.

## Privacy

Do not search across customer directories unless the explicit authorized mission is cross-customer administration. Never expose another customer's imported context.

## Output

Return the requested answer/action plus the specific source concepts/paths used when the user asks for proof or the claim materially affects a decision.
