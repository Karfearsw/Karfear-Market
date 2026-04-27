import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;

  const engineRes = await supabase.from("engine_state").select("queue_paused").eq("id", 1).single();
  if (engineRes.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: engineRes.error.message }, { status: 500 });
  }

  const current = await supabase.from("tasks").select("retries").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const retries = Number(current.data.retries ?? 0) + 1;

  const res = await supabase
    .from("tasks")
    .update({
      status: engineRes.data.queue_paused ? "paused" : "queued",
      step: "init",
      retries,
      last_update_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "task_retried",
    severity: "warn",
    message: `Task retried: ${id} (retries=${retries})`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
