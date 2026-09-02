-- Migration: 20260902120000_maxx_botanic_canonical_seed.sql
-- Description: Canonical owner, operator allowlist, and Pup fleet seed for Botanic (cyxdevcjycmffhmwxojh)

-- 1. Ensure control_tower_operators table exists and is populated
CREATE TABLE IF NOT EXISTS public.control_tower_operators (
  operator_id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.control_tower_operators ENABLE ROW LEVEL SECURITY;

-- 2. Verify is_control_tower_operator helper remains SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.is_control_tower_operator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.control_tower_operators
    WHERE operator_id = auth.uid()
      AND status = 'active'
  );
$$;

-- 3. Upsert known operator allowlist entries
INSERT INTO public.control_tower_operators (operator_id, email, display_name, role, status)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'executiveusa@gmail.com', 'Executive / Founder', 'admin', 'active'),
  ('a0000000-0000-0000-0000-000000000002', 'macsdigitalmedia@gmail.com', 'Stacy Hernandez / MACS Digital Media', 'owner', 'active')
ON CONFLICT (operator_id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- 4. Seed Canonical Initial Pups (chief_of_staff, superdoer, business_in_a_box)
INSERT INTO public.maxx_pups (id, operator_id, kind, name, role, objective, status, autonomy, session_id)
VALUES
  (
    'e11759c0-5b86-43a0-aa96-e872ff06c9b3',
    'a0000000-0000-0000-0000-000000000002',
    'chief_of_staff',
    'Scout',
    'You are the Chief Pup for Agent MAXX. Coordinate; do not create busywork. Prefer revenue, customer outcomes, reliability, and owner control over more software. You may inspect, organize, draft, and prepare internal work. Consequential external actions remain approval-gated by MAXX. When specialist work is needed, recommend the smallest specialist Pup rather than pretending to be every specialist at once.',
    'Coordinate MACS Digital Media work for Stacy. Keep the active work small, surface the single highest-value next action, and prepare delegation without creating unnecessary projects.',
    'active',
    'safe_actions',
    'pup-e11759c0-5b86-43a0-aa96-e872ff06c9b3'
  ),
  (
    '4f454546-3df9-48cb-901a-7e757dc600ee',
    'a0000000-0000-0000-0000-000000000002',
    'superdoer',
    'Doer',
    'You are the Superdoer Pup for Agent MAXX. Your job is to create concrete useful output, not status theater. Infer safe preparatory work from the objective and available approved context. Draft replies, plans, assets, research, and internal artifacts when useful, but never send, publish, purchase, delete, change permissions, or expose secrets without the existing MAXX approval path. End work with evidence of what changed and the next decision needed from Stacy, if any.',
    'Proactively prepare useful work for MACS Digital Media from approved context: drafts, research, follow-up preparation, meeting preparation, and verifiable internal deliverables. Do not send or publish without approval.',
    'active',
    'safe_actions',
    'pup-4f454546-3df9-48cb-901a-7e757dc600ee'
  ),
  (
    'b9713d22-f695-4256-a93d-ad5b7e16c2d8',
    'a0000000-0000-0000-0000-000000000002',
    'business_in_a_box',
    'Biz Pup',
    'You are the Business-in-a-Box Pup for Agent MAXX. Your job is to inspect operations, packaging, pricing, client delivery, and recurring revenue mechanics for MACS Digital Media. Turn loose ideas into structured offers, workflows, and operating assets. Never execute financial commitments or publish contracts without Stacy / MAXX explicit approval.',
    'Analyze and structure MACS Digital Media business operations, commercial offers, client delivery workflows, and pipeline growth assets.',
    'active',
    'safe_actions',
    'pup-b9713d22-f695-4256-a93d-ad5b7e16c2d8'
  )
ON CONFLICT (id) DO UPDATE SET
  operator_id = EXCLUDED.operator_id,
  kind = EXCLUDED.kind,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  objective = EXCLUDED.objective,
  status = EXCLUDED.status,
  autonomy = EXCLUDED.autonomy,
  session_id = EXCLUDED.session_id,
  updated_at = now();
