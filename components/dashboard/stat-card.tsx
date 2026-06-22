import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** Large readable stat tile for the dashboard. */
export function StatCard({
  label,
  value,
  suffix,
  hint,
  accent,
}: {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
  hint?: string;
  accent?: boolean;
}) {
  const display =
    value === null || value === undefined || value === "" ? "—" : `${value}${suffix ?? ""}`;
  return (
    <Card className={cn("p-4", accent && "border-primary/40 bg-primary/5")}>
      <div className={cn("text-3xl font-bold tracking-tight", accent && "text-primary")}>
        {display}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

/** A labelled progress bar (0–100%). */
export function ProgressBar({
  label,
  percent,
  caption,
}: {
  label: string;
  percent: number;
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{caption ?? `${pct}%`}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
