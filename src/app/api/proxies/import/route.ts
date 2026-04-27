import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

type ParsedProxy = {
  host: string;
  port: number;
  username: string | null;
  password: string | null;
};

function parseProxy(line: string): ParsedProxy | null {
  const raw = line.trim();
  if (!raw) return null;

  if (raw.includes("@")) {
    const [auth, hostPort] = raw.split("@");
    if (!auth || !hostPort) return null;
    const [username, password] = auth.split(":");
    const [host, portStr] = hostPort.split(":");
    const port = Number(portStr);
    if (!host || !Number.isFinite(port)) return null;
    return { host, port, username: username ?? null, password: password ?? null };
  }

  const parts = raw.split(":");
  if (parts.length === 2) {
    const [host, portStr] = parts;
    const port = Number(portStr);
    if (!host || !Number.isFinite(port)) return null;
    return { host, port, username: null, password: null };
  }

  if (parts.length === 4) {
    const [host, portStr, username, password] = parts;
    const port = Number(portStr);
    if (!host || !Number.isFinite(port) || !username || !password) return null;
    return { host, port, username, password };
  }

  return null;
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const raw = typeof b.raw === "string" ? b.raw : "";
  const groupId = typeof b.groupId === "string" ? b.groupId : null;
  const groupName = typeof b.groupName === "string" ? b.groupName.trim() : "";

  if (!raw) return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });

  const parsed = raw
    .split(/\r?\n/g)
    .map(parseProxy)
    .filter((p): p is ParsedProxy => Boolean(p));

  if (!parsed.length) return NextResponse.json({ error: "NO_VALID_PROXIES" }, { status: 400 });

  let resolvedGroupId = groupId;

  if (!resolvedGroupId) {
    if (!groupName) return NextResponse.json({ error: "MISSING_GROUP" }, { status: 400 });

    const existing = await supabase.from("proxy_groups").select("id").eq("name", groupName).single();
    if (!existing.error) resolvedGroupId = String(existing.data.id);

    if (!resolvedGroupId) {
      const created = await supabase
        .from("proxy_groups")
        .insert({ name: groupName })
        .select("id")
        .single();
      if (created.error) {
        return NextResponse.json(
          { error: "SUPABASE_INSERT_FAILED", details: created.error.message },
          { status: 500 }
        );
      }
      resolvedGroupId = String(created.data.id);
    }
  }

  const rows = parsed.map((p) => ({
    proxy_group_id: resolvedGroupId,
    host: p.host,
    port: p.port,
    username: p.username,
    password: p.password,
  }));

  const inserted = await supabase.from("proxies").insert(rows).select("id");
  if (inserted.error) {
    return NextResponse.json({ error: "SUPABASE_INSERT_FAILED", details: inserted.error.message }, { status: 500 });
  }

  const countRes = await supabase
    .from("proxies")
    .select("id", { count: "exact", head: true })
    .eq("proxy_group_id", resolvedGroupId);

  if (countRes.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: countRes.error.message }, { status: 500 });
  }

  const proxiesCount = Number(countRes.count ?? 0);

  const updated = await supabase
    .from("proxy_groups")
    .update({ proxies_count: proxiesCount })
    .eq("id", resolvedGroupId)
    .select("id")
    .single();

  if (updated.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: updated.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "proxies_imported",
    severity: "success",
    message: `Imported ${rows.length} proxies into group ${resolvedGroupId}`,
  });

  return NextResponse.json({ groupId: resolvedGroupId, inserted: rows.length });
}

