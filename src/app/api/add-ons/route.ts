import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";
import type { StoreType } from "@/lib/ksw/types";

const storeTypes: StoreType[] = ["shopify", "hybrid"];

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const type = typeof b.type === "string" ? b.type : "hat";
  const name = typeof b.name === "string" ? b.name : "";
  const sku = typeof b.sku === "string" ? b.sku : "";
  const color = typeof b.color === "string" ? b.color : "";
  const store = typeof b.store === "string" ? b.store : "";
  const storeType = typeof b.storeType === "string" ? (b.storeType as StoreType) : "shopify";
  const enabled = typeof b.enabled === "boolean" ? b.enabled : true;
  const inStock = typeof b.inStock === "boolean" ? b.inStock : false;
  const priceCents = typeof b.priceCents === "number" ? Math.round(b.priceCents) : null;

  if (!name || !sku || !color || !store || type !== "hat" || !storeTypes.includes(storeType)) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const res = await supabase
    .from("add_ons")
    .insert({
      type,
      name,
      sku,
      color,
      price_cents: priceCents,
      store,
      store_type: storeType,
      enabled,
      in_stock: inStock,
      last_seen_at: inStock ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_INSERT_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "add_on_created",
    severity: "success",
    message: `Add-on created: ${name}`,
  });

  if (inStock) {
    await insertEvent(supabase, {
      type: "hat_restock",
      severity: "info",
      message: `Hat in stock: ${name}`,
    });
  }

  return NextResponse.json({ id: String(res.data.id) });
}
