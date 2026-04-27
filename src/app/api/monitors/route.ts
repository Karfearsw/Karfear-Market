import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const store = typeof b.store === "string" ? b.store : "";
  const storeType = typeof b.storeType === "string" ? b.storeType : "shopify";
  const category = typeof b.category === "string" ? b.category : "other";
  const query = typeof b.query === "string" ? b.query : "";
  const sizes = Array.isArray(b.sizes) ? (b.sizes as unknown[]).filter((s) => typeof s === "string") : [];
  const enabled = typeof b.enabled === "boolean" ? b.enabled : true;

  if (!store || !query) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const res = await supabase
    .from("monitors")
    .insert({
      store,
      store_type: storeType,
      category,
      query,
      sizes,
      enabled,
    })
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_INSERT_FAILED", details: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: String(res.data.id) });
}

