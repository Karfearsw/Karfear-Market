import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const current = await supabase.from("add_ons").select("name,in_stock").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  let becameInStock = false;

  if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
  if (typeof b.inStock === "boolean") {
    patch.in_stock = b.inStock;
    patch.last_seen_at = b.inStock ? new Date().toISOString() : null;
    becameInStock = b.inStock && !Boolean(current.data.in_stock);
  }

  if (typeof b.priceCents === "number") patch.price_cents = Math.round(b.priceCents);

  const res = await supabase.from("add_ons").update(patch).eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "add_on_updated",
    severity: "info",
    message: `Add-on updated: ${String(current.data.name)}`,
  });

  if (becameInStock) {
    await insertEvent(supabase, {
      type: "hat_restock",
      severity: "success",
      message: `Hat in stock: ${String(current.data.name)}`,
    });
  }

  return NextResponse.json({ id: String(res.data.id) });
}
