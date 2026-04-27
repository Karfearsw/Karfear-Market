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
  if (typeof b.queuePaused !== "boolean") {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const queuePaused = b.queuePaused;
  const now = new Date().toISOString();

  const res = await supabase
    .from("engine_state")
    .upsert({ id: 1, queue_paused: queuePaused, updated_at: now }, { onConflict: "id" })
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: queuePaused ? "queue_paused" : "queue_resumed",
    severity: "info",
    message: queuePaused ? "Task queue paused" : "Task queue resumed",
  });

  return NextResponse.json({ id: String(res.data.id), queuePaused });
}
