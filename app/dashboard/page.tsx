import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard } from "@/components/charts/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const d = await getDashboardData(supabase, user.id);

  const debtRemaining = d.debt?.total_debt_remaining ?? null;
  const savings = d.debt?.savings_balance ?? null;
  const mostImportant = d.todayMomentum?.most_important_action ?? d.todayAvoidance?.hardest_thing_i_did_not_want_to_do;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle={`Your operating system · ${d.td}`} />

      {/* ===== TOP SECTION — orient the day ===== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Sober streak" value={d.currentSoberStreak} suffix=" d" accent />
        <StatCard label="Momentum today" value={d.todayMomentum?.momentum_score} suffix="%" accent />
        <StatCard
          label="Stepping into"
          value={d.latestMorning?.identity_stepping_into ?? "—"}
          accent
        />
        <StatCard label="Debt remaining" value={debtRemaining ? `$${debtRemaining.toLocaleString()}` : "—"} accent />
        <StatCard label="Most important action" value={mostImportant ?? "—"} accent />
      </section>

      {/* ===== Core stats ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Today & this week
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Mood" value={d.todayCbt?.mood_score} />
          <StatCard label="Energy" value={d.todayCbt?.energy_score} />
          <StatCard label="Hopefulness" value={d.todayCbt?.hopefulness_score} />
          <StatCard label="Sleep score" value={d.latestOura?.sleep_score} />
          <StatCard label="Readiness" value={d.latestOura?.readiness_score} />
          <StatCard label="HRV" value={d.latestOura?.hrv} />
          <StatCard label="Resting HR" value={d.latestOura?.resting_heart_rate} />
          <StatCard label="Weight" value={d.latestWeight?.weight_lbs} suffix=" lb" />
          <StatCard label="Workouts (wk)" value={d.workoutsThisWeek} />
          <StatCard label="Hydration" value={d.hydrationPctToday} suffix="%" />
          <StatCard label="Morning CBT (wk)" value={`${d.morningDaysThisWeek}/7`} />
          <StatCard label="Evening CBT (wk)" value={`${d.eveningDaysThisWeek}/7`} />
          <StatCard label="Momentum 7d avg" value={d.momentum7} suffix="%" />
          <StatCard label="Momentum 30d avg" value={d.momentum30} suffix="%" />
        </div>
      </section>

      {/* ===== Sobriety & Identity ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sobriety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Current sober streak" value={`${d.currentSoberStreak} days`} />
            <Row label="Longest sober streak" value={`${d.longestSoberStreak} days`} />
            <Row label="Cannabis-free days this month" value={`${d.cannabisFreeThisMonth}`} />
            <Row label="Avg sleep — sober days" value={fmt(d.sleepSober)} />
            <Row label="Avg sleep — cannabis days" value={fmt(d.sleepCannabis)} />
            <Row label="Avg mood — sober days" value={fmt(d.moodSober)} />
            <Row label="Avg mood — cannabis days" value={fmt(d.moodCannabis)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Releasing</div>
              <div className="text-base">{d.latestMorning?.identity_releasing ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Stepping into</div>
              <div className="text-base">{d.latestMorning?.identity_stepping_into ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Common themes over time</div>
              <div className="flex flex-wrap gap-2 pt-1">
                {d.identityThemes.length ? (
                  d.identityThemes.map((t) => (
                    <span key={t.word} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                      {t.word} · {t.count}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">Keep logging to surface themes.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ===== Debt & savings ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Debt Freedom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row label="Total debt remaining" value={debtRemaining != null ? `$${debtRemaining.toLocaleString()}` : "—"} />
            <Row label="Debt paid this month" value={d.debt?.debt_paid_this_month != null ? `$${d.debt.debt_paid_this_month.toLocaleString()}` : "—"} />
            <Row label="Savings balance" value={savings != null ? `$${savings.toLocaleString()}` : "—"} />
            <Row label="Emergency fund" value={d.debt?.emergency_fund_balance != null ? `$${d.debt.emergency_fund_balance.toLocaleString()}` : "—"} />
            <p className="text-xs text-muted-foreground">
              Set targets and progress bars on the <a href="/future-self" className="text-primary underline">Future Self</a> page.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Relationship touches" value={`${d.relationshipTouchesThisWeek}`} />
            <Row label="Avoidance wins" value={`${d.avoidanceWinsThisWeek}`} />
            <Row label="Avoidance misses" value={`${d.avoidanceMissesThisWeek}`} />
            <Row label="Current courage streak" value={`${d.courageStreak} days`} />
          </CardContent>
        </Card>
      </section>

      {/* ===== Charts ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Trends
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Mood · 7 days" data={d.series.mood} domain={[0, 10]} />
          <ChartCard title="Mood · 30 days" data={d.series.mood30} domain={[0, 10]} />
          <ChartCard title="Energy · 7 days" data={d.series.energy} domain={[0, 10]} color="hsl(45 93% 58%)" />
          <ChartCard title="Hopefulness · 7 days" data={d.series.hopefulness} domain={[0, 10]} color="hsl(150 70% 55%)" />
          <ChartCard title="Momentum · 30 days" data={d.series.momentum} domain={[0, 100]} color="hsl(199 89% 58%)" />
          <ChartCard title="Sleep score · 30 days" data={d.series.sleep} color="hsl(199 89% 58%)" />
          <ChartCard title="Readiness · 30 days" data={d.series.readiness} color="hsl(150 70% 55%)" />
          <ChartCard title="HRV · 30 days" data={d.series.hrv} color="hsl(280 70% 65%)" />
          <ChartCard title="Weight · 30 days" data={d.series.weight} color="hsl(45 93% 58%)" />
          <ChartCard title="Hydration % · 7 days" data={d.series.hydration} domain={[0, 120]} />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function fmt(v: number | null) {
  return v == null ? "—" : String(v);
}
