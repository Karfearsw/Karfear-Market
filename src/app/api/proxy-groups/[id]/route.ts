import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

  const res = await supabase.from("proxy_groups").update({ name }).eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "proxy_group_updated",
    severity: "info",
    message: `Proxy group updated: ${name}`,
  });

  return NextResponse.json({ id: String(res.data.id), name });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const current = await supabase.from("proxy_groups").select("name").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const res = await supabase.from("proxy_groups").delete().eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_DELETE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "proxy_group_updated",
    severity: "warn",
    message: `Proxy group deleted: ${String(current.data.name)}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
