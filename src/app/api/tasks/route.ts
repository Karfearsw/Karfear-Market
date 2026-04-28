import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

const storeTypes = ["shopify", "hybrid"] as const;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const store = typeof b.store === "string" ? b.store.trim() : "";
  const storeType = typeof b.storeType === "string" ? b.storeType : "";
  const target = typeof b.target === "string" ? b.target.trim() : "";
  const size = typeof b.size === "string" ? b.size.trim() : "";
  const addOnIdsRaw = Array.isArray(b.addOnIds)
    ? (b.addOnIds as unknown[]).filter((x) => typeof x === "string")
    : [];
  const addOnIds = Array.from(new Set(addOnIdsRaw));
  const profileId = typeof b.profileId === "string" ? b.profileId : null;
  const proxyGroupId = typeof b.proxyGroupId === "string" ? b.proxyGroupId : null;

  if (!store || !target || !size) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (!storeTypes.includes(storeType as (typeof storeTypes)[number])) {
    return NextResponse.json({ error: "INVALID_STORE_TYPE" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const engineRes = await supabase.from("engine_state").select("queue_paused").eq("id", 1).single();
  if (engineRes.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: engineRes.error.message }, { status: 500 });
  }

  if (profileId) {
    const profileRes = await supabase.from("profiles").select("id").eq("id", profileId).single();
    if (profileRes.error) {
      return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 400 });
    }
  }

  if (proxyGroupId) {
    const proxyRes = await supabase.from("proxy_groups").select("id").eq("id", proxyGroupId).single();
    if (proxyRes.error) {
      return NextResponse.json({ error: "PROXY_GROUP_NOT_FOUND" }, { status: 400 });
    }
  }

  if (addOnIds.length) {
    const addOnsRes = await supabase
      .from("add_ons")
      .select("id")
      .eq("type", "hat")
      .in("id", addOnIds);

    if (addOnsRes.error) {
      return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: addOnsRes.error.message }, { status: 500 });
    }

    const found = new Set((addOnsRes.data ?? []).map((r) => String(r.id)));
    const missing = addOnIds.filter((id) => !found.has(id));
    if (missing.length) {
      return NextResponse.json({ error: "ADD_ON_NOT_FOUND" }, { status: 400 });
    }
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
      status: engineRes.data.queue_paused ? "paused" : "queued",
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

  await insertEvent(supabase, {
    type: "task_created",
    severity: "success",
    message: `Task created: ${store} • ${target}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
