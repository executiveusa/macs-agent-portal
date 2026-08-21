-- Persist the minimum runtime pointer required to reconnect a MAXX Pup card to
-- the exact Hermes profile/run after browser refresh, phone lock, or restart.
-- Business truth remains in MAXX/Supabase; this is only a runtime correlation.

ALTER TABLE public.maxx_pups
  ADD COLUMN IF NOT EXISTS last_runtime_run_id TEXT,
  ADD COLUMN IF NOT EXISTS runtime_profile TEXT;

CREATE INDEX IF NOT EXISTS maxx_pups_runtime_run_idx
  ON public.maxx_pups(last_runtime_run_id)
  WHERE last_runtime_run_id IS NOT NULL;

COMMENT ON COLUMN public.maxx_pups.last_runtime_run_id IS
  'Most recent Hermes run id for this Pup. Used to reconnect status/approval UX after refresh.';

COMMENT ON COLUMN public.maxx_pups.runtime_profile IS
  'Internal Hermes profile backing the Pup runtime. Product UI must not expose this implementation detail.';
