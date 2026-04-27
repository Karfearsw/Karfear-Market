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
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shipping_name text not null,
  country text not null,
  payment_type text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.proxy_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  proxies_count integer not null default 0,
  healthy_count integer not null default 0,
  avg_latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  store_type text not null,
  target text not null,
  size text not null,
  add_on_ids uuid[] not null default '{}',
  profile_id uuid references public.profiles(id) on delete set null,
  proxy_group_id uuid references public.proxy_groups(id) on delete set null,
  status text not null,
  step text not null,
  retries integer not null default 0,
  last_http_status integer,
  last_update_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.adapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  connected boolean not null default true,
  capabilities text[] not null default '{}',
  last_sync_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null,
  message text not null,
  at timestamptz not null default now()
);

grant select, insert, update, delete on table
  public.catalog_items,
  public.catalog_variants,
  public.add_ons,
  public.profiles,
  public.proxy_groups,
  public.monitors,
  public.tasks,
  public.adapters,
  public.events
to anon, authenticated;
