import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for trusted server-side jobs (Oura sync,
 * weekly review generation, CLI scripts). Bypasses RLS, so it must
 * NEVER be imported into client components.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
