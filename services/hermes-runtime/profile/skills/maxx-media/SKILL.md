---
name: maxx-media
description: Use the private NCA Toolkit edge for bounded media processing such as transcription, metadata, conversion, captions, cuts, thumbnails, and composition.
---

# MAXX media execution

Use this skill only when the mission needs media processing.

## Runtime contract

Required environment:
- `NCA_TOOLKIT_URL`
- `NCA_TOOLKIT_API_KEY`

Authenticate server-to-server with `x-api-key`. Never print the key or expose it to the customer.

## Allowed endpoint families

- `/v1/audio/*`
- `/v1/ffmpeg/compose`
- `/v1/image/convert/video`
- `/v1/image/screenshot/webpage`
- `/v1/media/convert*`
- `/v1/media/transcribe`
- `/v1/media/silence`
- `/v1/media/metadata`
- `/v1/video/caption`
- `/v1/video/concatenate`
- `/v1/video/thumbnail`
- `/v1/video/cut`
- `/v1/video/split`
- `/v1/video/trim`
- `/v1/toolkit/test`
- `/v1/toolkit/job/status`
- `/v1/toolkit/jobs/status`

## Forbidden

Do not call `/v1/code/execute/python` through this skill. It is outside the MAXX media trust boundary.

## Workflow

1. Verify the service with `/v1/toolkit/test` before a costly job when health is uncertain.
2. Inspect source media metadata when dimensions/duration/codecs matter.
3. Choose the smallest endpoint that can produce the requested outcome.
4. For long-running work, use the toolkit job/webhook mechanism when the endpoint supports it rather than holding a fragile request open.
5. Verify the produced asset exists and is readable; where content quality matters, perform an independent visual/audio review before claiming verified.
6. Return artifact URLs/IDs and transformation facts as evidence, never secret-bearing signed URLs in durable logs.
