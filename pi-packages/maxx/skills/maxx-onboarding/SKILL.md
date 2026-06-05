---
name: maxx-onboarding
description: Runs the first-session MAXX setup interview in plain language, captures answers one at a time, and writes a resumable local handoff note before implementation begins.
---

# MAXX Onboarding

Use this skill when a non-technical person needs Agent MAXX to set up a project, offer, site, workflow, or agent lane without learning internal tool names first.

## Operating Rule

Ask one question at a time. Do not explain the implementation stack before the human has described the outcome they want.

## Interview Flow

Ask these in order, waiting for the answer before moving on:

1. Who is this agent for first: you, a client, or a public user?
2. What should the agent be able to set up on its own without you touching code?
3. What should the agent never ask the user to understand?
4. What should happen automatically on first run?
5. What should happen only after approval?
6. Should the agent feel like a concierge, a teacher, an operator, or a coach?
7. What is the single most important success condition for the first release?
8. Should the setup experience be text-first, browser-first, or both?
9. What should the first screen say in plain language?
10. What does the SeedDance car intro need to communicate?
11. Do you want the car intro as a still reveal, a motion clip, or both?
12. Which assets are approved to ship, and which are reference-only?

## Wording Standard

- Use outcome language.
- Avoid internal labels until the answer requires them.
- Prefer short questions over explanations.
- If the answer is vague, ask one narrowing follow-up.
- If the answer creates risk, name the risk and ask for approval before continuing.

## Handoff Note

After the interview, write a local note to:

`ops/reports/MAXX-ONBOARDING-HANDOFF.md`

Include:

- date
- each question and answer
- assumptions made
- approval-only actions
- automatic first-run actions
- approved assets
- blocked or unknown items
- recommended next implementation slice

## Stop Conditions

Pause before implementation if:

- the human has not identified approved shipping assets
- the setup would require credentials or secrets
- the requested automatic action would write to production systems
- the user asks for payment, deploy, or account creation without explicit approval

## Systems Note

This is an LP4 information-flow intervention: it turns vague setup intent into a structured handoff before code or automation changes are made.
