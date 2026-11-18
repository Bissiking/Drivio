import { MutationOnly, PermissionText } from "@/components/sharing/vehicle-permissions";
// src/components/maintenance/maintenance-tracking.tsx
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { Panel } from "@/components/layout/panel";
import { ConsumableGauge, gaugeColor, gaugeStatus } from "./consumable-gauges";
import { MaintenanceCycleForm } from "@/components/forms/maintenance-cycle-form";
import { MaintenanceScheduleForm } from "@/components/forms/maintenance-forms";
import { ApiActionButton } from "@/components/forms/api-action-button";
import type { MaintenanceGauge } from "@/lib/maintenance-gauges";
import { formatDate, formatNumber } from "@/lib/format";

type Schedule = { id: string; dueDate: Date | null; dueMileage: number | null; cycleStartDate: Date | null; cycleStartMileage: number | null };
export function MaintenanceTracking({ vehicle, items, schedules }: { vehicle: { id: string; brand: string; model: string; status: string }; items: MaintenanceGauge[]; schedules: Schedule[] }) {
  return <section id="consommables"><Panel title="Usure et entretiens" description="100 % au début de la référence, 0 % à l'échéance. L'usure des pneus est estimée selon leur kilométrage et une longévité supposée réglable.">
    <div className="divide-y divide-[var(--line-soft)] px-5 sm:px-6">{items.map(item => {
      const schedule = item.kind === "SCHEDULE" ? schedules.find(s => `schedule-${s.id}` === item.id) : undefined;
      return <article id={`gauge-${item.id}`} key={item.id} className="py-6"><div className="grid items-start gap-4 sm:grid-cols-[144px_minmax(0,1fr)]"><ConsumableGauge item={item} /><div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-medium">{item.title}</h3><span className="text-sm" style={{ color: gaugeColor(item) }}>{gaugeStatus[item.status]}</span></div><p className="mt-2 text-xs text-[var(--muted)]">{item.isEstimate ? "Usure estimée selon le kilométrage" : "Marge avant entretien · calculée"}</p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-xs text-[var(--quiet)]">{item.isEstimate ? "Kilomètres restants estimés" : "Kilomètres restants"}</dt><dd className="mt-1">{item.kmRemaining === null ? "—" : item.kmRemaining < 0 ? `Dépassée de ${formatNumber(-item.kmRemaining, " km")}` : formatNumber(item.kmRemaining, " km")}</dd>{item.isEstimate && item.estimatedLifeKm ? <dd className="mt-1 text-xs text-[var(--muted)]">Hypothèse : {formatNumber(item.estimatedLifeKm, " km")} de longévité</dd> : null}</div><div><dt className="text-xs text-[var(--quiet)]">{item.dateEstimated ? "Date estimée" : "Date d’échéance"}</dt><dd className="mt-1">{item.dueDate ? `${item.dateEstimated ? "≈ " : ""}${formatDate(item.dueDate)}` : "—"}</dd></div><div><dt className="text-xs text-[var(--quiet)]">{item.kind === "TIRE" ? "Montage" : "Référence de départ"}</dt><dd className="mt-1">{item.referenceDate ? formatDate(item.referenceDate) : "Date non renseignée"}</dd><dd className="mt-1">{item.referenceMileage === null ? "Compteur non renseigné" : formatNumber(item.referenceMileage, " km")}</dd>{item.referenceLabel ? <dd className="mt-1 text-xs text-[var(--muted)]">{item.referenceLabel}</dd> : null}</div></dl>
        <p className={`mt-4 max-w-prose text-xs leading-5 ${item.isEstimate ? "text-[var(--warning)]" : "text-[var(--muted)]"}`}><PermissionText write={item.explanation} read={item.explanation.replace("Réglable dans Pneumatiques.", "La longévité est un paramètre du véhicule.")} /></p>{item.kind === "TIRE" ? <Link href="#pneus" className="mt-4 inline-block py-2 text-sm text-[var(--accent)]"><PermissionText write="Régler la longévité supposée de ces pneus" read="Voir le détail de ces pneus" /></Link> : null}
        {schedule && vehicle.status === "ACTIVE" ? <div className="mt-5 flex flex-wrap items-start gap-4"><ApiActionButton endpoint={`/api/maintenance/${schedule.id}`}><Check className="size-3.5" />Marquer réalisé</ApiActionButton></div> : null}
      </div></div>{schedule && vehicle.status === "ACTIVE" ? <MutationOnly><details className="mt-4 border-t border-[var(--line-soft)] pt-2"><summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Renseigner ou ajuster le début de l’intervalle</summary><div className="max-w-3xl pt-4"><MaintenanceCycleForm schedule={schedule} /></div></details></MutationOnly> : null}</article>;
    })}{!items.length ? <p className="py-6 text-sm text-[var(--muted)]">Aucune échéance ou aucun train de pneus en service. Ajoutez une échéance pour afficher sa jauge.</p> : null}
    {vehicle.status === "ACTIVE" ? <MutationOnly><details className="py-4"><summary className="flex cursor-pointer items-center gap-2 py-2 text-sm font-medium text-[var(--accent)]"><Plus className="size-4" />Ajouter une échéance de contrôle ou de remplacement</summary><div className="pt-4"><MaintenanceScheduleForm vehicles={[{ id: vehicle.id, brand: vehicle.brand, model: vehicle.model }]} /></div></details></MutationOnly> : null}</div>
  </Panel></section>;
}
