import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventType, Severity } from "@/lib/ksw/types";

export async function insertEvent(
  supabase: SupabaseClient,
  input: { type: EventType; severity: Severity; message: string; at?: string }
) {
  const at = input.at ?? new Date().toISOString();
  await supabase.from("events").insert({ type: input.type, severity: input.severity, message: input.message, at });
}

