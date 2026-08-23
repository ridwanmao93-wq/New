-- Personal Performance Dashboard — richer task details (Motion-style)
-- Incremental migration. Run AFTER 0001–0007.

alter table public.tasks
  add column if not exists description text,
  add column if not exists priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  add column if not exists due_date date,
  add column if not exists duration_minutes integer;
