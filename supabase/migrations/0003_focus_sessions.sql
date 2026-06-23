-- Personal Performance Dashboard — Focus / deep-work sessions
-- Incremental migration. Run AFTER 0001 and 0002.

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  minutes integer not null,
  focus_area text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.focus_sessions enable row level security;

drop policy if exists "own rows" on public.focus_sessions;
create policy "own rows" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_focus_user_date on public.focus_sessions (user_id, date);
