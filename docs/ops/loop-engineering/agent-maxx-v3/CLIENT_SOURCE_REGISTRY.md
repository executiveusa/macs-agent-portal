# Agent MAXX — client source registry

This is the **operator-confirmed list of client names**, not a claim that any other repository, Supabase project, POS, CRM or credentials are connected. Names alone confer no authorization.

| Client | Canonical repository | Database / schema | Authorized business records | Read-only proof source | Live tool access |
|---|---|---|---|---|---|
| CROWN AND CORE | **CANDIDATES:** [crownandcorestarnet](https://github.com/executiveusa/crownandcorestarnet), [crown-and-core](https://github.com/executiveusa/crown-and-core). Primary source **NOT CONFIRMED** | **UNVERIFIED** | **NOT CONNECTED** | GitHub repository metadata only | **DISABLED** |
| THP FLOORING | **NO VERIFIED MATCH** in accessible GitHub search; owner must provide exact repository or NONE | **UNVERIFIED** | **NOT CONNECTED** | No matching installed repository identified | **DISABLED** |
| BUNNA RESTAURANT | **CANDIDATES:** [bunna-smart-site](https://github.com/executiveusa/bunna-smart-site), [bunna-marketing-workspace](https://github.com/executiveusa/bunna-marketing-workspace). Roles and authorization **NOT CONFIRMED** | **UNVERIFIED** | **NOT CONNECTED** | GitHub repository metadata only | **DISABLED** |
| MACS DIGITAL MEDIA | **CANDIDATE:** [macsdigitalmedia](https://github.com/executiveusa/macsdigitalmedia) (public website, not MAXX control plane). Scope **NOT CONFIRMED** | **UNVERIFIED** | **NOT CONNECTED** | GitHub repository metadata only | **DISABLED** |
| ASC3ND | **CANDIDATES:** [asc3nd-brand-site](https://github.com/executiveusa/asc3nd-brand-site), [asc3nd-frontend-website-](https://github.com/executiveusa/asc3nd-frontend-website-). Primary source **NOT CONFIRMED** | **UNVERIFIED** | **NOT CONNECTED** | GitHub repository metadata only | **DISABLED** |
| 3X PLUMBERS | **NO VERIFIED MATCH** in accessible GitHub search; owner must provide exact repository or NONE | **UNVERIFIED** | **NOT CONNECTED** | No matching installed repository identified | **DISABLED** |
| TANGLES AND LOCS | **NO VERIFIED MATCH** in accessible GitHub search; owner must provide exact repository or NONE | **UNVERIFIED** | **NOT CONNECTED** | No matching installed repository identified | **DISABLED** |

## Identity and connection protocol

1. Owner supplies the exact repo URL for each named client (or says NONE), not an inferred match from name similarity.
2. Verify repository ownership, branch, deploy, primary database, secrets custodian, domain and existing client records without copying secrets into GitHub.
3. Bind a named client to an explicit existing `maxx.projects.id` and verify its `organization_id`, active operator `maxx.memberships` and exact client `maxx.project_memberships` before data access.
4. Verify the provider connector's least-privilege scopes and record a timestamped source/receipt; tenant context must survive chat→control plane→MCP/ICM task→response→source proof.
5. Add an agent tool to that client's authorized capabilities **only after** a known-good read-only test, negative cross-tenant test, owner-controlled revocation path and audit record.
6. Never default to a similarly named repo, a shared unrelated Supabase schema, user-provided URL authority, or the previous client selected in chat.

## Defaults

No data is imported, no account can auto-enroll itself from an email string and no external Instinct worker can acquire unrestricted MAXX credentials. The seven display labels and task prompts already exist in draft code. Actual record access remains off until the project-level migration and membership checks are approved.

## Repository discovery checkpoint — 2026-11-16

The linked GitHub installation was queried for each named client and matching repositories had owner, default-branch and visibility metadata checked. **Discovery is not a binding or authorization.** No secrets, client records or databases were accessed by these searches. This is a reviewable candidate register: operators must confirm which repository, if any, is authoritative; which production domain/database it belongs to; and whether MAXX may access it. Matching a familiar brand or repository name cannot grant access. Canonical client-to-repo mappings remain blocked pending review. Database and external tool access remains disabled.
