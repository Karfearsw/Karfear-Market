import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";
import type { AdapterCapability, StoreType } from "@/lib/ksw/types";

const storeTypes: StoreType[] = ["shopify", "hybrid"];
const capabilities: AdapterCapability[] = [
  "product_discovery",
  "variant_parse",
  "add_to_cart",
  "checkout",
  "anti_bot",
];

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const current = await supabase.from("adapters").select("name").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof b.name === "string") patch.name = b.name.trim();
  if (typeof b.type === "string" && storeTypes.includes(b.type as StoreType)) patch.type = b.type;

  if (typeof b.baseUrl === "string") {
    const baseUrl = b.baseUrl.trim();
    if (baseUrl && !isHttpUrl(baseUrl)) {
      return NextResponse.json({ error: "INVALID_BASE_URL" }, { status: 400 });
    }
    patch.base_url = baseUrl || null;
  }

  if (Array.isArray(b.capabilities)) {
    patch.capabilities = (b.capabilities as unknown[]).filter(
      (x): x is AdapterCapability => typeof x === "string" && capabilities.includes(x as AdapterCapability)
    );
  }

  if (b.config && typeof b.config === "object" && !Array.isArray(b.config)) {
    patch.config = b.config;
  }

  const res = await supabase.from("adapters").update(patch).eq("id", id).select("id,name").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "adapter_updated",
    severity: "info",
    message: `Adapter updated: ${String(current.data.name)}`,
  });

  return NextResponse.json({ id: String(res.data.id), name: String(res.data.name) });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const current = await supabase.from("adapters").select("name").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const res = await supabase.from("adapters").delete().eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_DELETE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "adapter_updated",
    severity: "warn",
    message: `Adapter deleted: ${String(current.data.name)}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
