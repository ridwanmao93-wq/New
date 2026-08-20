-- Personal Performance Dashboard — To-do list (work + personal)
-- Incremental migration. Run AFTER 0001–0006.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'personal' check (category in ('work', 'personal')),
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "own rows" on public.tasks;
create policy "own rows" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_tasks_user on public.tasks (user_id, category, completed, created_at desc);
