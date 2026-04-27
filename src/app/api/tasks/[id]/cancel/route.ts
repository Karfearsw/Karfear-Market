import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;

  const res = await supabase
    .from("tasks")
    .update({
      status: "canceled",
      step: "done",
      last_update_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "task_canceled",
    severity: "warn",
    message: `Task canceled: ${id}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}
