---
name: maxx-onboarding
description: Onboard a new Agent MAXX customer in plain language, then create an isolated customer context without asking them to understand Hermes, models, tools, or infrastructure.
---

# MAXX customer onboarding

Use for a new MAXX deployment or when an existing customer intentionally resets/rebuilds their operating context.

## Prime rule

The customer meets **MAXX**, not the stack underneath. Ask one question at a time. Do not present model/provider/tool configuration as onboarding work.

## Phase 1 — outcome interview

Ask only what is necessary to make the first useful missions safe:

1. What do you run, and what are you trying to make easier first?
2. What work keeps slipping, taking too long, or depending on you personally?
3. What three outcomes would make MAXX worth keeping this month?
4. What can MAXX do automatically without asking you every time?
5. What must always wait for your approval? Give examples in ordinary language if needed: spending money, publishing, sending sensitive messages, deleting data, changing accounts.
6. Who else, if anyone, should have access to this MAXX?
7. What apps/services matter most today?

Do not turn the interview into a feature inventory. Stop when the first useful operating boundary is clear.

## Phase 2 — second brain

Explain simply:

> If you already have useful history in ChatGPT, Gemini, documents, notes, or exported files, you can add it to Your second brain. MAXX organizes it privately and loads only the pieces relevant to what you're asking.

- Send the user to the private second-brain upload surface.
- Large files use the existing chunked upload/import worker.
- Imported content keeps provenance and is source material, not automatically verified fact.
- Never mix another customer's import into this customer.

## Phase 3 — connections

Discover needed integrations from the outcomes, not from a giant checklist.

For each connection record:
- what outcome it enables;
- read vs write authority;
- approval boundary;
- credential owner;
- whether it is configured, blocked, or optional.

Credentials go to the deployment/integration secret store or OAuth flow. Never ask the user to paste long-lived secrets into chat.

## Phase 4 — first proof mission

Choose one bounded real outcome that can be verified end-to-end. Prefer something useful and reversible.

Before execution internally establish:
- MODE
- OUTCOME
- TARGET
- CONSTRAINTS
- PROOF
- COMMERCIAL VALUE
- AUTHORITY
- ROLLBACK

The customer should not have to fill out that structure.

## Phase 5 — handoff

Persist only durable customer context needed for future work. Keep personal/private/customer data isolated to this MAXX deployment.

A successful onboarding ends with a sentence the customer can understand, for example:

> MAXX is ready for website follow-up, content preparation, and lead research. Publishing and spending still require your approval. Your old AI exports are organizing in Your second brain.

## Stop conditions

Stop and surface one concise blocker when:
- the requested connection requires unavailable OAuth/credentials;
- the user has not authorized a consequential action;
- an identity/account ownership ambiguity exists;
- imported data appears to belong to another person/customer;
- the first mission cannot be verified safely.

Do not block onboarding merely because optional MAXX Eyes/native Android features are not installed.
