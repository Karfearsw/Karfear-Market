import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

export async function PATCH(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if (typeof b.enabled !== "boolean") {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const enabled = b.enabled;
  const res = await supabase.from("monitors").update({ enabled }).neq("enabled", enabled);
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: enabled ? "monitor_enabled" : "monitor_disabled",
    severity: "info",
    message: enabled ? "All monitors enabled" : "All monitors disabled",
  });

  return NextResponse.json({ enabled });
}
