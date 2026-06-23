import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lastNDays } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { FocusTimer } from "@/components/focus/focus-timer";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = lastNDays(7)[0];
  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const all = sessions ?? [];
  const today = lastNDays(1)[0];
  const minsToday = all.filter((s) => String(s.date) === today).reduce((a, s) => a + (s.minutes || 0), 0);
  const minsWeek = all
    .filter((s) => String(s.date) >= weekStart)
    .reduce((a, s) => a + (s.minutes || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Focus" subtitle="Deep work is the input that builds everything else." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Focus today" value={minsToday} suffix=" min" accent />
        <StatCard label="Focus this week" value={minsWeek} suffix=" min" />
        <StatCard label="Hours this week" value={Math.round((minsWeek / 60) * 10) / 10} suffix=" h" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Deep work timer</CardTitle>
        </CardHeader>
        <CardContent>
          <FocusTimer />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {all.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground">Date</th>
                  <th className="text-left font-medium text-muted-foreground">Focus</th>
                  <th className="text-right font-medium text-muted-foreground">Min</th>
                </tr>
              </thead>
              <tbody>
                {all.slice(0, 15).map((s) => (
                  <tr key={s.id} className="border-t border-border/50">
                    <td className="py-1.5">{s.date}</td>
                    <td className="py-1.5">{s.focus_area ?? "—"}</td>
                    <td className="py-1.5 text-right">{s.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No focus sessions yet. Start the timer above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
