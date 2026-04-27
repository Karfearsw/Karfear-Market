import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";
import type { PaymentType } from "@/lib/ksw/types";

const paymentTypes: PaymentType[] = ["card", "paypal", "crypto", "unknown"];

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
  let setDefault = false;

  if (typeof b.name === "string") patch.name = b.name.trim();
  if (typeof b.shippingName === "string") patch.shipping_name = b.shippingName.trim();
  if (typeof b.country === "string") patch.country = b.country.trim();
  if (typeof b.paymentType === "string" && paymentTypes.includes(b.paymentType as PaymentType)) {
    patch.payment_type = b.paymentType;
  }

  if (typeof b.isDefault === "boolean") {
    patch.is_default = b.isDefault;
    setDefault = b.isDefault;
  }

  if (setDefault) {
    await supabase.from("profiles").update({ is_default: false }).neq("id", id);
  }

  const res = await supabase.from("profiles").update(patch).eq("id", id).select("id,name").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_UPDATE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "profile_updated",
    severity: "info",
    message: `Profile updated: ${String(res.data.name)}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const { id } = await ctx.params;

  const current = await supabase.from("profiles").select("name").eq("id", id).single();
  if (current.error) {
    return NextResponse.json({ error: "SUPABASE_QUERY_FAILED", details: current.error.message }, { status: 500 });
  }

  const res = await supabase.from("profiles").delete().eq("id", id).select("id").single();
  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_DELETE_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "profile_deleted",
    severity: "warn",
    message: `Profile deleted: ${String(current.data.name)}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}

