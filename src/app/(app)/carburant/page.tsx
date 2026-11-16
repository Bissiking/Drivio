// src/app/(app)/carburant/page.tsx
import { FuelLedger } from "@/components/fuel/fuel-ledger";
import { StationSearch } from "@/components/fuel/station-search";
import { FuelModal } from "@/components/forms/fuel-modal";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { FuelForm } from "@/components/forms/fuel-form";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { VehiclePicker } from "@/components/layout/vehicle-picker";
import { SourceBadge } from "@/components/ui/source-badge";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { requirePageUser } from "@/lib/auth";
import { fuelStats, monthKey, monthKeys } from "@/lib/analytics";
import { vehicleWorkspace } from "@/lib/vehicle-workspace";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
export const metadata: Metadata = { title: "Carburant" };
const metric = (value: number | null, unit: string) => value === null ? "—" : formatNumber(value, unit);
export default async function FuelPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const user = await requirePageUser(), query = await searchParams;
  const { vehicles, vehicle } = await vehicleWorkspace(user.id, query.vehicle);
  const entries = vehicle?.fuelEntries ?? [], now = new Date(), stats = fuelStats(entries, now);
  const latestFull = entries.filter(e => e.date <= now && e.isFull).at(-1);
  const metrics = [["Ce mois", formatCurrency(stats.month)], ["Mois précédent", formatCurrency(stats.previous)], ["Évolution", stats.change === null ? "—" : `${stats.change >= 0 ? "+" : ""}${formatNumber(stats.change, " %")}`], ["Conso. des trajets clôturés", metric(stats.consumption, " L/100 km")], ["Coût total", formatCurrency(stats.total)], ["Prix moyen / litre", stats.unitPrice === null ? "—" : formatCurrency(stats.unitPrice)], ["Coût estimé / 100 km", stats.costPer100 === null ? "—" : formatCurrency(stats.costPer100)], ["Distance moyenne", metric(stats.averageDistance, " km")], ["Distance minimale", metric(stats.minimumDistance, " km")], ["Distance maximale", metric(stats.maximumDistance, " km")], ["Moyenne des 5 derniers intervalles", metric(stats.rollingDistance, " km")]];
  return <div className="space-y-7"><PageHeader title="Carburant" description="Budget, distances entre passages à la pompe et consommation fiable, par véhicule." /><VehiclePicker vehicles={vehicles} selected={vehicle?.id} href="/carburant" />
    {!vehicle ? <p className="text-sm text-[var(--muted)]">Ajoutez ou sélectionnez un véhicule dans le Garage.</p> : <>
    {vehicle.status === "ACTIVE" ? <details className="rounded-xl bg-[var(--surface)]"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium"><Plus className="size-4 text-[var(--accent)]" />Enregistrer un plein</summary><div className="border-t border-[var(--line-soft)] p-5"><FuelForm vehicles={[vehicle]} /><p className="mt-4 text-xs text-[var(--muted)]">Un relevé kilométrique est créé à la même date, sauf s’il existe déjà.</p></div></details> : null}
    {vehicle.status === "ACTIVE" ? <FuelModal vehicles={[{ id: vehicle.id, brand: vehicle.brand, model: vehicle.model }]} /> : null}
    <section className="grid grid-cols-2 divide-y divide-[var(--line-soft)] rounded-xl bg-[var(--surface)] sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="min-w-0 p-4 sm:p-5"><p className="text-xs sm:text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-xl sm:text-2xl font-medium tracking-[-0.03em]">{value}</p><SourceBadge kind="calculated" className="mt-3" /></div>)}</section>
    <p className="text-xs leading-5 text-[var(--muted)]">La moyenne fiable est pondérée par les distances entre pleins complets et inclut les appoints intermédiaires. Les intervalles incohérents sont exclus. Sans budget positif le mois précédent, le pourcentage est indisponible. Le mois en cours est incomplet.</p>
    <div className="grid gap-7 xl:grid-cols-2"><Panel title="Budget carburant mensuel" description="Les 12 derniers mois, d’après les montants enregistrés."><div className="p-5"><TrendChart data={monthKeys(now).map(key => ({ label: `${key.slice(5)}/${key.slice(2, 4)}`, value: entries.filter(e => monthKey(e.date) === key && e.date <= now).reduce((sum, e) => sum + Number(e.totalPrice), 0) }))} label="Budget carburant" unit="€" /></div></Panel><Panel title="Distance entre deux pleins" description="Les 12 derniers intervalles ; une baisse du compteur rend l’intervalle indisponible."><div className="p-5"><TrendChart data={stats.intervals.slice(-12).map(e => ({ label: `${e.date.getUTCDate()}/${e.date.getUTCMonth() + 1}`, value: e.distance }))} label="Distance entre pleins" unit="km" /></div></Panel></div>
    <Panel title="Stations et prix officiels (ALPHA)" description="Comparez les carburants et consultez les déclarations et ruptures officielles."><StationSearch vehicleId={vehicle.id} /></Panel>
    <Panel title="Registre des pleins" description={`${entries.length} pleins au total · les 100 derniers affichés`}>
      <div className="space-y-3 border-b border-[var(--line-soft)] p-5 text-sm leading-6 sm:px-6">
        <p className="max-w-prose text-[var(--muted)]">Chaque plein complet permet de calculer le trajet déjà parcouru depuis le précédent plein complet, en incluant les éventuels appoints. Les deux réservoirs doivent avoir été remplis au même niveau.</p>
        <p className="max-w-prose text-xs leading-5 text-[var(--muted)]">Le coût rapporté à 100 km utilise les montants des ravitaillements de cette période, divisés par sa distance. Il valorise le carburant remplacé ; le prix exact du carburant consommé peut être différent.</p>
        {latestFull && vehicle.status === "ACTIVE" ? <p className="text-[var(--accent)]">Trajet en cours depuis le {formatDate(latestFull.date)} : consommation en attente du prochain plein complet.</p> : null}
      </div>
      <FuelLedger entries={entries} intervals={stats.intervals} />
    </Panel></>}
  </div>;
}
