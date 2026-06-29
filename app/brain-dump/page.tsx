import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractThemes } from "@/lib/themes";
import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, DateField, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteNote } from "@/components/brain-dump/delete-note";
import { saveBrainDump } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function BrainDumpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dumps } = await supabase
    .from("brain_dumps")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(300);
  const all = dumps ?? [];

  const themes = extractThemes(all.map((d) => String(d.content)));
  const maxCount = themes[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Brain Dump" subtitle="Write freely. No structure. Themes surface on their own." />

      {/* Write */}
      <Card>
        <CardContent className="pt-6">
          <FormShell action={saveBrainDump} submitLabel="Save dump">
            <DateField />
            <Field label="What's on your mind?">
              <Textarea
                name="content"
                className="min-h-[180px]"
                placeholder="Let it all out — worries, ideas, to-dos, feelings. Don't edit yourself."
              />
            </Field>
          </FormShell>
        </CardContent>
      </Card>

      {/* Themes */}
      {themes.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recurring themes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Words and phrases that keep coming up across your dumps. Bigger = more frequent.
            </p>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => {
                const scale = 0.85 + (t.count / maxCount) * 0.9; // 0.85x–1.75x
                return (
                  <span
                    key={t.phrase}
                    className="rounded-full bg-secondary px-3 py-1 font-medium text-foreground"
                    style={{ fontSize: `${scale}rem` }}
                    title={`${t.count}×`}
                  >
                    {t.phrase}
                    <span className="ml-1 text-xs text-muted-foreground">{t.count}</span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Themes will appear here once a few words or phrases repeat across your dumps.
        </p>
      )}

      {/* History */}
      {all.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Past dumps
          </h2>
          {all.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{d.date}</CardTitle>
                <DeleteNote id={d.id} />
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">{d.content}</CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
