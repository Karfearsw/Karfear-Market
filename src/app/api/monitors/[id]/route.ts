import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";
import type { ProductCategory, StoreType } from "@/lib/ksw/types";

const storeTypes: StoreType[] = ["shopify", "hybrid"];
const categories: ProductCategory[] = [
  "tops",
  "shoes",
  "pants",
  "hats",
  "outerwear",
  "accessories",
  "other",
];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const current = await supabase.from("monitors").select("enabled,query").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  let enabledChanged: boolean | null = null;

  if (typeof b.store === "string") patch.store = b.store;
  if (typeof b.storeType === "string" && storeTypes.includes(b.storeType as StoreType)) {
    patch.store_type = b.storeType;
  }
  if (typeof b.enabled === "boolean") {
    patch.enabled = b.enabled;
    enabledChanged = b.enabled !== Boolean(current.data.enabled);
  }
  if (typeof b.query === "string") patch.query = b.query;
  if (typeof b.category === "string" && categories.includes(b.category as ProductCategory)) {
    patch.category = b.category;
  }
  if (Array.isArray(b.sizes)) {
    patch.sizes = (b.sizes as unknown[]).filter((s) => typeof s === "string");
  }

  const res = await supabase.from("monitors").update(patch).eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  const enabled = typeof patch.enabled === "boolean" ? (patch.enabled as boolean) : Boolean(current.data.enabled);
  const eventType = enabledChanged ? (enabled ? "monitor_enabled" : "monitor_disabled") : "monitor_updated";
  await insertEvent(supabase, {
    type: eventType,
    severity: "info",
    message: `Monitor updated: ${String(current.data.query)}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
