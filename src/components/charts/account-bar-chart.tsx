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
import { formatPesoCompact } from "@/lib/format";
import type { NamedTotal } from "@/lib/queries";

/** Horizontal bars: spend per account, colored by the account's own color. */
export function AccountBarChart({ data }: { data: NamedTotal[] }) {
  const height = Math.max(160, data.length * 44 + 24);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatPesoCompact(v)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={92}
        />
        <Tooltip
          cursor={{ fill: "var(--grid-line)", opacity: 0.4 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                entries={[
                  {
                    name: String((payload[0].payload as NamedTotal).name),
                    value: Number(payload[0].value),
                    color: (payload[0].payload as NamedTotal).color,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((d) => (
            <Cell key={d.id} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
