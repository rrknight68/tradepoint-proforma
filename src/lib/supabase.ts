import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

export const supabase = createClient(url, anonKey);
const adminClient = createClient(url, serviceKey);

export async function getAssumptions(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("tp_assumptions")
    .select("key, value");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export async function saveAssumptions(
  pairs: Record<string, string>
): Promise<void> {
  const rows = Object.entries(pairs).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await adminClient
    .from("tp_assumptions")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
}
