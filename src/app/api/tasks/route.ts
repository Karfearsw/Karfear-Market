import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const store = typeof b.store === "string" ? b.store : "";
  const storeType = typeof b.storeType === "string" ? b.storeType : "shopify";
  const target = typeof b.target === "string" ? b.target : "";
  const size = typeof b.size === "string" ? b.size : "OS";
  const addOnIds = Array.isArray(b.addOnIds)
    ? (b.addOnIds as unknown[]).filter((x) => typeof x === "string")
    : [];
  const profileId = typeof b.profileId === "string" ? b.profileId : null;
  const proxyGroupId = typeof b.proxyGroupId === "string" ? b.proxyGroupId : null;

  if (!store || !target) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const res = await supabase
    .from("tasks")
    .insert({
      store,
      store_type: storeType,
      target,
      size,
      add_on_ids: addOnIds,
      profile_id: profileId,
      proxy_group_id: proxyGroupId,
      status: "queued",
      step: "init",
      retries: 0,
      last_http_status: null,
      last_update_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_INSERT_FAILED", details: res.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: String(res.data.id) });
}
