import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";
import type { TaskStatus, TaskStep } from "@/lib/ksw/types";

const taskStatuses: TaskStatus[] = [
  "queued",
  "running",
  "success",
  "failed",
  "paused",
  "canceled",
];

const taskSteps: TaskStep[] = [
  "init",
  "discover",
  "select_variant",
  "add_to_cart",
  "shipping",
  "payment",
  "submit",
  "done",
];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (typeof b.status === "string" && taskStatuses.includes(b.status as TaskStatus)) {
    patch.status = b.status;
  }

  if (typeof b.step === "string" && taskSteps.includes(b.step as TaskStep)) {
    patch.step = b.step;
  }

  if (typeof b.retries === "number") patch.retries = Math.max(0, Math.floor(b.retries));
  if (typeof b.lastHttpStatus === "number") patch.last_http_status = Math.floor(b.lastHttpStatus);

  if (typeof b.profileId === "string" || b.profileId === null) patch.profile_id = b.profileId;
  if (typeof b.proxyGroupId === "string" || b.proxyGroupId === null) patch.proxy_group_id = b.proxyGroupId;

  if (Array.isArray(b.addOnIds)) {
    patch.add_on_ids = (b.addOnIds as unknown[]).filter((x) => typeof x === "string");
  }

  patch.last_update_at = new Date().toISOString();

  const res = await supabase.from("tasks").update(patch).eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "task_progress",
    severity: "info",
    message: `Task updated: ${id}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;

  const res = await supabase
    .from("tasks")
    .update({ status: "canceled", step: "done", last_update_at: new Date().toISOString() })
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

