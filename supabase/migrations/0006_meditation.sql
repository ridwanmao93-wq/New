-- Personal Performance Dashboard — Meditation
-- Incremental migration. Run AFTER 0001–0005.

create table if not exists public.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  minutes integer not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.meditation_sessions enable row level security;

drop policy if exists "own rows" on public.meditation_sessions;
create policy "own rows" on public.meditation_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_meditation_user_date on public.meditation_sessions (user_id, date);

-- Add "meditated" to the momentum checklist.
alter table public.daily_momentum_entries
  add column if not exists meditation_completed boolean default false;
