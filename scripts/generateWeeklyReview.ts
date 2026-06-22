import { resolveUserId } from "./_env";
import { generateWeeklyReview } from "../lib/analytics/weekly-review";

/** CLI: npm run generate:weekly-review */
async function main() {
  const { supabase, userId } = await resolveUserId();
  const result = await generateWeeklyReview(supabase, userId);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Weekly review failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
