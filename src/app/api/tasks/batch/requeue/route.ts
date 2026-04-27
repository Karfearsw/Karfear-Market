import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

export async function POST() {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const engineRes = await supabase.from("engine_state").select("queue_paused").eq("id", 1).single();
  if (engineRes.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: engineRes.error.message }, { status: 500 });
  }
  if (engineRes.data.queue_paused) {
    return NextResponse.json({ error: "QUEUE_PAUSED" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const res = await supabase
    .from("tasks")
    .update({ status: "queued", last_update_at: now })
    .eq("status", "paused");

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "task_progress",
    severity: "info",
    message: "Paused tasks requeued",
  });

  return NextResponse.json({ ok: true });
}
