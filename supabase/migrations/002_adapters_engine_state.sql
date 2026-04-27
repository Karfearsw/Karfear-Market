alter table if exists public.adapters
  add column if not exists base_url text;

alter table if exists public.adapters
  add column if not exists config jsonb not null default '{}'::jsonb;

alter table if exists public.adapters
  add column if not exists last_error text;

alter table if exists public.adapters
  add column if not exists last_checked_at timestamptz;

alter table if exists public.adapters
  alter column connected set default false;

create table if not exists public.engine_state (
  id integer primary key default 1,
  queue_paused boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint engine_state_singleton_check check (id = 1)
);

insert into public.engine_state(id) values (1) on conflict do nothing;

grant select, insert, update, delete on table public.engine_state to anon, authenticated;
