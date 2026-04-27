insert into public.profiles (name, shipping_name, country, payment_type, is_default)
values
  ('Default (AU)', 'KSW Ops', 'AU', 'card', true),
  ('Backup (AU)', 'KSW Ops 2', 'AU', 'paypal', false),
  ('Test (US)', 'QA Runner', 'US', 'unknown', false);

insert into public.proxy_groups (name, proxies_count, healthy_count, avg_latency_ms)
values
  ('Residential AU', 150, 138, 420),
  ('ISP Fastlane', 50, 47, 190),
  ('Datacenter Bulk', 300, 252, 610);

insert into public.adapters (name, type, connected, capabilities)
values
  ('Shopify Adapter', 'shopify', true, array['product_discovery','variant_parse','add_to_cart','checkout','anti_bot']),
  ('Hybrid Adapter', 'hybrid', true, array['product_discovery','variant_parse','add_to_cart','checkout']);

insert into public.catalog_items (name, category, store, store_type)
values
  ('Karfear Runner', 'shoes', 'Shopify Test Store A', 'shopify'),
  ('Karfear Street Low', 'shoes', 'Shopify Test Store B', 'shopify'),
  ('KSW Hoodie Drop', 'tops', 'Hybrid Storefront', 'hybrid'),
  ('KSW Tee Capsule', 'tops', 'Shopify Test Store A', 'shopify'),
  ('Karfear Cargo', 'pants', 'Hybrid Storefront', 'hybrid'),
  ('KSW Knit Beanie', 'hats', 'Shopify Test Store B', 'shopify'),
  ('KSW Cap Core', 'hats', 'Shopify Test Store A', 'shopify'),
  ('Karfear 5-Panel', 'hats', 'Hybrid Storefront', 'hybrid');

insert into public.catalog_variants (catalog_item_id, sku, size, color, price_cents, in_stock, last_seen_at)
select
  ci.id,
  ci.category || '-' || replace(lower(ci.name), ' ', '-') || '-black',
  case
    when ci.category = 'shoes' then '10'
    when ci.category = 'tops' then 'M'
    when ci.category = 'pants' then '32'
    else null
  end,
  'Black',
  14999,
  true,
  now() - interval '4 minutes'
from public.catalog_items ci;

insert into public.add_ons (type, name, sku, color, price_cents, store, store_type, enabled, in_stock, last_seen_at)
values
  ('hat', 'KSW Cap Core', 'KSW-CAP-CORE-BLACK', 'Black', 4499, 'Shopify Test Store A', 'shopify', true, true, now() - interval '6 minutes'),
  ('hat', 'KSW Cap Core', 'KSW-CAP-CORE-WHITE', 'White', 4499, 'Shopify Test Store A', 'shopify', true, false, null),
  ('hat', 'KSW Hat Drop', 'KSW-HAT-DROP-RED', 'Red', 4999, 'Hybrid Storefront', 'hybrid', true, true, now() - interval '2 minutes'),
  ('hat', 'Karfear 5-Panel', 'KRF-5PNL-GRAPHITE', 'Graphite', 3999, 'Hybrid Storefront', 'hybrid', true, true, now() - interval '12 minutes');

insert into public.monitors (store, store_type, category, query, sizes, enabled, hits_today, last_hit_at)
values
  ('Shopify Test Store A', 'shopify', 'shoes', 'Karfear Runner', array['9','10','11'], true, 3, now() - interval '23 minutes'),
  ('Shopify Test Store B', 'shopify', 'hats', 'KSW Cap Core', array['OS'], true, 1, now() - interval '9 minutes'),
  ('Hybrid Storefront', 'hybrid', 'tops', 'KSW Hoodie Drop', array['S','M','L'], true, 2, now() - interval '44 minutes'),
  ('Hybrid Storefront', 'hybrid', 'pants', 'Karfear Cargo', array['30','32','34'], false, 0, null);

insert into public.tasks (store, store_type, target, size, add_on_ids, profile_id, proxy_group_id, status, step, retries, last_http_status, last_update_at)
select
  'Shopify Test Store A',
  'shopify',
  'Karfear Runner',
  '10',
  array[(select id from public.add_ons where type = 'hat' limit 1)],
  (select id from public.profiles where name = 'Default (AU)' limit 1),
  (select id from public.proxy_groups where name = 'Residential AU' limit 1),
  'running',
  'add_to_cart',
  0,
  200,
  now() - interval '1 minute';

insert into public.events (type, severity, message, at)
values
  ('adapter_connected', 'success', 'Shopify adapter connected.', now() - interval '30 seconds'),
  ('task_started', 'info', 'Task queue warmed up: 1 running.', now() - interval '22 seconds'),
  ('hat_restock', 'success', 'Hat in stock: KSW Hat Drop (Red).', now() - interval '18 seconds');

