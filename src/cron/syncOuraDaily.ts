import cron from "node-cron";
import { env } from "../config/env";
import { syncYesterday } from "../services/oura";

/**
 * Schedule the daily Oura sync. Runs once per day (default 06:00 server
 * time, configurable via OURA_SYNC_CRON) and syncs *yesterday's* data,
 * since the current day's Oura metrics are typically incomplete until
 * the ring syncs after a night's sleep.
 */
export function startOuraCron(): void {
  if (!env.CRON_ENABLED) {
    console.log("⏸️  CRON_ENABLED=false — daily Oura sync is disabled.");
    return;
  }
  if (!env.OURA_ACCESS_TOKEN) {
    console.log("⏸️  OURA_ACCESS_TOKEN missing — daily Oura sync will not run.");
    return;
  }
  if (!cron.validate(env.OURA_SYNC_CRON)) {
    console.error(`❌ Invalid OURA_SYNC_CRON "${env.OURA_SYNC_CRON}" — cron not started.`);
    return;
  }

  cron.schedule(env.OURA_SYNC_CRON, async () => {
    console.log(`⏰ Cron triggered: daily Oura sync (${new Date().toISOString()})`);
    try {
      await syncYesterday();
    } catch (err) {
      console.error("❌ Scheduled Oura sync failed:", err);
    }
  });

  console.log(`⏰ Daily Oura sync scheduled with cron "${env.OURA_SYNC_CRON}".`);
}
