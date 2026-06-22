import { resolveUserId } from "./_env";
import { syncOura } from "../lib/oura/sync";

/**
 * CLI: npm run sync:oura                    -> yesterday
 *      npm run sync:oura 2026-06-01 2026-06-07 -> backfill a range
 */
async function main() {
  const [start, end] = process.argv.slice(2);
  const { supabase, userId } = await resolveUserId();
  const result = await syncOura(supabase, userId, {
    startDate: start || undefined,
    endDate: end || start || undefined,
  });
  console.log(`Done: synced ${result.synced} day(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Oura sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
