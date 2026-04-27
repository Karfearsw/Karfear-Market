alter table if exists public.tasks
  add column if not exists pinned boolean not null default false;

create index if not exists tasks_pinned_idx on public.tasks(pinned);
