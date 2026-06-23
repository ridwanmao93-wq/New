import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { today } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { DoneTodayBanner } from "@/components/done-today-banner";
import { FormShell } from "@/components/forms/form-shell";
import { Field, DateField, Input, Textarea } from "@/components/forms/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { saveDebt } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DebtPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("debt_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);
  const latest = rows?.[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Debt & Money" subtitle="Update your numbers whenever they change — weekly is plenty." />

      {latest && String(latest.date) === today() ? (
        <DoneTodayBanner>You’ve already updated your numbers today.</DoneTodayBanner>
      ) : null}

      {latest ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Debt remaining" value={latest.total_debt_remaining != null ? `$${Number(latest.total_debt_remaining).toLocaleString()}` : "—"} accent />
          <StatCard label="Paid this month" value={latest.debt_paid_this_month != null ? `$${Number(latest.debt_paid_this_month).toLocaleString()}` : "—"} />
          <StatCard label="Savings" value={latest.savings_balance != null ? `$${Number(latest.savings_balance).toLocaleString()}` : "—"} />
          <StatCard label="Emergency fund" value={latest.emergency_fund_balance != null ? `$${Number(latest.emergency_fund_balance).toLocaleString()}` : "—"} />
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Update your numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <FormShell action={saveDebt} submitLabel="Save snapshot">
            <DateField />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Total debt remaining ($)">
                <Input name="total_debt_remaining" type="number" step="any" min={0} defaultValue={latest?.total_debt_remaining ?? ""} />
              </Field>
              <Field label="Debt paid this month ($)">
                <Input name="debt_paid_this_month" type="number" step="any" min={0} />
              </Field>
              <Field label="Savings balance ($)">
                <Input name="savings_balance" type="number" step="any" min={0} defaultValue={latest?.savings_balance ?? ""} />
              </Field>
              <Field label="Emergency fund ($)">
                <Input name="emergency_fund_balance" type="number" step="any" min={0} defaultValue={latest?.emergency_fund_balance ?? ""} />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </FormShell>
        </CardContent>
      </Card>
    </div>
  );
}
