import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Centralised, validated environment configuration.
 * The app refuses to start if required secrets are missing so that
 * misconfiguration fails fast and loudly instead of at request time.
 */
const envSchema = z.object({
  AIRTABLE_API_KEY: z.string().min(1, "AIRTABLE_API_KEY is required"),
  AIRTABLE_BASE_ID: z.string().min(1, "AIRTABLE_BASE_ID is required"),

  AIRTABLE_DAILY_HEALTH_TABLE: z.string().default("Daily Health Metrics"),
  AIRTABLE_CBT_MORNING_TABLE: z.string().default("CBT Morning Entries"),
  AIRTABLE_CBT_EVENING_TABLE: z.string().default("CBT Evening Entries"),
  AIRTABLE_WORKOUTS_TABLE: z.string().default("Workouts"),
  AIRTABLE_WEIGHT_TABLE: z.string().default("Weight Tracking"),
  AIRTABLE_HYDRATION_TABLE: z.string().default("Hydration"),
  AIRTABLE_WEEKLY_SCORECARD_TABLE: z.string().default("Weekly Scorecard"),

  OURA_ACCESS_TOKEN: z.string().optional().default(""),

  PORT: z.coerce.number().default(3000),
  CRON_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v.toLowerCase() === "true"),
  OURA_SYNC_CRON: z.string().default("0 6 * * *"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

export const env = parsed.data;

export const tables = {
  dailyHealth: env.AIRTABLE_DAILY_HEALTH_TABLE,
  cbtMorning: env.AIRTABLE_CBT_MORNING_TABLE,
  cbtEvening: env.AIRTABLE_CBT_EVENING_TABLE,
  workouts: env.AIRTABLE_WORKOUTS_TABLE,
  weight: env.AIRTABLE_WEIGHT_TABLE,
  hydration: env.AIRTABLE_HYDRATION_TABLE,
  weeklyScorecard: env.AIRTABLE_WEEKLY_SCORECARD_TABLE,
} as const;
