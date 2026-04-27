import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdapterCapability,
  EventType,
  KswState,
  PaymentType,
  ProductCategory,
  Severity,
  TaskStatus,
  TaskStep,
} from "@/lib/ksw/types";

const categories: ProductCategory[] = [
  "tops",
  "shoes",
  "pants",
  "hats",
  "outerwear",
  "accessories",
  "other",
];

const taskStatuses: TaskStatus[] = [
  "queued",
  "running",
  "success",
  "failed",
  "paused",
  "canceled",
];

const taskSteps: TaskStep[] = [
  "init",
  "discover",
  "select_variant",
  "add_to_cart",
  "shipping",
  "payment",
  "submit",
  "done",
];

const severities: Severity[] = ["info", "warn", "error", "success"];

const eventTypes: EventType[] = [
  "restock",
  "hat_restock",
  "task_created",
  "task_started",
  "task_progress",
  "task_success",
  "task_failed",
  "task_canceled",
  "task_retried",
  "monitor_updated",
  "monitor_enabled",
  "monitor_disabled",
  "profile_created",
  "profile_updated",
  "profile_deleted",
  "proxies_imported",
  "proxies_tested",
  "proxy_degraded",
  "adapter_connected",
  "adapter_disconnected",
];

const paymentTypes: PaymentType[] = ["card", "paypal", "crypto", "unknown"];

const adapterCapabilities: AdapterCapability[] = [
  "product_discovery",
  "variant_parse",
  "add_to_cart",
  "checkout",
  "anti_bot",
];

function asCategory(v: unknown): ProductCategory {
  return typeof v === "string" && categories.includes(v as ProductCategory) ? (v as ProductCategory) : "other";
}

function asTaskStatus(v: unknown): TaskStatus {
  return typeof v === "string" && taskStatuses.includes(v as TaskStatus) ? (v as TaskStatus) : "failed";
}

function asTaskStep(v: unknown): TaskStep {
  return typeof v === "string" && taskSteps.includes(v as TaskStep) ? (v as TaskStep) : "init";
}

function asSeverity(v: unknown): Severity {
  return typeof v === "string" && severities.includes(v as Severity) ? (v as Severity) : "info";
}

function asEventType(v: unknown): EventType {
  return typeof v === "string" && eventTypes.includes(v as EventType) ? (v as EventType) : "task_progress";
}

function asPaymentType(v: unknown): PaymentType {
  return typeof v === "string" && paymentTypes.includes(v as PaymentType) ? (v as PaymentType) : "unknown";
}

function asCapabilities(v: unknown): AdapterCapability[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is AdapterCapability => typeof x === "string" && adapterCapabilities.includes(x as AdapterCapability));
}

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const [
    monitorsRes,
    tasksRes,
    addOnsRes,
    profilesRes,
    proxiesRes,
    adaptersRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from("monitors").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").order("last_update_at", { ascending: false }),
    supabase.from("add_ons").select("*").eq("type", "hat").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("proxy_groups").select("*").order("created_at", { ascending: false }),
    supabase.from("adapters").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("at", { ascending: false }).limit(48),
  ]);

  if (
    monitorsRes.error ||
    tasksRes.error ||
    addOnsRes.error ||
    profilesRes.error ||
    proxiesRes.error ||
    adaptersRes.error ||
    eventsRes.error
  ) {
    return NextResponse.json(
      {
        error: "SUPABASE_QUERY_FAILED",
        details: {
          monitors: monitorsRes.error?.message,
          tasks: tasksRes.error?.message,
          add_ons: addOnsRes.error?.message,
          profiles: profilesRes.error?.message,
          proxies: proxiesRes.error?.message,
          adapters: adaptersRes.error?.message,
          events: eventsRes.error?.message,
        },
      },
      { status: 500 }
    );
  }

  const state: KswState = {
    monitors: (monitorsRes.data ?? []).map((m) => ({
      id: String(m.id),
      store: String(m.store),
      storeType: m.store_type === "hybrid" ? "hybrid" : "shopify",
      category: asCategory(m.category),
      query: String(m.query),
      sizes: Array.isArray(m.sizes) ? (m.sizes as string[]) : [],
      enabled: Boolean(m.enabled),
      hitsToday: Number(m.hits_today ?? 0),
      lastHitAt: m.last_hit_at ? new Date(String(m.last_hit_at)).getTime() : undefined,
    })),
    tasks: (tasksRes.data ?? []).map((t) => ({
      id: String(t.id),
      store: String(t.store),
      storeType: t.store_type === "hybrid" ? "hybrid" : "shopify",
      target: String(t.target),
      size: String(t.size),
      addOnIds: Array.isArray(t.add_on_ids) ? (t.add_on_ids as string[]) : [],
      profileName: "",
      proxyGroupName: "",
      status: asTaskStatus(t.status),
      step: asTaskStep(t.step),
      retries: Number(t.retries ?? 0),
      lastHttpStatus: t.last_http_status ? Number(t.last_http_status) : undefined,
      lastUpdateAt: new Date(String(t.last_update_at)).getTime(),
    })),
    hatAddOns: (addOnsRes.data ?? []).map((a) => ({
      id: String(a.id),
      name: String(a.name),
      sku: String(a.sku),
      color: String(a.color),
      priceCents: a.price_cents ? Number(a.price_cents) : undefined,
      store: String(a.store),
      storeType: a.store_type === "hybrid" ? "hybrid" : "shopify",
      enabled: Boolean(a.enabled),
      inStock: Boolean(a.in_stock),
      lastSeenAt: a.last_seen_at ? new Date(String(a.last_seen_at)).getTime() : undefined,
    })),
    profiles: (profilesRes.data ?? []).map((p) => ({
      id: String(p.id),
      name: String(p.name),
      shippingName: String(p.shipping_name),
      country: String(p.country),
      paymentType: asPaymentType(p.payment_type),
      isDefault: Boolean(p.is_default),
    })),
    proxies: (proxiesRes.data ?? []).map((g) => ({
      id: String(g.id),
      name: String(g.name),
      proxiesCount: Number(g.proxies_count ?? 0),
      healthyCount: Number(g.healthy_count ?? 0),
      avgLatencyMs: Number(g.avg_latency_ms ?? 0),
    })),
    adapters: (adaptersRes.data ?? []).map((a) => ({
      id: String(a.id),
      name: String(a.name),
      type: a.type === "hybrid" ? "hybrid" : "shopify",
      connected: Boolean(a.connected),
      capabilities: asCapabilities(a.capabilities),
      lastSyncAt: new Date(String(a.last_sync_at)).getTime(),
    })),
    events: (eventsRes.data ?? []).map((e) => ({
      id: String(e.id),
      type: asEventType(e.type),
      severity: asSeverity(e.severity),
      message: String(e.message),
      at: new Date(String(e.at)).getTime(),
    })),
  };

  const profileNameById = new Map(state.profiles.map((p) => [p.id, p.name]));
  const proxyNameById = new Map(state.proxies.map((p) => [p.id, p.name]));
  const taskProfileIds = new Map((tasksRes.data ?? []).map((t) => [String(t.id), t.profile_id]));
  const taskProxyIds = new Map((tasksRes.data ?? []).map((t) => [String(t.id), t.proxy_group_id]));

  state.tasks = state.tasks.map((t) => {
    const profileId = taskProfileIds.get(t.id);
    const proxyId = taskProxyIds.get(t.id);
    return {
      ...t,
      profileName: profileId ? profileNameById.get(String(profileId)) ?? "" : "",
      proxyGroupName: proxyId ? proxyNameById.get(String(proxyId)) ?? "" : "",
    };
  });

  return NextResponse.json(state);
}
