import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { FormShell } from "@/components/forms/form-shell";
import { Field, Input } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncOuraButton } from "@/components/sync-oura-button";
import { EnablePush } from "@/components/notifications/enable-push";
import { saveProfile } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle={user.email ?? ""} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile & goals</CardTitle>
        </CardHeader>
        <CardContent>
          <FormShell action={saveProfile} submitLabel="Save profile" resetOnSuccess={false}>
            <Field label="Full name">
              <Input name="full_name" defaultValue={profile?.full_name ?? ""} />
            </Field>
            <Field label="Hydration goal (ML)">
              <Input name="hydration_goal_ml" type="number" min={0} defaultValue={profile?.hydration_goal_ml ?? 3000} />
            </Field>
            <Field label="Weight goal (lbs)">
              <Input name="weight_goal_lbs" type="number" step="0.1" min={0} defaultValue={profile?.weight_goal_lbs ?? ""} />
            </Field>
            <Field label="Weight unit" hint="Defaults to lbs. (kg toggle planned.)">
              <select name="weight_unit" defaultValue={profile?.weight_unit ?? "lbs"}>
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </Field>
          </FormShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EnablePush />
          <p className="text-xs text-muted-foreground">
            Get morning, midday and evening nudges on this device. On iPhone, add the app to your
            Home Screen first, open it from the icon, then enable.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Oura sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SyncOuraButton />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Set up your Oura access token</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Go to{" "}
                <a className="text-primary underline" href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noreferrer">
                  cloud.ouraring.com/personal-access-tokens
                </a>
                .
              </li>
              <li>Create a Personal Access Token.</li>
              <li>
                Add it to your environment as <code>OURA_ACCESS_TOKEN</code> (locally in{" "}
                <code>.env.local</code>, or in your Vercel project settings).
              </li>
              <li>Redeploy / restart, then use the sync button above or the daily cron.</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
