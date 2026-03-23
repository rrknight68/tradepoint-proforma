import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

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
  const { error } = await supabase
    .from("tp_assumptions")
    .upsert(rows, { onConflict: "key" });
  if (error) throw error;
}
