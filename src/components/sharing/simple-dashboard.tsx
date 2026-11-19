import { QuickEntryActions } from "@/components/forms/quick-entry";
import Link from "next/link";
import { db } from "@/lib/db";
import { fuelStats } from "@/lib/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { VehiclePicker } from "@/components/layout/vehicle-picker";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { AccessNotice } from "./access-notice";
export async function SimpleDashboard({ id, vehicles, canWrite, horizon = false }: { id: string; vehicles: { id: string; brand: string; model: string }[]; canWrite: boolean; horizon?: boolean }) {
  const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id }, select: { id: true, brand: true, model: true, purchaseMileage: true, finalMileage: true, mileageReadings: { orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 1 }, fuelEntries: { orderBy: { date: "asc" } } } });
  const fuel = fuelStats(vehicle.fuelEntries);
  return <div className="space-y-7"><PageHeader title="Votre registre" description={`${vehicle.brand} ${vehicle.model}`} /><VehiclePicker vehicles={vehicles} selected={id} href="/dashboard" /><AccessNotice owner={false} scope="SIMPLE" canWrite={canWrite} />
    <section className="grid divide-y divide-[var(--line-soft)] rounded-2xl bg-[var(--surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[["Compteur enregistré", formatNumber(vehicle.finalMileage ?? vehicle.mileageReadings[0]?.mileage ?? vehicle.purchaseMileage, " km"), "real"], ["Carburant ce mois", formatCurrency(fuel.month), "calculated"], ["Consommation fiable", fuel.consumption === null ? "Données insuffisantes" : formatNumber(fuel.consumption, " L/100 km"), "calculated"]].map(([label, value, kind]) => <div key={label} className="p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-2xl font-medium">{value}</p><SourceBadge kind={kind as "real" | "calculated"} className="mt-3" /></div>)}</section>
    {horizon && canWrite ? <QuickEntryActions compact vehicleId={id} /> : null}
    <Panel title="Suivi partagé"><nav className="divide-y divide-[var(--line-soft)] px-5">{[["carburant", "Carburant", "Pleins, volumes et consommation"], ["depenses", "Dépenses", "Paiements enregistrés"], ["kilometrage", "Kilomètres", "Relevés et évolution du compteur"]].map(([route, label, detail]) => <Link key={route} href={`/${route}?vehicle=${id}`} className="block py-5"><h2 className="text-sm font-medium text-[var(--accent)]">{label}</h2><p className="mt-1 text-sm text-[var(--muted)]">{detail}</p></Link>)}</nav></Panel>
  </div>;
}
