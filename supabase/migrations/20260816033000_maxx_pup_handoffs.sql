-- MAXX Pup handoffs: durable, operator-scoped delegation records.
-- This is a governed transport inside MAXX, not a second agent runtime.
-- Depth is deliberately fixed at one so Pups cannot create recursive chains.

CREATE TABLE public.maxx_pup_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_pup_id UUID NOT NULL REFERENCES public.maxx_pups(id) ON DELETE CASCADE,
  target_pup_id UUID NOT NULL REFERENCES public.maxx_pups(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL CHECK (char_length(instruction) BETWEEN 3 AND 4000),
  depth SMALLINT NOT NULL DEFAULT 1 CHECK (depth = 1),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'working', 'needs_operator', 'ready', 'failed', 'cancelled')
  ),
  mission_id UUID,
  run_id UUID,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (source_pup_id <> target_pup_id)
);

CREATE INDEX maxx_pup_handoffs_operator_created_idx
  ON public.maxx_pup_handoffs(operator_id, created_at DESC);

CREATE INDEX maxx_pup_handoffs_thread_idx
  ON public.maxx_pup_handoffs(operator_id, thread_id, created_at ASC);

CREATE INDEX maxx_pup_handoffs_target_status_idx
  ON public.maxx_pup_handoffs(target_pup_id, status, created_at DESC);

ALTER TABLE public.maxx_pup_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Control tower operator handoff access"
ON public.maxx_pup_handoffs
FOR ALL
TO authenticated
USING (public.is_control_tower_operator() AND operator_id = auth.uid())
WITH CHECK (public.is_control_tower_operator() AND operator_id = auth.uid());

CREATE TRIGGER set_maxx_pup_handoffs_updated_at
BEFORE UPDATE ON public.maxx_pup_handoffs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.maxx_pup_handoffs IS
  'Transparent one-hop MAXX Pup delegation records. Execution re-enters the existing Pup run path and inherits MAXX auth, approvals, mutation locks, ICM missions, and Hermes runtime.';