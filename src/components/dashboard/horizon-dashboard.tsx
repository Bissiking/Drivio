import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Fuel, Gauge, ReceiptText, Wrench, UserRound } from "lucide-react";
import type { MaintenanceSchedule, Vehicle } from "@/generated/prisma/client";
import type { HistoryEvent } from "@/lib/history";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { maintenanceState } from "@/lib/maintenance-date";
import { vehicleImage } from "@/lib/vehicle-images";
import { HorizonVehicleSelect } from "@/components/layout/horizon-vehicle-select";
import { Brand } from "@/components/layout/brand";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { QuickEntryActions } from "@/components/forms/quick-entry";
import { MutationOnly } from "@/components/sharing/vehicle-permissions";

const activityIcons = { mileage: Gauge, fuel: Fuel, expense: ReceiptText, maintenance: Wrench };

type Props = {
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "year" | "trim" | "powertrain" | "photoPath" | "photoUrl" | "isPrimary">;
  vehicles: { id: string; brand: string; model: string; status: string }[];
  current: number;
  monthDistance: number;
  consumption: number | null;
  monthExpenses: number;
  schedules: { schedule: MaintenanceSchedule; state: ReturnType<typeof maintenanceState> }[];
  history: HistoryEvent[];
};
export function HorizonDashboard({ vehicle, vehicles, current, monthDistance, consumption, monthExpenses, schedules, history }: Props) {
  const image = vehicleImage(vehicle), next = schedules[0];
  const metrics = [
    { label: "Compteur enregistré", value: formatNumber(current, " km"), detail: `${formatNumber(monthDistance, " km")} ce mois`, icon: Gauge, source: "real" as const },
    { label: "Consommation fiable", value: consumption === null ? "—" : formatNumber(consumption, " L/100 km"), detail: consumption === null ? "Deux pleins complets nécessaires" : "Entre pleins complets", icon: Fuel, source: "calculated" as const },
    { label: "Coût d’usage du mois", value: formatCurrency(monthExpenses), detail: "Carburant inclus", icon: ReceiptText, source: "calculated" as const },
    { label: "Prochain entretien", value: next?.state.status === "OVERDUE" ? "En retard" : next ? next.state.kmRemaining !== null ? formatNumber(next.state.kmRemaining, " km") : next.state.daysRemaining !== null ? formatNumber(next.state.daysRemaining, " jours") : "À préciser" : "Non planifié", detail: next?.schedule.title ?? "Aucune échéance active", icon: Wrench, source: "calculated" as const },
  ];
  return <>
    <header className="horizon-heading"><div className="horizon-mobile-brand"><Brand horizon /></div><div className="horizon-heading-title"><h1>Tableau de bord</h1><p>Vue d’ensemble de vos véhicules</p></div><Link href="/parametres" aria-label="Paramètres du compte" className="horizon-account"><UserRound className="size-5" /></Link></header>
    <div className="horizon-controls"><HorizonVehicleSelect vehicles={vehicles} selected={vehicle.id} current={current} image={{ ...image, unoptimized: Boolean(vehicle.photoUrl && !vehicle.photoPath) }} /><Link href="/garage">Garage · {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}<ArrowRight className="size-4" /></Link></div>
    <section className="horizon-vehicle" aria-label={`Votre ${vehicle.brand} ${vehicle.model}`}>
      <div className="horizon-vehicle-photo"><Image src={image.src} alt={image.illustrative ? `Illustration de ${vehicle.brand} ${vehicle.model}` : `${vehicle.brand} ${vehicle.model}`} fill priority unoptimized={Boolean(vehicle.photoUrl && !vehicle.photoPath)} sizes="(max-width:639px) 120px, (max-width:1023px) 50vw, 45vw" />{image.illustrative ? <span>Illustration · image générée</span> : null}</div>
      <div className="horizon-vehicle-identity"><h2>{vehicle.brand} {vehicle.model}</h2><p>{vehicle.year} · {vehicle.powertrain || vehicle.trim}</p>{vehicle.isPrimary ? <span className="horizon-primary">Véhicule principal</span> : null}</div>
      <div className="horizon-metrics" aria-label="Synthèse du véhicule">{metrics.map(({ label, value, detail, icon: Icon, source }) => <div className="horizon-metric" key={label} data-status={label === "Prochain entretien" ? next?.state.status : undefined}><Icon className="size-5 text-[var(--accent)]" strokeWidth={1.6} /><div><strong>{value}</strong><p>{label}</p><span className="horizon-metric-detail">{detail}</span><SourceBadge kind={source} className="horizon-metric-source" /></div></div>)}</div>
    </section>
    <div className="horizon-overview">
      <Panel title="Prochaines actions" className="horizon-upcoming"><div className="horizon-register">
        {schedules.slice(0, 4).map(({ schedule, state }) => <Link key={schedule.id} href={`/entretiens?vehicle=${vehicle.id}#entretien-${schedule.id}`} className="horizon-register-row" data-status={state.status}><Wrench className="size-5 shrink-0 text-[var(--accent)]" /><div><strong>{schedule.title}</strong><span className="horizon-due-detail">{state.status === "OVERDUE" ? "Échéance dépassée" : state.kmRemaining !== null ? `Dans ${formatNumber(state.kmRemaining, " km")}` : schedule.dueDate ? `Le ${formatDate(schedule.dueDate)}` : "À préciser"}{state.estimatedDate && !schedule.dueDate ? ` · ≈ ${formatDate(state.estimatedDate)}` : ""}</span></div><ArrowRight className="size-4 shrink-0" /></Link>)}
        {!schedules.length ? <p className="py-6 text-sm text-[var(--muted)]">Aucun entretien planifié pour ce véhicule.</p> : null}
      </div><Link className="horizon-panel-link" href={`/suivi?vehicle=${vehicle.id}`}>Tout le suivi <ArrowRight className="size-4" /></Link></Panel>
      <Panel title="Activité récente" className="horizon-activity"><div className="horizon-register">{history.slice(0, 4).map(event => { const Icon = activityIcons[event.type]; return <div key={`${event.type}-${event.id}`} className="horizon-register-row"><Icon className="size-5 shrink-0 text-[var(--accent)]" /><div><strong>{event.title}</strong><span>{formatDate(event.date)}</span></div>{event.amount !== undefined ? <span className="shrink-0 text-sm">{formatCurrency(event.amount)}</span> : null}</div>; })}{!history.length ? <p className="py-6 text-sm text-[var(--muted)]">Votre activité apparaîtra après une première saisie.</p> : null}</div><Link className="horizon-panel-link" href={`/historique?vehicle=${vehicle.id}`}>Voir l’historique <ArrowRight className="size-4" /></Link></Panel>
      <MutationOnly><Panel title="Ajout rapide" className="horizon-quick-actions"><div className="p-4 sm:p-5"><QuickEntryActions compact vehicleId={vehicle.id} /></div></Panel></MutationOnly>
    </div>
  </>;
}
