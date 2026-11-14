# Rollback and recovery

- Before approval, all feature changes remain isolated on `feat/agent-maxx-multiclient-v3-20261113` and backend candidate `feat/maxx-client-workspace-core-20261113`; never merge directly without independent PR review.
- Version rollback for frontend: revert the exact PR/commit that introduced a regression; do not install with peer override to force passing checks.
- Operational kill switch: `MAXX_CLIENT_WORKSPACES_ENABLED=false` and production mutations off. Revoke scoped agent credentials if cross-client leakage is found. This must fail closed, not fall back to an organization-wide legacy service.
- Supabase rollback: do not DROP scoped RLS if that would reinstate org-wide leakage. First revoke new RPC EXECUTE and stop traffic; restore verified backups only after independent data review; retain archived client records and the >=30-day recovery contract.
- Deployment: verify exact SHA, one sample authorized client task, login and logs in production. If any gate fails, revert or disable and keep status NOT READY.
