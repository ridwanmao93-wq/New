import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart, type TrendPoint } from "@/components/charts/trend-chart";

export function ChartCard({
  title,
  data,
  color,
  domain,
}: {
  title: string;
  data: TrendPoint[];
  color?: string;
  domain?: [number | "auto", number | "auto"];
}) {
  const hasData = data.some((d) => d.value !== null);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <TrendChart data={data} color={color} domain={domain} />
        ) : (
          <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
            No data yet — start logging.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
