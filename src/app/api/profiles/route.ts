import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertEvent } from "@/lib/supabase/events";
import type { PaymentType } from "@/lib/ksw/types";

const paymentTypes: PaymentType[] = ["card", "paypal", "crypto", "unknown"];

export async function POST(req: Request) {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const shippingName = typeof b.shippingName === "string" ? b.shippingName.trim() : "";
  const country = typeof b.country === "string" ? b.country.trim() : "";
  const paymentType = typeof b.paymentType === "string" ? (b.paymentType as PaymentType) : "unknown";
  const isDefault = typeof b.isDefault === "boolean" ? b.isDefault : false;

  if (!name || !shippingName || !country || !paymentTypes.includes(paymentType)) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (isDefault) {
    await supabase.from("profiles").update({ is_default: false }).neq("is_default", false);
  }

  const res = await supabase
    .from("profiles")
    .insert({
      name,
      shipping_name: shippingName,
      country,
      payment_type: paymentType,
      is_default: isDefault,
    })
    .select("id")
    .single();

  if (res.error) {
    return NextResponse.json({ error: "SUPABASE_INSERT_FAILED", details: res.error.message }, { status: 500 });
  }

  await insertEvent(supabase, {
    type: "profile_created",
    severity: "success",
    message: `Profile created: ${name}`,
  });

  return NextResponse.json({ id: String(res.data.id) });
}

