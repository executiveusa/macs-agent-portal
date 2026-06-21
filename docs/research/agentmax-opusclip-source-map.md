# Agent Maxx OpusClip Source Map

## Reference Repo

- Source: `https://github.com/opus-pro/opus-skills.git`
- Local ignored mirror: `_reference/repos/opus-skills`
- Checked commit: `20b4b10d1dc635b15b47de90e4ae0e8bb4113efd`
- License observed: MIT

## Files Read

- `README.md`
- `LICENSE`
- `skills/opusclip/SKILL.md`
- `skills/opusclip/scripts/opusclip`
- `skills/opusclip/references/api-reference.md`
- `skills/opusclip/references/editing-script.md`

## Extracted API Patterns

- Base URL: `https://api.opus.pro/api`
- Auth: `Authorization: Bearer <OPUSCLIP_API_KEY>`
- Project create: `POST /clip-projects`
- Project list: `GET /clip-projects?q=mine`
- Clips by project: `GET /exportable-clips?q=findByProjectId&projectId=...`
- Transcript: `GET /transcripts?q=findByProjectId&projectId=...`
- Templates: `GET /brand-templates?q=mine`
- Public share: `POST /clip-projects/{projectId}/update-visibility`
- Social accounts: `GET /social-accounts?q=mine`
- Social copy: `POST /social-copy-jobs`, `GET /social-copy-jobs/{jobId}`
- Publish: `POST /post-tasks`
- Schedule: `POST /publish-schedules`, `DELETE /publish-schedules/{scheduleId}`
- Thumbnail: `POST /generative-jobs`, `GET /generative-jobs/{jobId}`
- Censor/edit: `POST /censor-jobs`, `GET /censor-jobs/{jobId}`
- Usage: `GET /api-usage?q=mine`

## MAXX Interpretation

OpusClip is a media execution backend, not a frontend dependency. Agent Maxx should use it after source intake and content reasoning, then return structured clips, transcripts, copy, and publish options for approval.

## Safety Notes

- Require owned/licensed source confirmation before `submit`.
- Treat publish, schedule, thumbnail, and server-side edits as gated actions.
- Keep the reference clone ignored and do not vendor upstream code into runtime.
