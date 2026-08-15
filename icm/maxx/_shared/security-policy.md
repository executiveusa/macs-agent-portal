# MAXX security and credential policy

1. No real secret is committed to Git. `.env`, runtime tokens, service-role keys, provider keys, OAuth tokens, private keys, and customer exports belong in deployment secret stores or isolated runtime volumes.
2. The previously tracked root `.env` is removed without reading or reproducing its contents. If it ever contained live credentials, rotate them before production release.
3. Browser/PWA users authenticate through Supabase. Machine clients use a dedicated MAXX API credential. Hermes has a separate internal API credential known only to the control plane/runtime deployment.
4. Never expose the Hermes API key, Supabase service-role key, NCA Toolkit key, browser/CDP secret, or customer provider keys to browser JavaScript.
5. MAXX API credential access is least-privilege infrastructure access; rotate/revoke independently per deployment.
6. Production mutations, public publishing, destructive actions, permission changes, material spending, and sensitive communications remain approval/policy gated.
7. NCA Toolkit's arbitrary Python execution capability is not a customer-facing tool. If enabled internally, require an explicit allowlist/policy and isolated execution boundary.
8. MAXX Eyes uploads/captures are sensitive by default. Do not persist frames/audio unless a mission explicitly requires retention and the retention policy is known.
9. Logs redact authorization headers and secret-bearing fields. Evidence stores references/results, not credentials.
10. Every customer MAXX instance gets isolated runtime data, memory, sessions, and credentials.
