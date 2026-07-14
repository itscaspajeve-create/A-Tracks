"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatPesoCompact, monthShort, monthLabel } from "@/lib/format";

interface Props {
  data: { month: string; expenses: number }[];
  highlight?: string; // month key to emphasize (the selected month)
}

const BLUE = "#2a78d6";
const BLUE_MUTED = "#9ec5f4";

export function MonthlyTrendChart({ data, highlight }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
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
                entries={[{ name: "Expenses", value: Number(payload[0].value), color: BLUE }]}
              />
            ) : null
          }
        />
        <Bar dataKey="expenses" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((d) => (
            <Cell key={d.month} fill={highlight && d.month !== highlight ? BLUE_MUTED : BLUE} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
