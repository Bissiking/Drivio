// src/app/(app)/kilometrage/page.tsx
import type { Metadata } from "next";
import { Gauge, Plus } from "lucide-react";
import { MileageEdit } from "@/components/forms/mileage-edit";
import { MileageForm } from "@/components/forms/mileage-form";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Kilométrage" };

export default async function MileagePage() {
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, brand: true, model: true } });
  const readings = await db.mileageReading.findMany({ where: { vehicle: { userId: user.id } }, orderBy: [{ date: "desc" }, { mileage: "desc" }], include: { vehicle: { select: { brand: true, model: true } } }, take: 100 });
  return <div className="space-y-8">
    <PageHeader title="Kilométrage" description="Chaque relevé enrichit vos moyennes et projections. Les corrections restent identifiables." />
    {vehicles.length ? <details className="rounded-2xl bg-[var(--surface)]" open={readings.length === 0}><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><Plus className="size-4 text-[var(--accent)]" />Ajouter un relevé</summary><div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><MileageForm vehicles={vehicles} /></div></details> : <p className="text-sm text-[var(--warning)]">Ajoutez d’abord un véhicule actif dans le Garage.</p>}
    <Panel title="Registre des relevés" description={`${readings.length} relevé${readings.length > 1 ? "s" : ""}`}><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs text-[var(--quiet)]"><tr className="border-b border-[var(--line-soft)]"><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Véhicule</th><th className="px-5 py-3 text-right font-medium">Kilométrage</th><th className="px-5 py-3 text-right font-medium">Distance</th><th className="px-5 py-3 font-medium">Nature</th><th className="px-5 py-3 font-medium">Commentaire</th></tr></thead><tbody className="divide-y divide-[var(--line-soft)]">{readings.map((reading) => <tr key={reading.id}><td className="px-5 py-4 text-[var(--muted)]">{formatDate(reading.date)}</td><td className="px-5 py-4">{reading.vehicle.brand} {reading.vehicle.model}</td><td className="px-5 py-4 text-right text-base font-medium">{formatNumber(reading.mileage, " km")}</td><td className="px-5 py-4 text-right text-[var(--muted)]">{reading.distanceFromPrevious === null ? "—" : `${reading.distanceFromPrevious >= 0 ? "+" : ""}${formatNumber(reading.distanceFromPrevious, " km")}`}</td><td className="px-5 py-4">{reading.isCorrection ? <span className="text-[var(--warning)]">Correction</span> : <SourceBadge kind="real" />}</td><td className="max-w-xs px-5 py-4 text-[var(--muted)]">{reading.comment || "—"}<MileageEdit id={reading.id} mileage={reading.mileage} date={reading.date.toISOString().slice(0, 10)} comment={reading.comment} /></td></tr>)}</tbody></table>{readings.length === 0 ? <div className="flex flex-col items-center py-14 text-[var(--muted)]"><Gauge className="mb-3 size-7" strokeWidth={1.4} /><p className="text-sm">Aucun relevé enregistré.</p></div> : null}</div></Panel>
  </div>;
}
