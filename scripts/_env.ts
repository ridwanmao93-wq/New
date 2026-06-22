import dotenv from "dotenv";

// Load .env.local first (Next.js convention), then .env as fallback.
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "../lib/supabase/admin";

/**
 * Resolve the target user for CLI jobs. Single-user app: use
 * DASHBOARD_USER_ID if set, otherwise the first profile row.
 */
export async function resolveUserId(): Promise<{ supabase: ReturnType<typeof createAdminClient>; userId: string }> {
  const supabase = createAdminClient();
  if (process.env.DASHBOARD_USER_ID) {
    return { supabase, userId: process.env.DASHBOARD_USER_ID };
  }
  const { data, error } = await supabase.from("profiles").select("id").limit(1);
  if (error) throw new Error(`Could not read profiles: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("No profile found. Sign in to the app once, or set DASHBOARD_USER_ID.");
  }
  return { supabase, userId: data[0].id as string };
}
