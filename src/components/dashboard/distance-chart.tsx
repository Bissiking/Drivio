// src/components/dashboard/distance-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/format";

export type DistancePoint = { month: string; actual: number | null; estimated: number | null };

export function DistanceChart({ data }: { data: DistancePoint[] }) {
  return <div className="h-[280px] w-full" role="img" aria-label="Kilomètres parcourus par mois">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--line-soft)" strokeDasharray="2 5" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--quiet)", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--quiet)", fontSize: 11 }} width={46} />
        <Tooltip cursor={{ fill: "var(--surface-soft)" }} contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--text)" }} formatter={(value, name) => [formatNumber(Number(value), " km"), name === "actual" ? "Calculé" : "Estimé"]} />
        <Bar isAnimationActive={false} dataKey="actual" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={48} />
        <Bar isAnimationActive={false} dataKey="estimated" fill="transparent" stroke="var(--quiet)" strokeDasharray="5 4" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
