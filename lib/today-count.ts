import type { SupabaseClient } from "@supabase/supabase-js";
import { today } from "@/lib/dates";

/** How many rows the user has logged in `table` for today (by date column). */
export async function countToday(
  supabase: SupabaseClient,
  userId: string,
  table: string
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", today());
  return count ?? 0;
}
