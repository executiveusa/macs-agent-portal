# OpusClip Environment

## Required Runtime Variable

- `OPUSCLIP_API_KEY`: OpusClip bearer token. Store it in the runtime provider vault, not in source.

## Optional Runtime Variables

- `OPUSCLIP_BASE_URL`: API base override. Defaults to `https://api.opus.pro/api`.
- `MAXX_OPUSCLIP_DEFAULT_DURATIONS`: comma-separated clip targets. Defaults to `30,60,90`.
- `MAXX_OPUSCLIP_DEFAULT_MODEL`: defaults to `ClipBasic`.
- `MAXX_OPUSCLIP_DEFAULT_ASPECT`: defaults to `portrait`.

## Verification

```bash
npm run maxx:opusclip -- --help
npm run maxx:opusclip -- usage
```

If the key is missing, `usage` exits non-zero with a clear missing-key message and makes no network call.

## Secret Handling

- Do not commit `.env` files.
- Do not paste the key into docs, tickets, chat, or ops reports.
- If a key is exposed, rotate it before continuing live API work.
