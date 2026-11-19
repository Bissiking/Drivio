import { HorizonDashboard } from "@/components/dashboard/horizon-dashboard";
import { vehicleWhere, requireVehicleAccess } from "@/lib/vehicle-access";
import { VehiclePermissions, MutationOnly } from "@/components/sharing/vehicle-permissions";
import { AccessNotice } from "@/components/sharing/access-notice";
import { SimpleDashboard } from "@/components/sharing/simple-dashboard";
// src/app/(app)/dashboard/page.tsx
import { fuelStats, operatingCosts, monthKey, yearOf, percentChange, warrantyState, observedDistance, monthKeys } from "@/lib/analytics";
import { MAINTENANCE_GROUPS, maintenanceClassification, maintenanceLabel } from "@/lib/taxonomy";
import { VehiclePicker } from "@/components/layout/vehicle-picker";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { vehicleAlerts } from "@/lib/alerts";
import { confidenceLabels, wearPredictions } from "@/lib/predictions";
import { vehicleImage } from "@/lib/vehicle-images";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Fuel, Gauge, ReceiptText, Wrench } from "lucide-react";
import { DistanceChart, type DistancePoint } from "@/components/dashboard/distance-chart";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { requirePageUser } from "@/lib/auth";
import { maintenanceState } from "@/lib/maintenance-date";
import { calculateMileageStats } from "@/lib/calculations";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { mergeHistory } from "@/lib/history";
import { maintenanceGauges } from "@/lib/maintenance-gauges";
import { ConsumableGauges } from "@/components/maintenance/consumable-gauges";

export const metadata: Metadata = { title: "Dashboard" };

function monthSeries(readings: { date: Date; mileage: number }[], averageMonthly: number, now: Date): DistancePoint[] {
  const names = ["Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  const values = names.map((_, index) => observedDistance(readings, date => yearOf(date) === yearOf(now) && Number(monthKey(date).slice(5)) === index + 1, now));
  return names.map((month, index) => ({ month, actual: index <= now.getMonth() ? values[index] : null, estimated: index > now.getMonth() ? Math.round(averageMonthly) : null }));
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: vehicleWhere(user.id), orderBy: [{ status: "asc" }, { isPrimary: "desc" }, { createdAt: "asc" }], select: { id: true, brand: true, model: true, status: true } });
  const selected = query.vehicle ?? vehicles.find(v => v.status === "ACTIVE")?.id ?? vehicles[0]?.id;
  const access = selected && vehicles.some(v => v.id === selected) ? await requireVehicleAccess(user.id, selected) : null;
  if (access?.scope === "SIMPLE") return <SimpleDashboard id={selected!} vehicles={vehicles} canWrite={access.canWrite} horizon={user.interfaceStyle === "horizon"} />;
  const vehicle = selected ? await db.vehicle.findFirst({
    where: { id: selected, ...vehicleWhere(user.id, "COMPLETE") },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: {
      mileageReadings: { orderBy: { date: "asc" } },
      expenses: { orderBy: { date: "desc" } },
      fuelEntries: { orderBy: { date: "desc" } },
      maintenance: { orderBy: { date: "desc" } },
      warranties: { orderBy: { endDate: "desc" } },
      inspections: { orderBy: { date: "desc" } },
      insurancePolicies: { orderBy: { renewalDate: "desc" } },
      schedules: true,
      tireSets: { include: { measurements: true } },
    },
  }) : null;
  if (!vehicle) return <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center"><h1 className="text-4xl font-medium tracking-[-0.04em]">{selected ? "Véhicule introuvable." : "Votre registre est prêt."}</h1><p className="mt-4 text-[var(--muted)]">Ajoutez ou sélectionnez un véhicule dans le Garage pour commencer le suivi.</p><Link href="/garage" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">Ouvrir le garage <ArrowRight className="size-4" /></Link></div>;

  const now = new Date();
  const stats = calculateMileageStats([{ mileage: vehicle.purchaseMileage, date: vehicle.purchaseDate }, ...vehicle.mileageReadings], now);
  const costs = operatingCosts(vehicle.expenses, vehicle.fuelEntries, vehicle.maintenance, vehicle.insurancePolicies, now);
  const monthExpenses = costs.filter(e => monthKey(e.date) === monthKey(now)).reduce((sum, e) => sum + Number(e.amount), 0);
  const yearExpenses = costs.filter(e => yearOf(e.date) === yearOf(now)).reduce((sum, e) => sum + Number(e.amount), 0);
  const fuel = fuelStats(vehicle.fuelEntries, now);
  const change = percentChange(stats.month, stats.previousMonth);
  const predictiveAlerts = wearPredictions(vehicle, now).filter(p => p.status !== "OK" && (p.id.startsWith("tire-") || p.id.startsWith("repeat-"))).map(p => ({ key: `prediction-${p.id}`, title: `${vehicle.brand} ${vehicle.model} · ${p.title}`, detail: `${"Intervention estimée à confirmer"} · confiance ${confidenceLabels[p.confidence]}`, urgent: false, href: `/previsions?vehicle=${vehicle.id}` }));
  const alerts = [...vehicleAlerts(vehicle, now), ...predictiveAlerts].sort((a, b) => Number(b.urgent) - Number(a.urgent));
  const warranty = vehicle.warranties.find(w => ["ACTIVE", "SOON"].includes(warrantyState(w, stats.current, now).status)) ?? vehicle.warranties[0];
  const warrantyStatus = warranty ? warrantyState(warranty, stats.current, now) : null;
  const inspection = vehicle.inspections.find(i => i.date <= now);
  const insurance = vehicle.insurancePolicies.find(p => p.startDate <= now);
  const gauges = maintenanceGauges(vehicle, now);
  const schedules = vehicle.schedules.filter(s => !s.completedAt).map((schedule) => ({ schedule, state: maintenanceState(schedule, stats.current, vehicle.mileageReadings, now) }));
  const next = schedules.sort((a, b) => {
    const aValue = Math.min(a.state.daysRemaining ?? Infinity, (a.state.kmRemaining ?? Infinity) / Math.max(stats.averageDaily, 1));
    const bValue = Math.min(b.state.daysRemaining ?? Infinity, (b.state.kmRemaining ?? Infinity) / Math.max(stats.averageDaily, 1));
    return aValue - bValue;
  })[0];
  const history = mergeHistory({ mileage: vehicle.mileageReadings, fuel: vehicle.fuelEntries, maintenance: vehicle.maintenance, expenses: vehicle.expenses }).slice(0, 5);
  const image = vehicleImage(vehicle);
  const maintenanceCosts = MAINTENANCE_GROUPS.map(group => {
    const records = vehicle.maintenance.filter(r => (maintenanceClassification(r.type).category ?? "PERSONNALISE") === group.id && r.date <= now);
    return { ...group, count: records.length, priced: records.filter(r => r.cost !== null).length, total: records.reduce((sum, r) => sum + Number(r.cost ?? 0), 0) };
  }).filter(g => g.count > 0);

  const horizon = user.interfaceStyle === "horizon";
  return <VehiclePermissions canWrite={access?.canWrite ?? false}><div className={horizon ? "horizon-dashboard" : "space-y-7"}>
    {horizon ? <HorizonDashboard vehicle={vehicle} vehicles={vehicles} current={stats.current} monthDistance={stats.month} consumption={fuel.consumption} monthExpenses={monthExpenses} schedules={schedules} history={history} /> : <>
    <header className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-medium tracking-[-0.03em]">Votre registre</h1><Link href="/garage" className="inline-flex min-h-11 items-center text-sm text-[var(--accent)]">Gérer le garage <ArrowRight className="ml-2 size-4" /></Link></div><VehiclePicker vehicles={vehicles} selected={vehicle.id} href="/dashboard" /></header>
    {access ? <AccessNotice {...access} /> : null}
    <MutationOnly><nav aria-label="Actions du véhicule" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3"><Link href={`/carburant?vehicle=${vehicle.id}&add=true#ajouter-plein`} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-ink)]"><Fuel className="size-4" />Enregistrer un plein</Link><Link href={`/kilometrage?vehicle=${vehicle.id}&add=true`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] px-4 text-sm"><Gauge className="size-4" />Relever les km</Link><Link href={`/entretiens?vehicle=${vehicle.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] px-4 text-sm"><Wrench className="size-4" />Entretiens</Link></nav></MutationOnly>

    <section className="overflow-hidden rounded-2xl bg-[var(--surface)] xl:grid xl:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)_minmax(0,.9fr)]">
      <div className="relative hidden xl:block xl:min-h-[300px]"><Image src={image.src} alt={image.illustrative ? `Illustration de ${vehicle.brand} ${vehicle.model}` : `${vehicle.brand} ${vehicle.model}`} fill priority unoptimized={Boolean(vehicle.photoUrl && !vehicle.photoPath)} sizes="(max-width:1279px) 100vw, 32vw" className="object-cover xl:object-contain" />{image.illustrative ? <span className="absolute bottom-3 left-3 rounded-md bg-[var(--ink)]/90 px-2 py-1 text-[10px] text-[var(--muted)]">Illustration · image générée</span> : null}</div>
      <div className="flex flex-col justify-between border-t border-[var(--line-soft)] p-5 xl:border-l xl:border-t-0 xl:p-7">
        <div><p className="text-sm text-[var(--muted)]">{vehicle.year} · {vehicle.trim}</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">{vehicle.brand} {vehicle.model}</h2><p className="mt-2 text-[var(--muted)]">{vehicle.powertrain}</p></div>
        <div className="mt-6 xl:mt-12"><div className="flex items-end gap-3"><span className="text-5xl font-medium tracking-[-0.04em] sm:text-6xl">{formatNumber(stats.current)}</span><span className="pb-1 text-2xl text-[var(--muted)]">km</span></div><div className="mt-4 flex items-center gap-3"><SourceBadge kind="real" /><span className="text-xs text-[var(--quiet)]">Dernier relevé enregistré</span></div></div>
      </div>
      <div className="border-t border-[var(--line-soft)] p-5 xl:border-l xl:border-t-0 xl:p-7"><p className="text-sm text-[var(--muted)]">Prochaine échéance</p>{next ? <><Wrench className="mt-8 hidden size-7 text-[var(--warning)] xl:block" strokeWidth={1.5} /><p className="mt-4 text-xs text-[var(--muted)]">{maintenanceLabel(next.schedule.type)}</p><h3 className="mt-2 text-xl font-medium">{next.schedule.title}</h3><div className="mt-5 space-y-2 text-sm"><p className={next.state.status === "OVERDUE" ? "text-[var(--danger)]" : "text-[var(--text)]"}>{next.state.kmRemaining !== null ? `${formatNumber(next.state.kmRemaining, " km")} restants` : "Sans seuil kilométrique"}</p><p className="text-[var(--muted)]">{next.state.daysRemaining !== null ? `${formatNumber(next.state.daysRemaining, " jours")} restants` : next.state.estimatedDate ? `Estimation : ${formatDate(next.state.estimatedDate)}` : "Sans date définie"}</p></div><Link href={`/entretiens?vehicle=${vehicle.id}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)] xl:mt-8">Voir l’échéance <ArrowRight className="size-4" /></Link></> : <p className="mt-8 text-sm leading-6 text-[var(--muted)]">Aucune échéance active. Ajoutez-en une dans Entretiens.</p>}</div>
    </section>



    </>}
    {alerts.length ? <Panel title="Alertes importantes"><div className="divide-y divide-[var(--line-soft)] px-5">{alerts.slice(0, 5).map(a => <Link key={a.key} href={a.href} className="flex flex-col justify-between gap-2 py-4 text-sm sm:flex-row"><span className={a.urgent ? "text-[var(--danger)]" : "text-[var(--warning)]"}>{a.title}</span><span className="text-[var(--muted)]">{a.detail}</span></Link>)}</div></Panel> : null}
    {!horizon ? <>
    <section aria-label="Synthèse du véhicule" className="grid grid-cols-2 divide-y divide-[var(--line-soft)] rounded-2xl bg-[var(--surface)] xl:grid-cols-4 xl:divide-x xl:divide-y-0">
      <Metric label="Parcouru ce mois" value={formatNumber(stats.month, " km")} kind="calculated" detail={change === null ? "Comparaison indisponible" : `${change >= 0 ? "+" : ""}${formatNumber(change, " %")} vs mois précédent`} />
      <Metric label="Consommation fiable" value={fuel.consumption === null ? "—" : formatNumber(fuel.consumption, " L/100 km")} kind="calculated" detail={fuel.consumption === null ? "Deux pleins complets sont nécessaires" : "Trajets clôturés entre pleins complets"} />
      <Metric label="Carburant ce mois" value={formatCurrency(fuel.month)} kind="calculated" detail="Montants enregistrés à la pompe" />
      <Metric label="Coût d’usage du mois" value={formatCurrency(monthExpenses)} kind="calculated" detail="Carburant inclus, assurance selon le contrat" />
    </section>
    </> : null}
    <div className={horizon ? "grid gap-7" : "grid gap-7 xl:grid-cols-2"}>{!horizon ? <Panel title="Prochains entretiens" description="Échéances personnelles ou constructeur documentées."><div className="divide-y divide-[var(--line-soft)] px-5">{schedules.slice(0, 5).map(({ schedule, state }) => <Link key={schedule.id} href={`/entretiens?vehicle=${vehicle.id}#entretien-${schedule.id}`} className="flex min-h-20 items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="text-sm font-medium">{schedule.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{maintenanceLabel(schedule.type)}</p></div><div className="shrink-0 text-right text-sm"><p className={state.status === "OVERDUE" ? "text-[var(--danger)]" : state.status === "SOON" ? "text-[var(--warning)]" : "text-[var(--muted)]"}>{state.status === "OVERDUE" ? "En retard" : state.status === "SOON" ? "Bientôt" : "À venir"}</p><p className="mt-1 text-xs text-[var(--muted)]">{schedule.dueDate ? formatDate(schedule.dueDate) : schedule.dueMileage !== null ? formatNumber(schedule.dueMileage, " km") : "—"}</p></div></Link>)}{!schedules.length ? <p className="py-6 text-sm text-[var(--muted)]">Aucun entretien planifié. Créez une échéance dans Entretiens.</p> : null}</div></Panel> : null}
    <Panel title="Entretiens par catégorie" description="Interventions réalisées et coûts renseignés, depuis l’achat."><div className="divide-y divide-[var(--line-soft)] px-5">{maintenanceCosts.map(group => <div key={group.id} className="flex items-center justify-between gap-4 py-4 text-sm"><div><p>{group.label}</p><p className="mt-1 text-xs text-[var(--muted)]">{group.count} intervention{group.count > 1 ? "s" : ""}</p></div><span>{group.priced ? formatCurrency(group.total) : "Coût non renseigné"}</span></div>)}{!maintenanceCosts.length ? <p className="py-6 text-sm text-[var(--muted)]">Aucun entretien réalisé enregistré.</p> : null}</div></Panel></div>
    <Panel title="Contrats et échéances"><div className="grid gap-5 p-5 sm:grid-cols-3"><div><h3 className="text-sm text-[var(--muted)]">Garantie</h3><p className="mt-2 text-sm">{warrantyStatus ? warrantyStatus.status === "EXPIRED" ? "Garantie expirée" : warrantyStatus.status === "UPCOMING" ? "Garantie à venir" : `${warrantyStatus.status === "SOON" ? "Expire bientôt" : "Garantie active"} · encore ${warrantyStatus.months > 0 ? `${warrantyStatus.months} mois` : `${warrantyStatus.days} jours`}${warrantyStatus.km === null ? "" : ` ou ${formatNumber(warrantyStatus.km, " km")}`}` : "Non renseignée"}</p></div><div><h3 className="text-sm text-[var(--muted)]">Contrôle technique</h3><p className="mt-2 text-sm">{inspection ? `${inspection.requiresFollowUp ? "Contre-visite" : "Prochain contrôle"} : ${formatDate(inspection.requiresFollowUp && inspection.followUpDeadline ? inspection.followUpDeadline : inspection.nextDate)}` : "Non renseigné"}</p></div><div><h3 className="text-sm text-[var(--muted)]">Assurance</h3><p className="mt-2 text-sm">{insurance ? `${insurance.company} · renouvellement ${formatDate(insurance.renewalDate)}` : "Non renseignée"}</p></div></div><Link href={`/suivi?vehicle=${vehicle.id}`} className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Gérer le suivi véhicule <ArrowRight className="size-4" /></Link></Panel>

    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <Panel title="Kilométrage mensuel" description={`Cette année : ${formatNumber(stats.year, " km")} · moyenne ${formatNumber(stats.averageDaily, " km/j")} · rythme annualisé estimé depuis l’achat ${formatNumber(stats.annualProjection, " km/an")}. Les mois futurs sont estimés.`}><div className="px-3 pb-4 pt-5 sm:px-6"><DistanceChart data={monthSeries([{ mileage: vehicle.purchaseMileage, date: vehicle.purchaseDate }, ...vehicle.mileageReadings], stats.averageMonthly, now)} /><div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--line-soft)] pt-4 text-xs text-[var(--muted)]"><span><SourceBadge kind="calculated" className="mr-2" />distances observées</span><span><SourceBadge kind="estimated" className="mr-2" />projection</span></div></div></Panel>
      <div className="space-y-7">
        <Panel title="Dépenses"><div className="divide-y divide-[var(--line-soft)] px-5"><ExpenseLine label="Ce mois" value={monthExpenses} /><ExpenseLine label="Cette année" value={yearExpenses} /></div><Link href={`/depenses?vehicle=${vehicle.id}`} className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Voir les dépenses <ArrowRight className="size-4" /></Link></Panel>
        {!horizon ? <Panel title="Historique récent"><div className="divide-y divide-[var(--line-soft)] px-5">{history.map((event) => <div key={`${event.type}-${event.id}`} className="flex gap-3 py-4">{event.type === "fuel" ? <Fuel className="mt-0.5 size-4 text-[var(--accent)]" /> : event.type === "mileage" ? <Gauge className="mt-0.5 size-4 text-[var(--accent)]" /> : event.type === "maintenance" ? <Wrench className="mt-0.5 size-4 text-[var(--warning)]" /> : <ReceiptText className="mt-0.5 size-4 text-[var(--muted)]" />}<div className="min-w-0 flex-1"><p className="truncate text-sm">{event.title}</p><p className="mt-1 text-xs text-[var(--quiet)]">{formatDate(event.date)}</p></div>{event.amount !== undefined ? <span className="text-sm">{formatCurrency(event.amount)}</span> : null}</div>)}</div><Link href="/historique" className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Tout l’historique <ArrowRight className="size-4" /></Link></Panel> : null}
      </div>
    </div>
    <div className="grid gap-7 xl:grid-cols-2"><Panel title="Budget mensuel" description="Coûts d’usage calculés, carburant inclus. Le mois actuel est incomplet."><div className="p-5"><TrendChart data={monthKeys(now, 6).map(key => ({ label: `${key.slice(5)}/${key.slice(2, 4)}`, value: costs.filter(e => monthKey(e.date) === key).reduce((sum, e) => sum + Number(e.amount), 0) }))} unit="€" label="Coûts d’usage mensuels" /></div></Panel><Panel title="Consommation par trajet" description="Les 12 derniers trajets entre pleins ; les appoints attendent un plein complet."><div className="p-5">{fuel.intervals.length ? <TrendChart data={fuel.intervals.slice(-12).map(e => ({ label: formatDate(e.date), value: e.consumption }))} unit="L/100 km" label="Consommation calculée" /> : <p className="py-8 text-sm text-[var(--muted)]">Enregistrez vos pleins pour voir évoluer votre consommation.</p>}</div></Panel></div>
    <Panel title="Usure et entretiens" description="Marge avant entretien et usure estimée des pneus. Cliquez sur une jauge pour voir sa référence."><ConsumableGauges items={gauges} /><Link href={`/suivi?vehicle=${vehicle.id}#consommables`} className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Gérer les jauges dans Suivi véhicule <ArrowRight className="size-4" /></Link></Panel>

  </div></VehiclePermissions>;
}

function Metric({ label, value, kind, detail }: { label: string; value: string; detail?: string; kind: "real" | "calculated" | "estimated" }) { return <div className="min-w-0 p-4 sm:p-6"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-xl font-medium tracking-[-0.03em] sm:text-2xl">{value}</p><SourceBadge kind={kind} className="mt-3" />{detail ? <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p> : null}</div>; }
function ExpenseLine({ label, value }: { label: string; value: number }) { return <div className="flex items-end justify-between py-5"><span className="text-sm text-[var(--muted)]">{label}</span><span className="text-xl font-medium">{formatCurrency(value)}</span></div>; }
