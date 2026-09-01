// src/app/(app)/carburant/page.tsx
import type { Metadata } from "next";
import { Fuel, Plus } from "lucide-react";
import { FuelForm } from "@/components/forms/fuel-form";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Carburant" };

export default async function FuelPage() {
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, brand: true, model: true } });
  const entries = await db.fuelEntry.findMany({ where: { vehicle: { userId: user.id } }, include: { vehicle: { select: { brand: true, model: true } } }, orderBy: { date: "desc" }, take: 100 });
  const reliable = entries.filter((entry) => entry.consumptionPer100Km !== null);
  const averageConsumption = reliable.length ? reliable.reduce((sum, entry) => sum + Number(entry.consumptionPer100Km), 0) / reliable.length : null;
  const total = entries.reduce((sum, entry) => sum + Number(entry.totalPrice), 0);
  return <div className="space-y-8">
    <PageHeader title="Carburant" description="La consommation n’est qualifiée de fiable qu’entre deux pleins complets." />
    <section className="grid divide-y divide-[var(--line-soft)] rounded-2xl bg-[var(--surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Metric label="Pleins enregistrés" value={String(entries.length)} /><Metric label="Consommation moyenne fiable" value={averageConsumption === null ? "—" : formatNumber(averageConsumption, " L/100 km")} /><Metric label="Coût total" value={formatCurrency(total)} /></section>
    {vehicles.length ? <details className="rounded-2xl bg-[var(--surface)]"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><Plus className="size-4 text-[var(--accent)]" />Enregistrer un plein</summary><div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><FuelForm vehicles={vehicles} /></div></details> : null}
    <Panel title="Registre des pleins"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead><tr className="border-b border-[var(--line-soft)] text-xs text-[var(--quiet)]"><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Véhicule</th><th className="px-5 py-3 text-right font-medium">Volume</th><th className="px-5 py-3 text-right font-medium">Prix</th><th className="px-5 py-3 text-right font-medium">Prix/L</th><th className="px-5 py-3 text-right font-medium">Consommation</th><th className="px-5 py-3 text-right font-medium">Coût/100</th></tr></thead><tbody className="divide-y divide-[var(--line-soft)]">{entries.map((entry) => <tr key={entry.id}><td className="px-5 py-4 text-[var(--muted)]">{formatDate(entry.date)}</td><td className="px-5 py-4">{entry.vehicle.brand} {entry.vehicle.model}</td><td className="px-5 py-4 text-right">{formatNumber(Number(entry.liters), " L")}</td><td className="px-5 py-4 text-right font-medium">{formatCurrency(Number(entry.totalPrice))}</td><td className="px-5 py-4 text-right text-[var(--muted)]">{formatCurrency(Number(entry.unitPrice))}</td><td className="px-5 py-4 text-right">{entry.consumptionPer100Km ? <span className="inline-flex items-center gap-2">{formatNumber(Number(entry.consumptionPer100Km), " L")}<SourceBadge kind="calculated" /></span> : <span className="text-[var(--quiet)]">Non fiable</span>}</td><td className="px-5 py-4 text-right">{entry.costPer100Km ? formatCurrency(Number(entry.costPer100Km)) : "—"}</td></tr>)}</tbody></table>{entries.length === 0 ? <div className="flex flex-col items-center py-14 text-[var(--muted)]"><Fuel className="mb-3 size-7" strokeWidth={1.4} /><p className="text-sm">Aucun plein enregistré.</p></div> : null}</div></Panel>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="p-5 sm:p-6"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-2xl font-medium tracking-[-0.03em]">{value}</p></div>; }
