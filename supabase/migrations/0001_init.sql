-- Personal Performance Dashboard — initial schema
-- Run via the Supabase SQL editor or `supabase db push`.

-- ------------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  hydration_goal_ml integer default 3000,
  weight_goal_lbs numeric,
  weight_unit text default 'lbs',
  created_at timestamptz not null default now()
);

-- Create a profile row automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- oura_daily_metrics
-- ------------------------------------------------------------------
create table if not exists public.oura_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sleep_score numeric,
  readiness_score numeric,
  activity_score numeric,
  total_sleep_duration numeric,
  resting_heart_rate numeric,
  hrv numeric,
  steps integer,
  calories_burned numeric,
  sleep_efficiency numeric,
  deep_sleep_duration numeric,
  rem_sleep_duration numeric,
  awake_time numeric,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ------------------------------------------------------------------
-- cbt_morning_entries
-- ------------------------------------------------------------------
create table if not exists public.cbt_morning_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood_score integer,
  energy_score integer,
  hopefulness_score integer,
  centering_completed boolean default false,
  sentence_stems_json jsonb,
  identity_action_statement text,
  fully_accepted_success_response text,
  no_longer_needed_to_suffer_response text,
  identity_releasing text,
  identity_stepping_into text,
  affirmation_completed boolean default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- cbt_evening_entries
-- ------------------------------------------------------------------
create table if not exists public.cbt_evening_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood_score integer,
  energy_score integer,
  hopefulness_score integer,
  reflection_notes text,
  gratitude text,
  surrender_statement text,
  completed boolean default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- workouts
-- ------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  workout_type text,
  duration_minutes numeric,
  exercises_json jsonb,
  intensity_score integer,
  completed boolean default true,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- weight_entries
-- ------------------------------------------------------------------
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_lbs numeric,
  waist_measurement numeric,
  progress_photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- hydration_entries
-- ------------------------------------------------------------------
create table if not exists public.hydration_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  water_intake_ml numeric,
  water_intake_oz numeric,
  hydration_goal_ml numeric,
  hydration_goal_percentage numeric,
  source text default 'Manual',
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- weekly_reviews
-- ------------------------------------------------------------------
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  avg_mood numeric,
  avg_energy numeric,
  avg_hopefulness numeric,
  avg_sleep_score numeric,
  avg_readiness_score numeric,
  avg_hrv numeric,
  avg_resting_heart_rate numeric,
  avg_weight numeric,
  workouts_completed integer,
  avg_hydration_percentage numeric,
  morning_completion_percentage numeric,
  evening_completion_percentage numeric,
  current_streak integer,
  longest_streak integer,
  reflection_notes text,
  intentions_for_next_week text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

-- ==================================================================
-- LIFE OPERATING SYSTEM TABLES
-- ==================================================================

-- daily_alignment_entries
create table if not exists public.daily_alignment_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  followed_values_score integer,
  avoided_something_important_score integer,
  acted_courageously_score integer,
  kept_promises_score integer,
  daily_alignment_score numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- sobriety_entries
create table if not exists public.sobriety_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  cannabis_used boolean default false,
  craving_score integer,
  trigger text,
  response_to_trigger text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- debt_entries
create table if not exists public.debt_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  total_debt_remaining numeric,
  debt_paid_this_month numeric,
  savings_balance numeric,
  emergency_fund_balance numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- daily_momentum_entries
create table if not exists public.daily_momentum_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  morning_cbt_completed boolean default false,
  evening_cbt_completed boolean default false,
  workout_completed boolean default false,
  hydration_goal_hit boolean default false,
  no_cannabis boolean default false,
  family_connection_completed boolean default false,
  business_growth_action_completed boolean default false,
  hardest_thing_done boolean default false,
  most_important_action text,
  momentum_score numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- anti_avoidance_entries
create table if not exists public.anti_avoidance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  hardest_thing_i_did_not_want_to_do text,
  did_i_do_it boolean default false,
  avoidance_trigger text,
  what_helped_me_take_action text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- relationship_entries
create table if not exists public.relationship_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  person text,
  connection_type text,
  completed boolean default true,
  notes text,
  created_at timestamptz not null default now()
);

-- future_self_goals
create table if not exists public.future_self_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text,
  goal_name text,
  target_value numeric,
  current_value numeric,
  target_date date,
  why_it_matters text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Row Level Security: each user only sees their own rows.
-- ------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.oura_daily_metrics  enable row level security;
alter table public.cbt_morning_entries enable row level security;
alter table public.cbt_evening_entries enable row level security;
alter table public.workouts            enable row level security;
alter table public.weight_entries      enable row level security;
alter table public.hydration_entries   enable row level security;
alter table public.weekly_reviews      enable row level security;
alter table public.daily_alignment_entries enable row level security;
alter table public.sobriety_entries        enable row level security;
alter table public.debt_entries            enable row level security;
alter table public.daily_momentum_entries  enable row level security;
alter table public.anti_avoidance_entries  enable row level security;
alter table public.relationship_entries    enable row level security;
alter table public.future_self_goals       enable row level security;

-- profiles: id IS the user id
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Generic per-user policies for the data tables.
do $$
declare t text;
begin
  foreach t in array array[
    'oura_daily_metrics','cbt_morning_entries','cbt_evening_entries',
    'workouts','weight_entries','hydration_entries','weekly_reviews',
    'daily_alignment_entries','sobriety_entries','debt_entries',
    'daily_momentum_entries','anti_avoidance_entries','relationship_entries',
    'future_self_goals'
  ]
  loop
    execute format('drop policy if exists "own rows" on public.%I;', t);
    execute format(
      'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end$$;

-- Helpful indexes for date-range queries.
create index if not exists idx_oura_user_date     on public.oura_daily_metrics (user_id, date);
create index if not exists idx_morning_user_date  on public.cbt_morning_entries (user_id, date);
create index if not exists idx_evening_user_date  on public.cbt_evening_entries (user_id, date);
create index if not exists idx_workouts_user_date on public.workouts (user_id, date);
create index if not exists idx_weight_user_date   on public.weight_entries (user_id, date);
create index if not exists idx_hydration_user_date on public.hydration_entries (user_id, date);
create index if not exists idx_alignment_user_date on public.daily_alignment_entries (user_id, date);
create index if not exists idx_sobriety_user_date  on public.sobriety_entries (user_id, date);
create index if not exists idx_momentum_user_date  on public.daily_momentum_entries (user_id, date);
create index if not exists idx_avoidance_user_date on public.anti_avoidance_entries (user_id, date);
create index if not exists idx_relationship_user_date on public.relationship_entries (user_id, date);
create index if not exists idx_debt_user_date      on public.debt_entries (user_id, date);
