// src/app/(app)/dashboard/page.tsx
import { fuelStats, operatingCosts, monthKey, yearOf, percentChange, warrantyState, observedDistance } from "@/lib/analytics";
import { vehicleAlerts } from "@/lib/alerts";
import { vehicleImage } from "@/lib/vehicle-images";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Fuel, Gauge, ReceiptText, Wrench } from "lucide-react";
import { DistanceChart, type DistancePoint } from "@/components/dashboard/distance-chart";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { requirePageUser } from "@/lib/auth";
import { calculateMileageStats, calculateScheduleState } from "@/lib/calculations";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { mergeHistory } from "@/lib/history";

export const metadata: Metadata = { title: "Dashboard" };

function monthSeries(readings: { date: Date; mileage: number }[], averageMonthly: number, now: Date): DistancePoint[] {
  const names = ["Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  const values = names.map((_, index) => observedDistance(readings, date => yearOf(date) === yearOf(now) && Number(monthKey(date).slice(5)) === index + 1, now));
  return names.map((month, index) => ({ month, actual: index <= now.getMonth() ? values[index] : null, estimated: index > now.getMonth() ? Math.round(averageMonthly) : null }));
}

export default async function DashboardPage() {
  const user = await requirePageUser();
  const vehicle = await db.vehicle.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: {
      mileageReadings: { orderBy: { date: "asc" } },
      expenses: { orderBy: { date: "desc" } },
      fuelEntries: { orderBy: { date: "desc" } },
      maintenance: { orderBy: { date: "desc" } },
      warranties: { orderBy: { endDate: "desc" } },
      inspections: { orderBy: { date: "desc" } },
      insurancePolicies: { orderBy: { renewalDate: "desc" } },
      schedules: { where: { completedAt: null } },
    },
  });
  if (!vehicle) return <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center"><h1 className="text-4xl font-medium tracking-[-0.04em]">Votre registre est prêt.</h1><p className="mt-4 text-[var(--muted)]">Ajoutez votre premier véhicule pour commencer le suivi.</p><Link href="/garage" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">Ouvrir le garage <ArrowRight className="size-4" /></Link></div>;

  const now = new Date();
  const stats = calculateMileageStats([{ mileage: vehicle.purchaseMileage, date: vehicle.purchaseDate }, ...vehicle.mileageReadings], now);
  const costs = operatingCosts(vehicle.expenses, vehicle.fuelEntries, vehicle.maintenance, vehicle.insurancePolicies, now);
  const monthExpenses = costs.filter(e => monthKey(e.date) === monthKey(now)).reduce((sum, e) => sum + Number(e.amount), 0);
  const yearExpenses = costs.filter(e => yearOf(e.date) === yearOf(now)).reduce((sum, e) => sum + Number(e.amount), 0);
  const fuel = fuelStats(vehicle.fuelEntries, now);
  const change = percentChange(stats.month, stats.previousMonth);
  const alerts = vehicleAlerts(vehicle, now);
  const warranty = vehicle.warranties.find(w => ["ACTIVE", "SOON"].includes(warrantyState(w, stats.current, now).status)) ?? vehicle.warranties[0];
  const warrantyStatus = warranty ? warrantyState(warranty, stats.current, now) : null;
  const inspection = vehicle.inspections.find(i => i.date <= now);
  const insurance = vehicle.insurancePolicies.find(p => p.startDate <= now);
  const schedules = vehicle.schedules.map((schedule) => ({ schedule, state: calculateScheduleState(schedule, stats.current, stats.averageDaily, now) }));
  const next = schedules.sort((a, b) => {
    const aValue = Math.min(a.state.daysRemaining ?? Infinity, (a.state.kmRemaining ?? Infinity) / Math.max(stats.averageDaily, 1));
    const bValue = Math.min(b.state.daysRemaining ?? Infinity, (b.state.kmRemaining ?? Infinity) / Math.max(stats.averageDaily, 1));
    return aValue - bValue;
  })[0];
  const history = mergeHistory({ mileage: vehicle.mileageReadings, fuel: vehicle.fuelEntries, maintenance: vehicle.maintenance, expenses: vehicle.expenses }).slice(0, 5);
  const image = vehicleImage(vehicle);

  return <div className="space-y-7">
    <header className="flex items-center justify-between"><div><h1 className="text-2xl font-medium tracking-[-0.03em]">Votre registre</h1></div><Link href="/garage" className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]">{vehicle.brand} {vehicle.model}</Link></header>

    <section className="overflow-hidden rounded-2xl bg-[var(--surface)] lg:grid lg:grid-cols-[minmax(280px,.85fr)_1.15fr_.7fr]">
      <div className="relative min-h-60 lg:min-h-[340px]"><Image src={image.src} alt={image.illustrative ? `Illustration de ${vehicle.brand} ${vehicle.model}` : `${vehicle.brand} ${vehicle.model}`} fill priority unoptimized={Boolean(vehicle.photoUrl && !vehicle.photoPath)} sizes="(max-width:1024px) 100vw, 32vw" className="object-cover lg:object-contain" />{image.illustrative ? <span className="absolute bottom-3 left-3 rounded-md bg-[var(--ink)]/90 px-2 py-1 text-[10px] text-[var(--muted)]">Illustration · image générée</span> : null}</div>
      <div className="flex flex-col justify-between border-t border-[var(--line-soft)] p-6 lg:border-l lg:border-t-0 lg:p-8">
        <div><p className="text-sm text-[var(--muted)]">{vehicle.year} · {vehicle.trim}</p><h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">{vehicle.brand} {vehicle.model}</h2><p className="mt-2 text-[var(--muted)]">{vehicle.powertrain}</p></div>
        <div className="mt-12"><div className="flex items-end gap-3"><span className="text-5xl font-medium tracking-[-0.04em] sm:text-6xl">{formatNumber(stats.current)}</span><span className="pb-1 text-2xl text-[var(--muted)]">km</span></div><div className="mt-4 flex items-center gap-3"><SourceBadge kind="real" /><span className="text-xs text-[var(--quiet)]">Dernier relevé enregistré</span></div></div>
      </div>
      <div className="border-t border-[var(--line-soft)] p-6 lg:border-l lg:border-t-0 lg:p-8"><p className="text-sm text-[var(--muted)]">Prochaine échéance</p>{next ? <><Wrench className="mt-8 size-7 text-[var(--warning)]" strokeWidth={1.5} /><h3 className="mt-4 text-xl font-medium">{next.schedule.title}</h3><div className="mt-5 space-y-2 text-sm"><p className={next.state.status === "OVERDUE" ? "text-[var(--danger)]" : "text-[var(--text)]"}>{next.state.kmRemaining !== null ? `${formatNumber(next.state.kmRemaining, " km")} restants` : "Sans seuil kilométrique"}</p><p className="text-[var(--muted)]">{next.state.daysRemaining !== null ? `${formatNumber(next.state.daysRemaining, " jours")} restants` : next.state.estimatedDate ? `Estimation : ${formatDate(next.state.estimatedDate)}` : "Sans date définie"}</p></div><Link href="/entretiens" className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--accent)]">Voir l’échéance <ArrowRight className="size-4" /></Link></> : <p className="mt-8 text-sm leading-6 text-[var(--muted)]">Aucune échéance active. Ajoutez-en une dans Entretiens.</p>}</div>
    </section>

    <section className="grid grid-cols-2 divide-y divide-[var(--line-soft)] rounded-2xl bg-[var(--surface)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
      <Metric label="Ce mois" value={formatNumber(stats.month, " km")} kind="calculated" detail={change === null ? "Comparaison indisponible" : `${change >= 0 ? "+" : ""}${formatNumber(change, " %")} vs mois précédent`} />
      <Metric label="Cette année" value={formatNumber(stats.year, " km")} kind="calculated" />
      <Metric label="Moyenne / jour" value={formatNumber(stats.averageDaily, " km")} kind="calculated" />
      <Metric label="Projection annuelle" value={formatNumber(stats.annualProjection, " km")} kind="estimated" />
    </section>

    <section className="grid grid-cols-2 divide-y divide-[var(--line-soft)] rounded-xl bg-[var(--surface)] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Metric label="Coût du mois" value={formatCurrency(monthExpenses)} kind="calculated" /><Metric label="Consommation fiable" value={fuel.consumption === null ? "—" : formatNumber(fuel.consumption, " L/100 km")} kind="calculated" /><Metric label="Distance entre pleins" value={fuel.averageDistance === null ? "—" : formatNumber(fuel.averageDistance, " km")} kind="calculated" /></section>
    <Panel title="Contrats et échéances"><div className="grid gap-5 p-5 sm:grid-cols-3"><div><h3 className="text-sm text-[var(--muted)]">Garantie</h3><p className="mt-2 text-sm">{warrantyStatus ? warrantyStatus.status === "EXPIRED" ? "Garantie expirée" : warrantyStatus.status === "UPCOMING" ? "Garantie à venir" : `${warrantyStatus.status === "SOON" ? "Expire bientôt" : "Garantie active"} · encore ${warrantyStatus.months > 0 ? `${warrantyStatus.months} mois` : `${warrantyStatus.days} jours`}${warrantyStatus.km === null ? "" : ` ou ${formatNumber(warrantyStatus.km, " km")}`}` : "Non renseignée"}</p></div><div><h3 className="text-sm text-[var(--muted)]">Contrôle technique</h3><p className="mt-2 text-sm">{inspection ? `${inspection.requiresFollowUp ? "Contre-visite" : "Prochain contrôle"} : ${formatDate(inspection.requiresFollowUp && inspection.followUpDeadline ? inspection.followUpDeadline : inspection.nextDate)}` : "Non renseigné"}</p></div><div><h3 className="text-sm text-[var(--muted)]">Assurance</h3><p className="mt-2 text-sm">{insurance ? `${insurance.company} · renouvellement ${formatDate(insurance.renewalDate)}` : "Non renseignée"}</p></div></div><Link href={`/suivi?vehicle=${vehicle.id}`} className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Gérer le suivi véhicule <ArrowRight className="size-4" /></Link></Panel>
    {alerts.length ? <Panel title="Alertes importantes"><div className="divide-y divide-[var(--line-soft)] px-5">{alerts.slice(0, 5).map(a => <Link key={a.key} href={a.href} className="flex flex-col justify-between gap-2 py-4 text-sm sm:flex-row"><span className={a.urgent ? "text-[var(--danger)]" : "text-[var(--warning)]"}>{a.title}</span><span className="text-[var(--muted)]">{a.detail}</span></Link>)}</div></Panel> : null}
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <Panel title="Kilométrage mensuel" description="Les mois futurs prolongent votre rythme moyen actuel."><div className="px-3 pb-4 pt-5 sm:px-6"><DistanceChart data={monthSeries([{ mileage: vehicle.purchaseMileage, date: vehicle.purchaseDate }, ...vehicle.mileageReadings], stats.averageMonthly, now)} /><div className="mt-3 flex flex-wrap gap-4 border-t border-[var(--line-soft)] pt-4 text-xs text-[var(--muted)]"><span><SourceBadge kind="calculated" className="mr-2" />distances observées</span><span><SourceBadge kind="estimated" className="mr-2" />projection</span></div></div></Panel>
      <div className="space-y-7">
        <Panel title="Dépenses"><div className="divide-y divide-[var(--line-soft)] px-5"><ExpenseLine label="Ce mois" value={monthExpenses} /><ExpenseLine label="Cette année" value={yearExpenses} /></div><Link href="/depenses" className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Voir les dépenses <ArrowRight className="size-4" /></Link></Panel>
        <Panel title="Historique récent"><div className="divide-y divide-[var(--line-soft)] px-5">{history.map((event) => <div key={`${event.type}-${event.id}`} className="flex gap-3 py-4">{event.type === "fuel" ? <Fuel className="mt-0.5 size-4 text-[var(--accent)]" /> : event.type === "mileage" ? <Gauge className="mt-0.5 size-4 text-[var(--accent)]" /> : event.type === "maintenance" ? <Wrench className="mt-0.5 size-4 text-[var(--warning)]" /> : <ReceiptText className="mt-0.5 size-4 text-[var(--muted)]" />}<div className="min-w-0 flex-1"><p className="truncate text-sm">{event.title}</p><p className="mt-1 text-xs text-[var(--quiet)]">{formatDate(event.date)}</p></div>{event.amount !== undefined ? <span className="text-sm">{formatCurrency(event.amount)}</span> : null}</div>)}</div><Link href="/historique" className="flex items-center justify-between border-t border-[var(--line-soft)] px-5 py-4 text-sm text-[var(--accent)]">Tout l’historique <ArrowRight className="size-4" /></Link></Panel>
      </div>
    </div>
  </div>;
}

function Metric({ label, value, kind, detail }: { label: string; value: string; detail?: string; kind: "real" | "calculated" | "estimated" }) { return <div className="min-w-0 p-4 sm:p-6"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-xl font-medium tracking-[-0.03em] sm:text-2xl">{value}</p><SourceBadge kind={kind} className="mt-3" />{detail ? <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p> : null}</div>; }
function ExpenseLine({ label, value }: { label: string; value: number }) { return <div className="flex items-end justify-between py-5"><span className="text-sm text-[var(--muted)]">{label}</span><span className="text-xl font-medium">{formatCurrency(value)}</span></div>; }
