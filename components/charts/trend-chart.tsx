"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface TrendPoint {
  date: string;
  value: number | null;
}

/** A compact line chart for a single metric over time. */
export function TrendChart({
  data,
  color = "hsl(199 89% 58%)",
  domain,
}: {
  data: TrendPoint[];
  color?: string;
  domain?: [number | "auto", number | "auto"];
}) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 25% 20%)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(215 20% 65%)" }}
            tickFormatter={(d: string) => d.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 65%)" }} domain={domain ?? ["auto", "auto"]} width={34} />
          <Tooltip
            contentStyle={{
              background: "hsl(222 26% 11%)",
              border: "1px solid hsl(217 25% 20%)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(210 40% 96%)" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
