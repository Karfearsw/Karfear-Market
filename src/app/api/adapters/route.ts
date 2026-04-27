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

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const type = typeof b.type === "string" ? (b.type as StoreType) : "shopify";
  const baseUrl = typeof b.baseUrl === "string" ? b.baseUrl.trim() : "";
  const caps = Array.isArray(b.capabilities)
    ? (b.capabilities as unknown[]).filter((x): x is AdapterCapability => typeof x === "string" && capabilities.includes(x as AdapterCapability))
    : [];
  const config = b.config && typeof b.config === "object" && !Array.isArray(b.config) ? b.config : {};

  if (!name || !storeTypes.includes(type) || (baseUrl && !isHttpUrl(baseUrl))) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const res = await supabase
    .from("adapters")
    .insert({
      name,
      type,
      base_url: baseUrl || null,
      config,
      connected: false,
      last_error: null,
      last_checked_at: null,
      capabilities: caps,
      last_sync_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_INSERT_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "adapter_created",
    severity: "success",
    message: `Adapter created: ${name}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
