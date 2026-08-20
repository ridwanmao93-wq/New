import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Database drift detection. The app self-heals around missing tables and
 * columns so a save is never blocked — but we still want to TELL the user
 * when something is behind, calmly, in one place. This probes each feature's
 * table (and the one added column) and reports what's missing plus the exact
 * SQL to fix it.
 */

type Check =
  | { key: string; label: string; kind: "table"; table: string }
  | { key: string; label: string; kind: "column"; table: string; column: string };

const CHECKS: Check[] = [
  { key: "vision", label: "Vision Board", kind: "table", table: "vision_board_items" },
  { key: "focus", label: "Focus / deep-work sessions", kind: "table", table: "focus_sessions" },
  { key: "push", label: "Push notifications", kind: "table", table: "push_subscriptions" },
  { key: "braindump", label: "Brain Dump journal", kind: "table", table: "brain_dumps" },
  { key: "meditation", label: "Meditation timer", kind: "table", table: "meditation_sessions" },
  {
    key: "meditation_col",
    label: "Meditation in the momentum checklist",
    kind: "column",
    table: "daily_momentum_entries",
    column: "meditation_completed",
  },
];

export type MissingItem = { key: string; label: string };

async function isPresent(supabase: SupabaseClient, check: Check): Promise<boolean> {
  const col = check.kind === "column" ? check.column : "id";
  const { error } = await supabase.from(check.table).select(col).limit(1);
  if (!error) return true;
  // Only a missing table/column counts as "not present"; anything else
  // (e.g. an RLS/permissions blip) we treat as present to avoid false alarms.
  return !/Could not find the (table|'[^']+' column)/i.test(error.message);
}

export async function checkDbStatus(supabase: SupabaseClient): Promise<{
  missing: MissingItem[];
  upToDate: boolean;
}> {
  const results = await Promise.all(
    CHECKS.map(async (c) => ({ c, present: await isPresent(supabase, c) }))
  );
  const missing = results.filter((r) => !r.present).map((r) => ({ key: r.c.key, label: r.c.label }));
  return { missing, upToDate: missing.length === 0 };
}

/**
 * The single idempotent SQL block that brings a database fully up to date.
 * Safe to run repeatedly — every statement is "if not exists" / "drop
 * policy if exists". Shown on the System status page for one-paste fixes.
 */
export const CATCH_UP_SQL = `-- Performance OS — bring the database fully up to date.
-- Safe to run more than once; nothing here is destructive.

-- Vision Board
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

insert into storage.buckets (id, name, public)
values ('vision-board', 'vision-board', true)
on conflict (id) do nothing;
drop policy if exists "vision board read" on storage.objects;
create policy "vision board read" on storage.objects
  for select using (bucket_id = 'vision-board');
drop policy if exists "vision board insert" on storage.objects;
create policy "vision board insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'vision-board');
drop policy if exists "vision board delete" on storage.objects;
create policy "vision board delete" on storage.objects
  for delete to authenticated using (bucket_id = 'vision-board');

-- Focus sessions
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

-- Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "own rows" on public.push_subscriptions;
create policy "own rows" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_push_user on public.push_subscriptions (user_id);

-- Brain dumps
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

-- Meditation
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

alter table public.daily_momentum_entries
  add column if not exists meditation_completed boolean default false;
`;
