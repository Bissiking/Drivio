// src/components/dashboard/distance-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/format";

export type DistancePoint = { month: string; actual: number | null; estimated: number | null };

export function DistanceChart({ data }: { data: DistancePoint[] }) {
  return <div className="h-[280px] w-full" aria-label="Kilomètres parcourus par mois">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="#2b332d" strokeDasharray="2 5" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8e9a92", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#707d75", fontSize: 11 }} width={46} />
        <Tooltip cursor={{ fill: "#202620" }} contentStyle={{ background: "#181d1a", border: "1px solid #303832", borderRadius: 10, color: "#eef2ed" }} formatter={(value, name) => [formatNumber(Number(value), " km"), name === "actual" ? "Réel" : "Estimé"]} />
        <Bar dataKey="actual" fill="#9db19f" radius={[4, 4, 0, 0]} maxBarSize={48} />
        <Bar dataKey="estimated" fill="transparent" stroke="#7b887f" strokeDasharray="5 4" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
