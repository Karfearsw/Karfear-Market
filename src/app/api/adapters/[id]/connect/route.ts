import { NextResponse } from "next/server";
import { request } from "undici";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const adapterRes = await supabase
    .from("adapters")
    .select("id,name,type,base_url,last_sync_at")
    .eq("id", id)
    .single();

  if (adapterRes.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: adapterRes.error.message }, { status: 500 });
  }

  const baseUrl = adapterRes.data.base_url ? normalizeBaseUrl(String(adapterRes.data.base_url)) : "";
  if (!baseUrl) return NextResponse.json({ error: "MISSING_BASE_URL" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as unknown;
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const timeoutMs = typeof b.timeoutMs === "number" ? Math.max(500, Math.floor(b.timeoutMs)) : 5000;
  const probePath = typeof b.probePath === "string" ? b.probePath.trim() : "";

  const probeUrl =
    probePath && probePath.startsWith("http")
      ? probePath
      : adapterRes.data.type === "shopify"
        ? `${baseUrl}${probePath || "/products.json?limit=1"}`
        : `${baseUrl}${probePath || "/"}`;

  const now = new Date().toISOString();

  let connected = false;
  let statusCode: number | null = null;
  let latencyMs: number | null = null;
  let lastError: string | null = null;

  try {
    const start = Date.now();
    const res = await request(probeUrl, {
      method: "GET",
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
    });
    statusCode = res.statusCode;
    connected = statusCode >= 200 && statusCode < 500;
    latencyMs = Date.now() - start;
    try {
      await res.body.dump();
    } catch {}
    if (!connected) lastError = `HTTP_${statusCode}`;
  } catch (err) {
    connected = false;
    lastError = err instanceof Error ? err.message : "REQUEST_FAILED";
  }

  const update = await supabase
    .from("adapters")
    .update({
      connected,
      last_error: lastError,
      last_checked_at: now,
      last_sync_at: connected ? now : adapterRes.data.last_sync_at,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (update.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: update.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: connected ? "adapter_connected" : "adapter_disconnected",
    severity: connected ? "success" : "error",
    message: connected
      ? `Adapter connected: ${String(adapterRes.data.name)}`
      : `Adapter connection failed: ${String(adapterRes.data.name)} (${lastError ?? "unknown"})`,
  });

  return NextResponse.json({
    id: String(update.data.id),
    connected,
    statusCode,
    latencyMs,
    probeUrl,
  });
}
