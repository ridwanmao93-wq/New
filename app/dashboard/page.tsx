import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { ChartCard } from "@/components/charts/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let d: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    d = await getDashboardData(supabase, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <div className="space-y-4">
        <PageHeader title="Command Center" subtitle="Couldn’t load your data" />
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <p className="text-red-400">⚠️ {message}</p>
            <p className="text-muted-foreground">
              If you just added a feature, make sure the latest SQL migrations have been run in
              Supabase. Otherwise try again, or visit <Link className="text-primary underline" href="/api/health">/api/health</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const debtRemaining = d.debt?.total_debt_remaining ?? null;
  const savings = d.debt?.savings_balance ?? null;
  const mostImportant =
    d.todayMomentum?.most_important_action ?? d.todayAvoidance?.hardest_thing_i_did_not_want_to_do;
  const relPeople = Object.entries(d.relByPerson ?? {});

  return (
    <div className="space-y-8">
      <PageHeader title="Command Center" subtitle={`What matters today · ${d.td}`} />

      {/* ===== Nudges — surfaced at the very top ===== */}
      {d.nudges.length ? (
        <div className="space-y-2">
          {d.nudges.map((n, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm",
                n.tone === "good" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                n.tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-200",
                n.tone === "info" && "border-border bg-card text-muted-foreground"
              )}
            >
              {n.text}
            </div>
          ))}
        </div>
      ) : null}

      {/* ===== TODAY — the mission, act on it ===== */}
      <TodayPanel
        date={d.td}
        momentum={d.todayMomentum}
        mostImportant={mostImportant ?? undefined}
        identity={d.latestMorning?.identity_stepping_into ?? undefined}
        hardThing={d.todayAvoidance?.hardest_thing_i_did_not_want_to_do ?? undefined}
        didIt={d.todayAvoidance?.did_i_do_it ?? false}
      />

      {/* ===== The essentials — impossible to ignore ===== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Sober streak" value={d.currentSoberStreak} suffix=" d" accent />
        <StatCard label="Momentum today" value={d.todayMomentum?.momentum_score} suffix="%" accent />
        <StatCard
          label="Debt remaining"
          value={debtRemaining != null ? `$${Number(debtRemaining).toLocaleString()}` : "—"}
          accent
        />
        <StatCard label="Sleep score" value={d.latestOura?.sleep_score} accent />
        <StatCard label="Weight" value={d.latestWeight?.weight_lbs} suffix=" lb" accent />
      </section>

      {/* ===== Vision of the day ===== */}
      {d.visionOfDay ? (
        <Link href="/vision-board" className="block">
          <div className="relative overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.visionOfDay.image_url}
              alt={d.visionOfDay.caption || "Vision of the day"}
              className="h-44 w-full object-cover sm:h-56"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/70">Vision of the day</div>
              {d.visionOfDay.caption ? (
                <div className="text-lg font-bold text-white">{d.visionOfDay.caption}</div>
              ) : null}
            </div>
          </div>
        </Link>
      ) : null}

      {/* ===== Debt Freedom + Relationships ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Debt Freedom</span>
              <Link href="/debt" className="text-xs font-normal text-primary">
                Update →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-3xl font-bold">
              {debtRemaining != null ? `$${Number(debtRemaining).toLocaleString()}` : "—"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">remaining</span>
            </div>
            <Row label="Projected debt-free" value={d.debtFreeDate ?? "Add monthly payment to project"} />
            <Row label="Paid this month" value={d.debt?.debt_paid_this_month != null ? `$${Number(d.debt.debt_paid_this_month).toLocaleString()}` : "—"} />
            <Row label="Savings" value={savings != null ? `$${Number(savings).toLocaleString()}` : "—"} />
            <Row label="Emergency fund" value={d.debt?.emergency_fund_balance != null ? `$${Number(d.debt.emergency_fund_balance).toLocaleString()}` : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Relationships this week</span>
              <Link href="/relationships" className="text-xs font-normal text-primary">
                Log →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Date night this month" value={d.dateNightThisMonth ? "✓" : "—"} />
            {relPeople.length ? (
              relPeople.map(([person, count]) => <Row key={person} label={person} value={`${count}`} />)
            ) : (
              <p className="text-muted-foreground">No connections logged this week.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ===== Today's State ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Today’s state — what version of me showed up?
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <StatCard label="Mood" value={d.todayCbt?.mood_score} />
          <StatCard label="Energy" value={d.todayCbt?.energy_score} />
          <StatCard label="Hopefulness" value={d.todayCbt?.hopefulness_score} />
          <StatCard label="Readiness" value={d.latestOura?.readiness_score} />
          <StatCard label="Sleep" value={d.latestOura?.sleep_score} />
          <StatCard label="HRV" value={d.latestOura?.hrv} />
          <StatCard label="Resting HR" value={d.latestOura?.resting_heart_rate} />
          <StatCard label="Focus (wk)" value={d.deepWorkThisWeek} suffix="m" />
        </div>
      </section>

      {/* ===== This week ===== */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Consistency this week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Workouts completed" value={`${d.workoutsThisWeek}`} />
            <Row label="Deep work" value={`${d.deepWorkThisWeek} min`} />
            <Row label="Morning practice" value={`${d.morningDaysThisWeek}/7`} />
            <Row label="Evening practice" value={`${d.eveningDaysThisWeek}/7`} />
            <Row label="Avoidance wins" value={`${d.avoidanceWinsThisWeek}`} />
            <Row label="Courage streak" value={`${d.courageStreak} days`} />
            {d.latestIntentions ? (
              <div className="pt-2">
                <div className="text-xs uppercase text-muted-foreground">This week’s intentions</div>
                <div className="whitespace-pre-wrap">{d.latestIntentions}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sobriety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Current sober streak" value={`${d.currentSoberStreak} days`} />
            <Row label="Longest sober streak" value={`${d.longestSoberStreak} days`} />
            <Row label="Cannabis-free days this month" value={`${d.cannabisFreeThisMonth}`} />
            <Row label="Avg sleep — sober vs cannabis" value={`${fmt(d.sleepSober)} vs ${fmt(d.sleepCannabis)}`} />
            <Row label="Avg mood — sober vs cannabis" value={`${fmt(d.moodSober)} vs ${fmt(d.moodCannabis)}`} />
          </CardContent>
        </Card>
      </section>

      {/* ===== Identity ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Releasing</div>
            <div className="text-base">{d.latestMorning?.identity_releasing ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Stepping into</div>
            <div className="text-base">{d.latestMorning?.identity_stepping_into ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Themes over time</div>
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

      {/* ===== Trends (analytics) ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Trends
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Mood · 30 days" data={d.series.mood30} domain={[0, 10]} />
          <ChartCard title="Momentum · 30 days" data={d.series.momentum} domain={[0, 100]} color="hsl(199 89% 58%)" />
          <ChartCard title="Sleep score · 30 days" data={d.series.sleep} color="hsl(199 89% 58%)" />
          <ChartCard title="Readiness · 30 days" data={d.series.readiness} color="hsl(150 70% 55%)" />
          <ChartCard title="HRV · 30 days" data={d.series.hrv} color="hsl(280 70% 65%)" />
          <ChartCard title="Weight · 30 days" data={d.series.weight} color="hsl(45 93% 58%)" />
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
