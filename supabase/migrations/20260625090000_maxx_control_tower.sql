-- Agent MAXX private control tower. The service role writes runtime records;
-- authenticated operators can only access rows when their email is allowlisted.

CREATE TABLE public.control_tower_operators (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  display_name TEXT NOT NULL DEFAULT 'Stacy',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.control_tower_operators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_control_tower_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.control_tower_operators
    WHERE email = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND active = true
  );
$$;

CREATE POLICY "Operators can read their allowlist entry"
ON public.control_tower_operators
FOR SELECT
TO authenticated
USING (email = lower(COALESCE(auth.jwt() ->> 'email', '')));

CREATE TABLE public.crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'paused', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'contacted', 'nurture', 'customer', 'closed')),
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'discovery' CHECK (stage IN ('discovery', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value_cents BIGINT NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  next_action TEXT,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.maxx_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'needs_operator'
    CHECK (status IN ('needs_operator', 'working', 'ready', 'completed', 'failed', 'cancelled')),
  current_stage TEXT,
  run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_runs (
  id TEXT PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.maxx_missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'working'
    CHECK (status IN ('queued', 'working', 'paused', 'ready', 'completed', 'failed', 'cancelled')),
  workspace_path TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT '01_intake',
  selected_model TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_summary TEXT
);

ALTER TABLE public.maxx_missions
  ADD CONSTRAINT maxx_missions_run_fk
  FOREIGN KEY (run_id) REFERENCES public.maxx_runs(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.maxx_stage_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES public.maxx_runs(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'working', 'approval', 'completed', 'failed', 'skipped')),
  input_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  UNIQUE (run_id, stage_id)
);

CREATE TABLE public.maxx_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES public.maxx_runs(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_sha256 TEXT,
  public_safe BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES public.maxx_runs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sequence BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES public.maxx_runs(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL DEFAULT 'MAXX',
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (status = 'pending' AND decided_by IS NULL AND decided_at IS NULL)
    OR (status IN ('approved', 'rejected') AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
  )
);

CREATE TABLE public.maxx_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.maxx_missions(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'MAXX conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.maxx_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('operator', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  model TEXT,
  routing_reason TEXT,
  approval_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_skills (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  purpose TEXT NOT NULL,
  source TEXT NOT NULL,
  health TEXT NOT NULL CHECK (health IN ('ready', 'degraded', 'disabled')),
  mutation TEXT NOT NULL CHECK (mutation IN ('read_only', 'mutating')),
  approval_policy TEXT NOT NULL CHECK (approval_policy IN ('automatic', 'approval_required')),
  required_environment TEXT[] NOT NULL DEFAULT '{}',
  filesystem_permissions TEXT[] NOT NULL DEFAULT '{}',
  browser_permissions TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_skill_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL REFERENCES public.maxx_skills(id),
  run_id TEXT REFERENCES public.maxx_runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'working', 'approval', 'completed', 'failed', 'cancelled')),
  input_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE public.maxx_browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT REFERENCES public.maxx_runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('starting', 'active', 'approval', 'stopped', 'failed')),
  current_url TEXT,
  current_intent TEXT,
  latest_screenshot_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maxx_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT REFERENCES public.maxx_runs(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  estimated_cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost_usd >= 0),
  latency_ms INTEGER NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX maxx_events_run_sequence_idx ON public.maxx_events(run_id, sequence);
CREATE INDEX maxx_missions_status_idx ON public.maxx_missions(status, updated_at DESC);
CREATE INDEX maxx_approvals_status_idx ON public.maxx_approvals(status, created_at DESC);
CREATE INDEX crm_opportunities_stage_idx ON public.crm_opportunities(stage, updated_at DESC);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_companies', 'crm_contacts', 'crm_opportunities', 'crm_activities',
    'maxx_missions', 'maxx_runs', 'maxx_stage_runs', 'maxx_artifacts',
    'maxx_events', 'maxx_approvals', 'maxx_conversations', 'maxx_messages',
    'maxx_skills', 'maxx_skill_runs', 'maxx_browser_sessions', 'maxx_usage'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY "Control tower operator full access" ON public.%I FOR ALL TO authenticated USING (public.is_control_tower_operator()) WITH CHECK (public.is_control_tower_operator())',
      table_name
    );
  END LOOP;
END $$;

CREATE TRIGGER set_crm_companies_updated_at
BEFORE UPDATE ON public.crm_companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_crm_contacts_updated_at
BEFORE UPDATE ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_crm_opportunities_updated_at
BEFORE UPDATE ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_maxx_missions_updated_at
BEFORE UPDATE ON public.maxx_missions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_maxx_conversations_updated_at
BEFORE UPDATE ON public.maxx_conversations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_maxx_browser_sessions_updated_at
BEFORE UPDATE ON public.maxx_browser_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
