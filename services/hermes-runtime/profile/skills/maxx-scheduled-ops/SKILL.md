---
name: maxx-scheduled-ops
description: Create, inspect, pause, resume, and remove recurring MAXX work through Hermes cron only after the recurrence, cost envelope, and approval boundary are clear.
---

# MAXX scheduled operations

Use when the customer says things like `every morning`, `each Friday`, `keep checking`, `send me a weekly report`, or explicitly asks MAXX to run work later without keeping the chat open.

Hermes cron is the scheduler. Do not create a second scheduler merely for MAXX.

## Default safety posture

A new MAXX deployment has **no paid recurring agent jobs enabled by default**. This is intentional. Scheduled LLM/tool work can create recurring costs and side effects.

Create a recurring job only when the customer has clearly requested the recurrence or an approved onboarding policy already covers it.

## Before creating a job

Internally establish:

- outcome;
- schedule/timezone;
- expected model/tool route;
- expected cost or budget ceiling where material;
- whether each run is read-only, prepares a draft, or performs an external mutation;
- what requires `Needs you` approval;
- notification behavior;
- stop condition/end date if any;
- proof expected from each run.

Ask one short question only when a missing item changes safety or the requested result.

## Scheduling rule

Use the current installed Hermes cron capability/API/CLI. Before writing a command against a newly updated Hermes revision, read the matching current Hermes cron documentation/help rather than assuming an older syntax.

## Safe recurring examples

- summarize new leads each weekday morning;
- check website health and report only meaningful failures;
- prepare a weekly content plan as a draft;
- review outstanding approvals/follow-ups;
- research new local opportunities and queue recommendations.

## Consequential recurring work

Recurring jobs may prepare public posts, emails, deploy plans, purchases, or account changes, but execution remains subject to the same approval/authority policy as an interactive mission. A cron schedule is timing authority, not blanket business authority.

## Cost guard

Prefer FAST/low-cost routes for simple periodic checks. Escalate to STANDARD or POWER only when the task requires it. Stop or surface a blocker if repeated failures/no-progress states would cause waste.

Never create a hidden recurring job merely because it might be useful.

## User-facing confirmation

After creating or changing a schedule, tell the customer in plain language:

- what MAXX will do;
- when it runs;
- what it can do automatically;
- what still waits for approval;
- how to stop it.

Do not expose cron syntax unless asked.
