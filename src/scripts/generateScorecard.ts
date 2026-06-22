import { generateWeeklyScorecard } from "../services/weeklyScorecard";

/** CLI: npm run scorecard -> generates the weekly scorecard. */
async function main() {
  try {
    const result = await generateWeeklyScorecard();
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("❌ Scorecard generation failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
