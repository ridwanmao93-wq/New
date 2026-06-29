-- Personal Performance Dashboard — Brain Dump / free-form journal
-- Incremental migration. Run AFTER 0001–0004.

create table if not exists public.brain_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.brain_dumps enable row level security;

drop policy if exists "own rows" on public.brain_dumps;
create policy "own rows" on public.brain_dumps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_brain_dumps_user on public.brain_dumps (user_id, created_at desc);
