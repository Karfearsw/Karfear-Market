import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  const itemsRes = await supabase
    .from("catalog_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (itemsRes.error) {
    return NextResponse.json(
      { error: "SUPABASE_QUERY_FAILED", details: itemsRes.error.message },
      { status: 500 }
    );
  }

  const ids = (itemsRes.data ?? []).map((i) => i.id);

  const variantsRes = await supabase
    .from("catalog_variants")
    .select("*")
    .in("catalog_item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .order("last_seen_at", { ascending: false })
    .limit(800);

  if (variantsRes.error) {
    return NextResponse.json(
      { error: "SUPABASE_QUERY_FAILED", details: variantsRes.error.message },
      { status: 500 }
    );
  }

  const items = (itemsRes.data ?? [])
    .filter((i) => (category ? String(i.category) === category : true))
    .map((i) => ({
      id: String(i.id),
      name: String(i.name),
      category: String(i.category),
      store: String(i.store),
      storeType: i.store_type === "hybrid" ? "hybrid" : "shopify",
      createdAt: String(i.created_at),
    }));

  const variants = (variantsRes.data ?? []).map((v) => ({
    id: String(v.id),
    catalogItemId: String(v.catalog_item_id),
    sku: String(v.sku),
    size: v.size ? String(v.size) : null,
    color: String(v.color),
    priceCents: v.price_cents ? Number(v.price_cents) : null,
    inStock: Boolean(v.in_stock),
    lastSeenAt: v.last_seen_at ? String(v.last_seen_at) : null,
  }));

  return NextResponse.json({ items, variants });
}
