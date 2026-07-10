-- Phase 12: Data model extension.
-- Additive only: three new tables backing owner strategy, memory
-- documents, and Hermes agent runs. Written to be additive and reversible
-- but NOT applied by this migration file's presence alone - per
-- CLAUDE.md guardrails, running migrations (even additive) against a live
-- database requires explicit operator confirmation.

CREATE TABLE public.maxx_owner_strategies (
  operator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_provider TEXT CHECK (preferred_provider IN ('groq', 'openrouter')),
  risk_tolerance TEXT NOT NULL DEFAULT 'standard'
    CHECK (risk_tolerance IN ('conservative', 'standard', 'permissive')),
  forbidden_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_cost_per_request_usd NUMERIC(10, 4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_memory_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL,
  mission_id UUID REFERENCES public.maxx_missions(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_hermes_runs (
  run_id TEXT PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.maxx_missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  stage TEXT NOT NULL,
  progress NUMERIC(3, 2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX maxx_memory_documents_run_id_idx ON public.maxx_memory_documents(run_id);
CREATE INDEX maxx_memory_documents_mission_id_idx ON public.maxx_memory_documents(mission_id);
CREATE INDEX maxx_hermes_runs_mission_id_idx ON public.maxx_hermes_runs(mission_id);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'maxx_owner_strategies', 'maxx_memory_documents', 'maxx_hermes_runs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY "Control tower operator full access" ON public.%I FOR ALL TO authenticated USING (public.is_control_tower_operator()) WITH CHECK (public.is_control_tower_operator())',
      table_name
    );
  END LOOP;
END $$;

-- Operators may only read/write their own strategy row (in addition to the
-- blanket control-tower-operator policy above, which already covers admins).
CREATE POLICY "Operators manage their own strategy" ON public.maxx_owner_strategies
  FOR ALL TO authenticated
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());
