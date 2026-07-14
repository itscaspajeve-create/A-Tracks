"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

/** Tiny trend line for account cards — no axes, no tooltip. */
export function Sparkline({
  data,
  color,
}: {
  data: { month: string; total: number }[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
        <Line
          type="monotone"
          dataKey="total"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
