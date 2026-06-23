import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: any }) {
  if (value == null || value === "") return null;
  return (
    <span className="mr-3 inline-block text-xs text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{value}</span>
    </span>
  );
}

function Line({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="mt-1.5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap text-sm">{value}</div>
    </div>
  );
}

export default async function JournalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: morning }, { data: evening }] = await Promise.all([
    supabase
      .from("cbt_morning_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(60),
    supabase
      .from("cbt_evening_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(60),
  ]);

  // Merge into one timeline, newest first.
  const entries = [
    ...(morning ?? []).map((r: any) => ({ kind: "Morning" as const, ...r })),
    ...(evening ?? []).map((r: any) => ({ kind: "Evening" as const, ...r })),
  ].sort((a, b) => {
    const d = String(b.date).localeCompare(String(a.date));
    return d !== 0 ? d : a.kind === "Evening" ? -1 : 1; // morning above evening per day
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Journal" subtitle="Every morning and evening entry you've logged." />

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet. Your reflections will appear here.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e: any) => (
            <Card key={`${e.kind}-${e.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>
                    <span className={e.kind === "Morning" ? "text-amber-300" : "text-indigo-300"}>
                      {e.kind === "Morning" ? "🌅 Morning" : "🌙 Evening"}
                    </span>{" "}
                    · {e.date}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <Stat label="Mood" value={e.mood_score} />
                  <Stat label="Energy" value={e.energy_score} />
                  <Stat label="Hope" value={e.hopefulness_score} />
                </div>

                {e.kind === "Morning" ? (
                  <>
                    <Line label="Identity stepping into" value={e.identity_stepping_into} />
                    <Line label="Identity releasing" value={e.identity_releasing} />
                    <Line label="Act like the person who…" value={e.identity_action_statement} />
                    <Line label="Notes" value={e.notes} />
                  </>
                ) : (
                  <>
                    <Line label="Reflection" value={e.reflection_notes} />
                    <Line label="Gratitude" value={e.gratitude} />
                    <Line label="Surrender" value={e.surrender_statement} />
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
