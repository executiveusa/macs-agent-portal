-- Agent MAXX production hardening.
-- A clean MAXX database must not depend on unrelated legacy migrations for
-- handle_updated_at(), and operator authorization must execute with caller
-- privileges rather than SECURITY DEFINER privileges.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter function public.is_control_tower_operator() security invoker;

revoke all on function public.is_control_tower_operator() from public;
grant execute on function public.is_control_tower_operator() to authenticated;
