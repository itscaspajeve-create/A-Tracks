"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatPesoCompact, monthShort, monthLabel } from "@/lib/format";
import type { StackedMonth } from "@/lib/queries";

interface Props {
  data: StackedMonth[];
  series: { name: string; color: string }[];
}

export function StackedCategoriesChart({ data, series }: Props) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={monthShort}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tickFormatter={(v: number) => formatPesoCompact(v)}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: "var(--grid-line)", opacity: 0.4 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltip
                  label={monthLabel(String(label))}
                  entries={payload
                    .filter((p) => Number(p.value) > 0)
                    .reverse()
                    .map((p) => ({
                      name: String(p.name),
                      value: Number(p.value),
                      color: String(p.color),
                    }))}
                />
              ) : null
            }
          />
          {series.map((s, i) => (
            <Bar
              key={s.name}
              dataKey={s.name}
              stackId="spend"
              fill={s.color}
              stroke="hsl(var(--card))"
              strokeWidth={1}
              maxBarSize={40}
              radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {series.map((s) => (
          <li key={s.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
