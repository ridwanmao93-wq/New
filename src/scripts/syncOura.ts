import { syncOuraForDay, syncYesterday } from "../services/oura";

/**
 * CLI: npm run sync:oura            -> syncs yesterday
 *      npm run sync:oura 2026-06-20 -> syncs a specific date
 */
async function main() {
  const dateArg = process.argv[2];
  try {
    const result = dateArg ? await syncOuraForDay(dateArg) : await syncYesterday();
    console.log(`Done: ${result.action} ${result.day}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Oura sync failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
