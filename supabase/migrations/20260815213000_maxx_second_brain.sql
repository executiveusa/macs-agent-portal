-- Agent MAXX second-brain import queue.
-- Browser uploads small private chunks so large exports do not depend on one
-- fragile request. A private worker reconstructs/imports them into ICM + OKF.

insert into storage.buckets (id, name, public, file_size_limit)
values ('maxx-second-brain', 'maxx-second-brain', false, 6291456)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create table if not exists public.maxx_second_brain_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  original_name text not null,
  mime_type text,
  total_bytes bigint not null check (total_bytes >= 0),
  chunk_count integer not null check (chunk_count > 0),
  storage_prefix text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  manifest_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.maxx_second_brain_imports enable row level security;

create policy "second brain imports readable by owner"
on public.maxx_second_brain_imports
for select
to authenticated
using (auth.uid() = user_id);

create policy "second brain imports created by owner"
on public.maxx_second_brain_imports
for insert
to authenticated
with check (
  auth.uid() = user_id
  and storage_prefix like auth.uid()::text || '/%'
);

create policy "second brain chunks readable by owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'maxx-second-brain'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "second brain chunks created by owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'maxx-second-brain'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "second brain chunks removable by owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'maxx-second-brain'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create index if not exists maxx_second_brain_imports_user_created_idx
  on public.maxx_second_brain_imports (user_id, created_at desc);

create index if not exists maxx_second_brain_imports_status_idx
  on public.maxx_second_brain_imports (status, created_at asc);

create or replace function public.touch_maxx_second_brain_import()
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

drop trigger if exists touch_maxx_second_brain_import on public.maxx_second_brain_imports;
create trigger touch_maxx_second_brain_import
before update on public.maxx_second_brain_imports
for each row execute function public.touch_maxx_second_brain_import();
