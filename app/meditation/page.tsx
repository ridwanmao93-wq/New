import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lastNDays } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { MeditationTimer } from "@/components/meditation/meditation-timer";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MeditationPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = lastNDays(7)[0];
  const today = lastNDays(1)[0];
  const { data: sessions } = await supabase
    .from("meditation_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const all = sessions ?? [];
  const minsToday = all.filter((s) => String(s.date) === today).reduce((a, s) => a + (s.minutes || 0), 0);
  const minsWeek = all
    .filter((s) => String(s.date) >= weekStart)
    .reduce((a, s) => a + (s.minutes || 0), 0);
  const daysWeek = new Set(all.filter((s) => String(s.date) >= weekStart).map((s) => String(s.date))).size;

  return (
    <div className="space-y-6">
      <PageHeader title="Meditation" subtitle="A few quiet minutes. The most common habit of high performers." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Today" value={minsToday} suffix=" min" accent />
        <StatCard label="This week" value={minsWeek} suffix=" min" />
        <StatCard label="Days this week" value={`${daysWeek}/7`} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sit</CardTitle>
        </CardHeader>
        <CardContent>
          <MeditationTimer />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {all.length ? (
            <table className="w-full text-sm">
              <tbody>
                {all.slice(0, 15).map((s) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5 text-muted-foreground">{s.date}</td>
                    <td className="py-1.5 text-right font-medium">{s.minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No sessions yet. Pick a length and begin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
