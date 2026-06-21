---
name: maxx-opusclip
description: Operate the Agent Maxx OpusClip backend bridge for turning owned or licensed long-form videos into short clips, transcripts, public shares, social copy, publish or schedule tasks, thumbnails, and safe edit jobs. Use when the task mentions OpusClip, clip generation, video-to-short workflows, posting clips, scheduling clips, video transcripts, clip collections, or MAXX media execution.
---

# MAXX OpusClip

Use this skill for backend-only OpusClip work. Do not edit frontend surfaces unless the user separately asks for UI work.

## Required Safety Gates

1. Never hardcode or print `OPUSCLIP_API_KEY`.
2. Before creating a project, print this notice exactly:
   `Using video you don't own may violate copyright laws. By continuing, you confirm this is your own original content.`
3. Require `--confirm-owned` for project submission.
4. Require `--confirm-publish` before live publishing.
5. Require `--confirm-schedule` before scheduling or canceling scheduled posts.
6. Require `--confirm-cost` before thumbnail generation.
7. Require `--confirm-edit-cost` before server-side edit or censor jobs.
8. Stop if the action would loop over publish, schedule, edit, or cost-bearing commands without fresh user approval.

## Commands

Run from the repo root:

```bash
npm run maxx:opusclip -- --help
npm run maxx:opusclip -- usage
npm run maxx:opusclip -- templates
npm run maxx:opusclip -- submit --url "https://youtube.com/watch?v=..." --durations "30,60,90" --confirm-owned
npm run maxx:opusclip -- list
npm run maxx:opusclip -- list --project PROJECT_ID
npm run maxx:opusclip -- describe --project PROJECT_ID --clip CLIP_ID
npm run maxx:opusclip -- transcript --project PROJECT_ID
npm run maxx:opusclip -- share --project PROJECT_ID
npm run maxx:opusclip -- accounts
npm run maxx:opusclip -- generate-copy --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --prompt "short prompt"
npm run maxx:opusclip -- publish --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --title "Title" --confirm-publish
npm run maxx:opusclip -- schedule --project PROJECT_ID --clip CLIP_ID --account ACCOUNT_ID --title "Title" --at 2026-06-30T15:00:00Z --confirm-schedule
```

## Workflow

1. Verify the environment has `OPUSCLIP_API_KEY` without displaying the value.
2. Use `usage` before large submissions to check account limits.
3. Use `submit` only for owned or licensed video sources.
4. Use `list --project` to retrieve exportable clips after processing.
5. Use `describe` or `transcript` to inspect content before suggesting publication.
6. Use `generate-copy` before `publish` or `schedule`.
7. Record material outputs in `ops/reports/` without storing secrets.

## Failure Handling

- Missing key: tell the user to configure `OPUSCLIP_API_KEY` in runtime env.
- 429: respect the rate limit and retry later.
- 403: report likely plan or capability limitation.
- 503 on thumbnails: report that the experimental capability may be disabled upstream.
