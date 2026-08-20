import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkDbStatus, CATCH_UP_SQL } from "@/lib/db-status";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SqlBlock } from "@/components/system/sql-block";

export const dynamic = "force-dynamic";

/**
 * System status — the one honest place that tells you whether your database
 * is fully up to date. The app self-heals so nothing ever blocks you, but
 * this is where you catch up features that are quietly waiting on a one-time
 * SQL update.
 */
export default async function SystemPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { missing, upToDate } = await checkDbStatus(supabase);

  return (
    <div className="space-y-6">
      <PageHeader title="System status" subtitle="Is everything wired up?" />

      {upToDate ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 pt-6 text-sm">
            <span className="text-2xl">✓</span>
            <div>
              <div className="font-semibold text-emerald-300">Everything is up to date.</div>
              <div className="text-muted-foreground">
                All features are fully connected to your database. Nothing to do.
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-200">
                {missing.length} {missing.length === 1 ? "feature needs" : "features need"} a one-time
                database update
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Your app still works and never blocks your saves — but these features are waiting on a
                quick database update before they can store data:
              </p>
              <ul className="space-y-1.5">
                {missing.map((m) => (
                  <li key={m.key} className="flex items-center gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{m.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">How to fix it — takes 30 seconds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
                <li>
                  Go to <span className="font-medium text-foreground">supabase.com</span> and open your
                  project.
                </li>
                <li>
                  In the left sidebar, click <span className="font-medium text-foreground">SQL Editor</span>.
                </li>
                <li>
                  Click <span className="font-medium text-foreground">+ New query</span>.
                </li>
                <li>Tap “Copy SQL” below, paste it into the editor.</li>
                <li>
                  Click the green <span className="font-medium text-foreground">Run</span> button.
                </li>
                <li>
                  You’ll see <span className="font-medium text-foreground">“Success”</span> — come back
                  and refresh this page. It’ll say everything’s up to date.
                </li>
              </ol>

              <SqlBlock sql={CATCH_UP_SQL} />

              <p className="text-xs text-muted-foreground">
                This is safe to run even if some parts already exist — it only adds what’s missing and
                never deletes anything.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
