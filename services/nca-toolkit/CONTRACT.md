# MAXX media gateway contract

The No-Code Architects Toolkit is a **media execution service**, not an agent brain and not a customer-facing API.

## Allowed role

Hermes may use this service through a MAXX skill for bounded media operations such as:

- transcribe/translate media;
- inspect metadata;
- convert audio/video;
- caption, cut, trim, split, concatenate video;
- extract thumbnails;
- compose controlled FFmpeg jobs;
- create webpage screenshots where policy allows it.

## Security boundary

- Store `NCA_TOOLKIT_API_KEY` only in server/runtime secrets.
- Send it only server-to-server as `x-api-key`.
- Do not expose NCA directly to the browser, public landing page, CLI consumer, MCP consumer, or phone client.
- `/v1/code/execute/python` is excluded from the MAXX product allowlist. If a future internal workflow requires arbitrary Python, use a separately sandboxed worker and explicit policy rather than widening this gateway.
- Media URLs may contain customer information. Do not log full signed URLs or credentials.

## Job behavior

Long media operations should use the toolkit's job/webhook pattern when available. Hermes remains responsible for mission state, timeouts, retries, evidence and user-facing status.

## Proof

A media operation is complete only when the resulting asset exists, is readable, and satisfies the requested media condition. A toolkit 2xx response alone is not final proof.
