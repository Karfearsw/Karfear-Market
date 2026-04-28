import { NextResponse } from "next/server";
import { createAdminClient, getSupabaseAdminEnv } from "@/lib/supabase/admin";

export async function GET() {
  const startedAt = Date.now();
  const env = getSupabaseAdminEnv();
  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, supabase: { configured: false, missing: env.missing }, elapsedMs: Date.now() - startedAt },
      { status: 500 }
    );
  }

  const probe = await supabase.from("engine_state").select("id").eq("id", 1).single();
  if (probe.error) {
    return NextResponse.json(
      {
        ok: false,
        supabase: { configured: true, error: probe.error.message },
        elapsedMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, supabase: { configured: true }, elapsedMs: Date.now() - startedAt },
    { status: 200 }
  );
}

