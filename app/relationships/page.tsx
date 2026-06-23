import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lastNDays } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, DateField, CheckboxField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveRelationship } from "@/lib/actions";
import { RELATIONSHIP_PEOPLE } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

const CONNECTION_TYPES = ["Call", "Text", "Visit", "Quality time", "Date night"];

export default async function RelationshipsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = lastNDays(7)[0];
  const { data: rows } = await supabase
    .from("relationship_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .order("date", { ascending: false });
  const week = rows ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Relationships" subtitle="What gets measured gets attention. Log a connection." />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Log a connection</CardTitle>
        </CardHeader>
        <CardContent>
          <FormShell action={saveRelationship} submitLabel="Save connection">
            <DateField />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Person">
                <select name="person" defaultValue={RELATIONSHIP_PEOPLE[0]}>
                  {RELATIONSHIP_PEOPLE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select name="connection_type" defaultValue="Call">
                  {CONNECTION_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <CheckboxField name="completed" label="Completed" defaultChecked />
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </FormShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This week</CardTitle>
        </CardHeader>
        <CardContent>
          {week.length ? (
            <ul className="space-y-2 text-sm">
              {week.map((r) => (
                <li key={r.id} className="flex items-center justify-between border-b border-border/50 pb-1.5">
                  <span className="font-medium">{r.person}</span>
                  <span className="text-muted-foreground">
                    {r.connection_type ?? "—"} · {r.date}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No connections logged this week yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
