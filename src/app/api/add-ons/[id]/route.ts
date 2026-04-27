import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 400 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
  if (typeof b.inStock === "boolean") {
    patch.in_stock = b.inStock;
    patch.last_seen_at = b.inStock ? new Date().toISOString() : null;
  }

  if (typeof b.priceCents === "number") patch.price_cents = Math.round(b.priceCents);

  const res = await supabase.from("add_ons").update(patch).eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: String(res.data.id) });
}

