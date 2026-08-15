import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { today } from "@/lib/dates";
import { QuickCheckIn } from "@/components/dashboard/quick-check-in";

export const dynamic = "force-dynamic";

/**
 * The distraction-free daily floor. Just the 30-second check-in on a bare
 * screen — ideal as a phone home-screen shortcut or the target of a morning
 * reminder. Everything else lives one tap away on the Command Center.
 */
export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const td = today();

  // Lightweight: only today's two rows, and never brick on a missing table.
  const [avoidanceRes, momentumRes] = await Promise.all([
    supabase
      .from("anti_avoidance_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", td)
      .maybeSingle(),
    supabase
      .from("daily_momentum_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", td)
      .maybeSingle(),
  ]);

  const avoidance = avoidanceRes.data ?? undefined;
  const momentum = momentumRes.data ?? undefined;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The only thing that has to happen. Do this, and today counts.
        </p>
      </div>

      <QuickCheckIn
        date={td}
        hardThing={
          avoidance?.hardest_thing_i_did_not_want_to_do ??
          momentum?.most_important_action ??
          undefined
        }
        didIt={avoidance?.did_i_do_it ?? false}
        momentum={momentum}
        standalone
      />

      <div className="text-center text-sm">
        <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">
          Open the full Command Center →
        </Link>
      </div>
    </div>
  );
}
