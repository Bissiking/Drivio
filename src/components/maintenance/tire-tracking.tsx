import { MutationOnly, PermissionText } from "@/components/sharing/vehicle-permissions";
import Link from "next/link";
import { TireRecordLink } from "./tire-record-link";
import { MaintenanceIcon } from "./maintenance-icon";
import type { TireSet } from "@/generated/prisma/client";
import { Panel } from "@/components/layout/panel";
import { RecordForm, type RecordValues } from "@/components/forms/record-form";
import { ApiActionButton } from "@/components/forms/api-action-button";
import { activeTireAxles, estimateTireLife, tirePositionLabels, tireQualityLabels, tireSeasonLabels } from "@/lib/tire-estimation";
import { SourceBadge } from "@/components/ui/source-badge";
import { drivetrainLabels } from "@/lib/drivetrain";
import { tireDistance } from "@/lib/analytics";
import { formatDate, formatNumber } from "@/lib/format";

export function TireTracking({ vehicleId, drivetrain, tires, currentMileage, now }: { vehicleId: string; drivetrain: string; tires: TireSet[]; currentMileage: number; now: Date }) {
  const active = activeTireAxles(tires);
  return <section id="pneus" className="scroll-mt-6"><Panel title="Pneumatiques" description="Deux suivis indépendants. Un nouveau montage remplace seulement les pneus de l’essieu choisi.">
    <div className="px-5 sm:px-6">
      <p className="border-b border-[var(--line-soft)] py-4 text-sm text-[var(--muted)]">{drivetrainLabels[drivetrain]} · <Link href={`/garage#vehicle-${vehicleId}`} className="text-[var(--accent)] underline underline-offset-4"><PermissionText write="Renseigner au garage" read="Voir au garage" /></Link></p>
      <div className="divide-y divide-[var(--line-soft)]">{(["AVANT", "ARRIERE"] as const).map(position => {
        const tire = active.find(t => t.position === position);
        const estimate = tire ? estimateTireLife(tire, currentMileage, now, drivetrain) : null;
        return <article key={position} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-5">
          <div className="min-w-0"><h3 className="flex items-center gap-2 font-medium"><MaintenanceIcon type="PNEUS" title={tirePositionLabels[position]} className="size-5 text-[var(--muted)]" />{tirePositionLabels[position]}</h3>{tire ? <><p className="mt-2 break-words text-sm">{tire.brand}{tire.model ? ` ${tire.model}` : ""}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{tireSeasonLabels[tire.type]} · {tireQualityLabels[tire.quality]} · {tire.dimensions}</p><p className="mt-2 text-sm text-[var(--muted)]">Montés le {formatDate(tire.mountedAt)} à {formatNumber(tire.mountedMileage, " km")}</p></> : <p className="mt-2 text-sm text-[var(--muted)]">Aucun montage renseigné pour cet essieu.</p>}</div>
          {estimate ? <div className="text-sm"><p><SourceBadge kind="estimated" /> {estimate.percent === null ? "Estimation indisponible" : `${Math.round(estimate.percent)} % restants estimés`}</p><p className="mt-1 text-xs text-[var(--muted)]">Base {estimate.manual ? "manuelle" : "automatique"} : {formatNumber(estimate.lifeKm, " km")}</p><TireRecordLink recordId={tire!.sourceId} /></div> : null}
        </article>;
      })}</div>
      <p className="pb-4 text-xs leading-5 text-[var(--warning)]"><PermissionText write="Usure estimée — contrôle manuel nécessaire. Les valeurs manuelles existantes sont conservées ; effacez la longévité personnalisée pour activer le calcul automatique." read="Usure estimée — contrôle manuel nécessaire. La base manuelle ou automatique et la longévité supposée sont indiquées sur chaque essieu." /></p>
      <MutationOnly><details className="border-t border-[var(--line-soft)] py-4"><summary className="cursor-pointer py-2 text-sm font-medium text-[var(--accent)]">Enregistrer un montage · 2 ou 4 pneus</summary><div className="pt-4"><RecordForm kind="tires" vehicleId={vehicleId} drivetrain={drivetrain} /></div></details></MutationOnly>
      {tires.length ? <div className="border-t border-[var(--line-soft)] pb-2"><h3 className="pt-5 font-medium">Montages et historique</h3><div className="divide-y divide-[var(--line-soft)]">{tires.map(tire => {
        const initial: RecordValues = Object.fromEntries(Object.entries(tire).filter(([, value]) => !Array.isArray(value)).map(([key, value]) => [key, value instanceof Date ? value.toISOString().slice(0, 10) : value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : String(value)]));
        return <details key={tire.id} id={`tire-record-${tire.id}`} className="scroll-mt-6 py-4"><summary className="cursor-pointer py-2 text-sm"><span className="font-medium">{tire.brand} · {tirePositionLabels[tire.position]}</span><span className="ml-2 text-[var(--muted)]">{tire.removedAt ? "Démontés" : "En service"} · {formatDate(tire.mountedAt)}</span></summary><div className="space-y-5 pt-3">
          <p className="text-xs leading-5 text-[var(--muted)]">{formatNumber(tireDistance(tire, currentMileage), " km parcourus")}{tire.removedAt ? ` · Démontés le ${formatDate(tire.removedAt)} à ${formatNumber(tire.removedMileage!, " km")}` : ""}</p>
          <RecordForm kind="tires" vehicleId={vehicleId} id={tire.id} initial={initial} drivetrain={drivetrain} />
          <ApiActionButton endpoint={`/api/vehicle-records/tires/${tire.id}`} method="DELETE" variant="danger" confirmation="Supprimer ce montage et recalculer son suivi ? Les anciens pneus ne seront pas remis en service automatiquement.">Supprimer le montage</ApiActionButton>
        </div></details>;
      })}</div></div> : null}
    </div>
  </Panel></section>;
}
