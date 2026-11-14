# Agent MAXX — client source registry

This is the **operator-confirmed list of client names**, not a claim that any other repository, Supabase project, POS, CRM or credentials are connected. Names alone confer no authorization.

| Client | Canonical repository | Database / schema | Authorized business records | Read-only proof source | Live tool access |
|---|---|---|---|---|---|
| CROWN AND CORE | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |
| THP FLOORING | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |
| BUNNA RESTAURANT | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |
| MACS DIGITAL MEDIA | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |
| ASC3ND | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |
| 3X PLUMBERS | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |
| TANGLES AND LOCS | **UNVERIFIED — owner to identify** | **UNVERIFIED** | **NOT CONNECTED** | **UNKNOWN** | **DISABLED** |

## Identity and connection protocol

1. Owner supplies the exact repo URL for each named client (or says NONE), not an inferred match from name similarity.
2. Verify repository ownership, branch, deploy, primary database, secrets custodian, domain and existing client records without copying secrets into GitHub.
3. Bind a named client to an explicit existing `maxx.projects.id` and verify its `organization_id`, active operator `maxx.memberships` and exact client `maxx.project_memberships` before data access.
4. Verify the provider connector's least-privilege scopes and record a timestamped source/receipt; tenant context must survive chat→control plane→MCP/ICM task→response→source proof.
5. Add an agent tool to that client's authorized capabilities **only after** a known-good read-only test, negative cross-tenant test, owner-controlled revocation path and audit record.
6. Never default to a similarly named repo, a shared unrelated Supabase schema, user-provided URL authority, or the previous client selected in chat.

## Defaults

No data is imported, no account can auto-enroll itself from an email string and no external Instinct worker can acquire unrestricted MAXX credentials. The seven display labels and task prompts already exist in draft code. Actual record access remains off until the project-level migration and membership checks are approved.
