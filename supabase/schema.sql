create extension if not exists "pgcrypto";

grant usage on schema public to anon, authenticated;

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  store text not null,
  store_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists catalog_items_category_idx on public.catalog_items(category);

create table if not exists public.catalog_variants (
  id uuid primary key default gen_random_uuid(),
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  sku text not null,
  size text,
  color text not null,
  price_cents integer,
  in_stock boolean not null default false,
  last_seen_at timestamptz
);

create index if not exists catalog_variants_item_idx on public.catalog_variants(catalog_item_id);
create index if not exists catalog_variants_sku_idx on public.catalog_variants(sku);

create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  name text not null,
  sku text not null,
  color text not null,
  price_cents integer,
  store text not null,
  store_type text not null,
  enabled boolean not null default true,
  in_stock boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  constraint add_ons_type_check check (type in ('hat'))
);

create index if not exists add_ons_type_idx on public.add_ons(type);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shipping_name text not null,
  country text not null,
  payment_type text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_payment_type_check check (payment_type in ('card','paypal','crypto','unknown'))
);

create index if not exists profiles_is_default_idx on public.profiles(is_default);

create table if not exists public.proxy_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  proxies_count integer not null default 0,
  healthy_count integer not null default 0,
  avg_latency_ms integer not null default 0,
  created_at timestamptz not null default now(),
  constraint proxy_groups_proxies_count_check check (proxies_count >= 0),
  constraint proxy_groups_healthy_count_check check (healthy_count >= 0),
  constraint proxy_groups_avg_latency_ms_check check (avg_latency_ms >= 0)
);

create table if not exists public.proxies (
  id uuid primary key default gen_random_uuid(),
  proxy_group_id uuid not null references public.proxy_groups(id) on delete cascade,
  host text not null,
  port integer not null,
  username text,
  password text,
  healthy boolean not null default false,
  last_latency_ms integer,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint proxies_port_check check (port > 0 and port <= 65535),
  constraint proxies_last_latency_ms_check check (last_latency_ms is null or last_latency_ms >= 0)
);

create index if not exists proxies_group_idx on public.proxies(proxy_group_id);
create index if not exists proxies_healthy_idx on public.proxies(healthy);

create table if not exists public.monitors (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  store_type text not null,
  category text not null,
  query text not null,
  sizes text[] not null default '{}',
  enabled boolean not null default true,
  hits_today integer not null default 0,
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  constraint monitors_hits_today_check check (hits_today >= 0)
);

create index if not exists monitors_enabled_idx on public.monitors(enabled);
create index if not exists monitors_category_idx on public.monitors(category);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  store_type text not null,
  target text not null,
  size text not null,
  add_on_ids uuid[] not null default '{}',
  profile_id uuid references public.profiles(id) on delete set null,
  proxy_group_id uuid references public.proxy_groups(id) on delete set null,
  pinned boolean not null default false,
  status text not null,
  step text not null,
  retries integer not null default 0,
  last_http_status integer,
  last_update_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint tasks_status_check check (status in ('queued','running','success','failed','paused','canceled')),
  constraint tasks_step_check check (step in ('init','discover','select_variant','add_to_cart','shipping','payment','submit','done')),
  constraint tasks_retries_check check (retries >= 0)
);

create index if not exists tasks_last_update_at_idx on public.tasks(last_update_at);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_pinned_idx on public.tasks(pinned);

create table if not exists public.adapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  base_url text,
  config jsonb not null default '{}'::jsonb,
  connected boolean not null default false,
  last_error text,
  last_checked_at timestamptz,
  capabilities text[] not null default '{}',
  last_sync_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists adapters_connected_idx on public.adapters(connected);

create table if not exists public.engine_state (
  id integer primary key default 1,
  queue_paused boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint engine_state_singleton_check check (id = 1)
);

insert into public.engine_state(id) values (1) on conflict do nothing;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null,
  message text not null,
  at timestamptz not null default now(),
  constraint events_severity_check check (severity in ('info','warn','error','success'))
);

create index if not exists events_at_idx on public.events(at);

grant select, insert, update, delete on table
  public.catalog_items,
  public.catalog_variants,
  public.add_ons,
  public.profiles,
  public.proxy_groups,
  public.proxies,
  public.monitors,
  public.tasks,
  public.adapters,
  public.engine_state,
  public.events
to anon, authenticated;
