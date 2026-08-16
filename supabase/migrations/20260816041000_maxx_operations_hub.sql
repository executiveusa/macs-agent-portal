-- MAXX Operations Hub: durable connection metadata, teachable workflows, and bounded refinement proposals.
-- Secrets are deliberately NOT stored here. `secret_ref` is an opaque lookup reference to a server-side secret/session provider.

create table if not exists public.maxx_connections (
  id uuid primary key,
  operator_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  kind text not null check (kind in ('email','calendar','crm','hosting','social','browser','other')),
  secret_ref text not null check (char_length(secret_ref) between 3 and 200),
  status text not null default 'connected' check (status in ('connected','needs_attention','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maxx_connections_operator_idx on public.maxx_connections(operator_id, updated_at desc);

create table if not exists public.maxx_workflows (
  id uuid primary key,
  operator_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  pup_id uuid not null references public.maxx_pups(id) on delete cascade,
  objective text not null check (char_length(objective) between 3 and 2000),
  expected_proof text not null check (char_length(expected_proof) between 3 and 1000),
  trigger_type text not null default 'manual' check (trigger_type in ('manual','interval','event')),
  trigger_value text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maxx_workflow_trigger_value check (
    (trigger_type = 'manual') or (trigger_value is not null and char_length(trigger_value) between 1 and 200)
  )
);

create index if not exists maxx_workflows_operator_idx on public.maxx_workflows(operator_id, updated_at desc);
create index if not exists maxx_workflows_event_idx on public.maxx_workflows(operator_id, trigger_type, trigger_value) where active;

create table if not exists public.maxx_refinement_proposals (
  id uuid primary key,
  operator_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (char_length(source) between 2 and 120),
  observation text not null check (char_length(observation) between 3 and 4000),
  proposed_change text not null check (char_length(proposed_change) between 3 and 4000),
  expected_evidence text not null check (char_length(expected_evidence) between 3 and 2000),
  rollback_plan text not null check (char_length(rollback_plan) between 3 and 2000),
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','tested','adopted','rolled_back')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maxx_refinement_operator_idx on public.maxx_refinement_proposals(operator_id, updated_at desc);

alter table public.maxx_connections enable row level security;
alter table public.maxx_workflows enable row level security;
alter table public.maxx_refinement_proposals enable row level security;

-- The control plane uses the service role server-side. These authenticated policies keep direct client access owner-scoped if exposed later.
drop policy if exists "operators manage own maxx connections" on public.maxx_connections;
create policy "operators manage own maxx connections" on public.maxx_connections
  for all to authenticated using (operator_id = auth.uid()) with check (operator_id = auth.uid());

drop policy if exists "operators manage own maxx workflows" on public.maxx_workflows;
create policy "operators manage own maxx workflows" on public.maxx_workflows
  for all to authenticated using (operator_id = auth.uid()) with check (operator_id = auth.uid());

drop policy if exists "operators manage own maxx refinements" on public.maxx_refinement_proposals;
create policy "operators manage own maxx refinements" on public.maxx_refinement_proposals
  for all to authenticated using (operator_id = auth.uid()) with check (operator_id = auth.uid());
