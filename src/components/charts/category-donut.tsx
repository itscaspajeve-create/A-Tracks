"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatPeso, formatPesoCompact } from "@/lib/format";
import type { NamedTotal } from "@/lib/queries";

/** Donut of expense share; legend rendered in HTML beside/below the plot. */
export function CategoryDonut({ data }: { data: NamedTotal[] }) {
  const MAX = 7;
  const top = data.slice(0, MAX);
  const rest = data.slice(MAX);
  const slices = rest.length
    ? [...top, { id: -1, name: "Other", color: "#6e6d68", total: rest.reduce((s, r) => s + r.total, 0) }]
    : top;
  const grand = slices.reduce((s, r) => s + r.total, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    entries={[
                      {
                        name: String(payload[0].name),
                        value: Number(payload[0].value),
                        color: (payload[0].payload as NamedTotal).color,
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Total</span>
          <span className="tnum text-sm font-semibold">{formatPesoCompact(grand)}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="tnum shrink-0 font-medium">
              {formatPeso(s.total)}
              <span className="ml-2 inline-block w-10 text-right text-xs text-muted-foreground">
                {grand > 0 ? Math.round((s.total / grand) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
