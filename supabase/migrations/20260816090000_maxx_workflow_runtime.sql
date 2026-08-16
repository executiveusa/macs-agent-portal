-- OpenCodeReview follow-up: make interval workflows first-class scheduled jobs and event delivery idempotent.

alter table public.maxx_workflows
  add column if not exists next_run_at timestamptz null,
  add column if not exists last_run_at timestamptz null,
  add column if not exists last_run_status text null;

create index if not exists maxx_workflows_due_idx
  on public.maxx_workflows(next_run_at asc)
  where active and trigger_type = 'interval';

-- Existing interval workflows become independently schedulable without mutating a Pup's single routine slot.
update public.maxx_workflows
set next_run_at = coalesce(
  next_run_at,
  now() + ((trigger_value::integer) * interval '1 minute')
)
where active
  and trigger_type = 'interval'
  and trigger_value ~ '^[0-9]+$';

create table if not exists public.maxx_processed_events (
  id uuid primary key,
  operator_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (char_length(source) between 1 and 120),
  event_id text not null check (char_length(event_id) between 1 and 200),
  event_type text not null check (char_length(event_type) between 2 and 120),
  received_at timestamptz not null default now(),
  unique (operator_id, source, event_id)
);

create index if not exists maxx_processed_events_received_idx
  on public.maxx_processed_events(operator_id, received_at desc);

alter table public.maxx_processed_events enable row level security;

drop policy if exists "operators read own maxx processed events" on public.maxx_processed_events;
create policy "operators read own maxx processed events" on public.maxx_processed_events
  for select to authenticated using (operator_id = auth.uid());

-- Event rows are written by the server-side service role. Clients get no INSERT/UPDATE/DELETE policy.
