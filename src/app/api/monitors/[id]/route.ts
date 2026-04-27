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
  if (typeof b.query === "string") patch.query = b.query;
  if (typeof b.category === "string") patch.category = b.category;
  if (Array.isArray(b.sizes)) {
    patch.sizes = (b.sizes as unknown[]).filter((s) => typeof s === "string");
  }

  const res = await supabase.from("monitors").update(patch).eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: String(res.data.id) });
}

