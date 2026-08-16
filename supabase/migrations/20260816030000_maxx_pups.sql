-- MAXX Pups: persistent specialist teammates that reuse the existing MAXX
-- control plane, Hermes runtime, approvals, ICM missions, and operator boundary.
-- Pups are not separate customer runtimes and cannot grant themselves permissions.

CREATE TABLE public.maxx_pups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  kind TEXT NOT NULL CHECK (kind IN ('chief_of_staff', 'superdoer', 'business_in_a_box', 'custom')),
  role TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'needs_attention')),
  autonomy TEXT NOT NULL DEFAULT 'draft_only' CHECK (autonomy IN ('draft_only', 'safe_actions')),
  session_id TEXT NOT NULL UNIQUE,
  routine_every_minutes INTEGER CHECK (
    routine_every_minutes IS NULL OR routine_every_minutes BETWEEN 15 AND 10080
  ),
  routine_prompt TEXT,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (routine_every_minutes IS NULL AND next_run_at IS NULL)
    OR routine_every_minutes IS NOT NULL
  )
);

CREATE INDEX maxx_pups_operator_updated_idx
  ON public.maxx_pups(operator_id, updated_at DESC);

CREATE INDEX maxx_pups_due_idx
  ON public.maxx_pups(next_run_at)
  WHERE status = 'active' AND routine_every_minutes IS NOT NULL;

ALTER TABLE public.maxx_pups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Control tower operator full access"
ON public.maxx_pups
FOR ALL
TO authenticated
USING (public.is_control_tower_operator() AND operator_id = auth.uid())
WITH CHECK (public.is_control_tower_operator() AND operator_id = auth.uid());

CREATE TRIGGER set_maxx_pups_updated_at
BEFORE UPDATE ON public.maxx_pups
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.maxx_pups IS
  'Persistent Agent MAXX specialist teammates. Proactive routine claims move next_run_at before execution to reduce duplicate wake-ups across supervisors.';
