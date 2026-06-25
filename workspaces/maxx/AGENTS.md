# Agent MAXX ICM Workspace

This workspace is the private execution factory for Stacy's Agent MAXX.

- Read `CONTEXT.md` to route work.
- Load only the current stage contract, its declared references, and its working artifacts.
- Keep all run-specific output under `runs/<run-id>/`.
- Never read or write outside `MAXX_ICM_ROOT`.
- Never place secrets, tokens, passwords, or private contact data in event logs.
- Never approve, publish, purchase, send, upload, delete, or change permissions for Stacy.
- Consequential actions stop at `06_approval` until a recorded operator decision exists.
- `08_learn` may propose factory changes but must not apply them without approval.
