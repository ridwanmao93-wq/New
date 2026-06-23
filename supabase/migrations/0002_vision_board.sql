-- Personal Performance Dashboard — Vision Board
-- Incremental migration. Run this in the Supabase SQL editor AFTER
-- 0001_init.sql (it only adds the vision board; it changes nothing else).

-- ------------------------------------------------------------------
-- vision_board_items
-- ------------------------------------------------------------------
create table if not exists public.vision_board_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_url text not null,
  caption text,
  category text,
  future_self_goal_id uuid references public.future_self_goals (id) on delete set null,
  target_date date,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

alter table public.vision_board_items enable row level security;

drop policy if exists "own rows" on public.vision_board_items;
create policy "own rows" on public.vision_board_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_vision_user on public.vision_board_items (user_id);

-- ------------------------------------------------------------------
-- Storage bucket for vision board images
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vision-board', 'vision-board', true)
on conflict (id) do nothing;

-- Public read of images; authenticated users may upload / delete in the
-- bucket. (Single private user — keep storage policies simple.)
drop policy if exists "vision board read" on storage.objects;
create policy "vision board read" on storage.objects
  for select using (bucket_id = 'vision-board');

drop policy if exists "vision board insert" on storage.objects;
create policy "vision board insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'vision-board');

drop policy if exists "vision board delete" on storage.objects;
create policy "vision board delete" on storage.objects
  for delete to authenticated using (bucket_id = 'vision-board');
