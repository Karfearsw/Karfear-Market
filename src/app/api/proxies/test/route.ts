import { NextResponse } from "next/server";
import { ProxyAgent, request } from "undici";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

type ProxyRow = {
  id: string;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
};

function proxyUrl(p: ProxyRow) {
  if (p.username && p.password) {
    const u = encodeURIComponent(p.username);
    const pw = encodeURIComponent(p.password);
    return `http://${u}:${pw}@${p.host}:${p.port}`;
  }
  return `http://${p.host}:${p.port}`;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const proxyGroupId = typeof b.proxyGroupId === "string" ? b.proxyGroupId : "";
  const testUrl = typeof b.testUrl === "string" ? b.testUrl : "https://example.com/";
  const timeoutMs = typeof b.timeoutMs === "number" ? Math.max(500, Math.floor(b.timeoutMs)) : 5000;
  const concurrency = typeof b.concurrency === "number" ? Math.max(1, Math.floor(b.concurrency)) : 5;

  if (!proxyGroupId) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

  const proxiesRes = await supabase
    .from("proxies")
    .select("id,host,port,username,password")
    .eq("proxy_group_id", proxyGroupId)
    .limit(800);

  if (proxiesRes.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: proxiesRes.error.message }, { status: 500 });
  }

  const proxies = (proxiesRes.data ?? []) as ProxyRow[];
  if (!proxies.length) return NextResponse.json({ error: "NO_PROXIES" }, { status: 400 });

  const now = new Date().toISOString();

  const results = await mapLimit(proxies, concurrency, async (p) => {
    const start = Date.now();
    let healthy = false;
    let latency: number | null = null;

    try {
      const agent = new ProxyAgent(proxyUrl(p));
      const res = await request(testUrl, {
        dispatcher: agent,
        method: "GET",
        headersTimeout: timeoutMs,
        bodyTimeout: timeoutMs,
      });

      const status = res.statusCode;
      healthy = status >= 200 && status < 500;
      latency = Date.now() - start;
      try {
        await res.body.dump();
      } catch {}
      try {
        agent.close();
      } catch {}
    } catch {
      healthy = false;
      latency = null;
    }

    const update = await supabase
      .from("proxies")
      .update({
        healthy,
        last_latency_ms: latency,
        last_checked_at: now,
      })
      .eq("id", p.id);

    if (update.error) {
      healthy = false;
      latency = null;
    }

    return { healthy, latency };
  });

  const healthyLatencies = results
    .filter((r) => r.healthy && typeof r.latency === "number")
    .map((r) => r.latency as number);

  const healthyCount = results.filter((r) => r.healthy).length;
  const avgLatencyMs = healthyLatencies.length
    ? Math.round(healthyLatencies.reduce((a, b) => a + b, 0) / healthyLatencies.length)
    : 0;

  const updated = await supabase
    .from("proxy_groups")
    .update({
      proxies_count: proxies.length,
      healthy_count: healthyCount,
      avg_latency_ms: avgLatencyMs,
    })
    .eq("id", proxyGroupId)
    .select("id")
    .single();

  if (updated.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: updated.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "proxies_tested",
    severity: "info",
    message: `Proxies tested for group ${proxyGroupId}: ${healthyCount}/${proxies.length} healthy`,
  });

  return NextResponse.json({ proxyGroupId, proxiesCount: proxies.length, healthyCount, avgLatencyMs });
}

