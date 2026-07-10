-- Phase 4: Approval expiration + anti-replay support.
-- Additive only: new nullable column, widened status check constraint.

ALTER TABLE public.maxx_approvals
  ADD COLUMN expires_at TIMESTAMPTZ;

UPDATE public.maxx_approvals
  SET expires_at = created_at + INTERVAL '24 hours'
  WHERE expires_at IS NULL;

ALTER TABLE public.maxx_approvals
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '24 hours');

ALTER TABLE public.maxx_approvals
  DROP CONSTRAINT IF EXISTS maxx_approvals_status_check;

ALTER TABLE public.maxx_approvals
  ADD CONSTRAINT maxx_approvals_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));

CREATE INDEX IF NOT EXISTS maxx_approvals_expires_at_idx
  ON public.maxx_approvals(expires_at)
  WHERE status = 'pending';
