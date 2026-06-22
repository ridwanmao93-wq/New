import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCorrelationInsights } from "@/lib/analytics/insights";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STRENGTH_STYLES: Record<string, string> = {
  strong: "border-primary/50",
  moderate: "border-primary/30",
  weak: "border-border",
  none: "border-border opacity-80",
};

export default async function CorrelationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const insights = await getCorrelationInsights(supabase, user.id);

  return (
    <div>
      <PageHeader
        title="Correlations"
        subtitle="Plain-English patterns across the last 90 days. More data = sharper insight."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <Card key={insight.title} className={cn(STRENGTH_STYLES[insight.strength])}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{insight.title}</span>
                {insight.r != null ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    r = {insight.r.toFixed(2)}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{insight.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
