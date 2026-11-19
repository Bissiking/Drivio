import { vehicleWhere, shareFor, vehicleRights } from "@/lib/vehicle-access";
import { VehiclePermissions, MutationOnly } from "@/components/sharing/vehicle-permissions";
// src/app/(app)/entretiens/page.tsx
import Link from "next/link";
import { VehiclePicker } from "@/components/layout/vehicle-picker";
import type { Metadata } from "next";
import { CalendarClock, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { MaintenanceIcon } from "@/components/maintenance/maintenance-icon";
import { ApiActionButton } from "@/components/forms/api-action-button";
import { MaintenanceRecordForm, MaintenanceScheduleForm } from "@/components/forms/maintenance-forms";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { requirePageUser } from "@/lib/auth";
import { drivingRate } from "@/lib/predictions";
import { maintenanceState } from "@/lib/maintenance-date";
import { maintenanceLabel } from "@/lib/taxonomy";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber, toDateInput } from "@/lib/format";

export const metadata: Metadata = { title: "Entretiens" };

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const query = await searchParams;
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: { ...vehicleWhere(user.id, "COMPLETE"), status: "ACTIVE" }, select: { id: true, userId: true, shares: shareFor(user.id), brand: true, model: true, mileageReadings: { orderBy: { date: "asc" } } } });
  const records = await db.maintenanceRecord.findMany({ where: { vehicle: vehicleWhere(user.id, "COMPLETE"), ...(query.vehicle ? { vehicleId: query.vehicle } : {}) }, orderBy: { date: "desc" }, include: { vehicle: { select: { brand: true, model: true, userId: true, shares: shareFor(user.id) } } }, take: 50 });
  const schedules = await db.maintenanceSchedule.findMany({
    where: { vehicle: vehicleWhere(user.id, "COMPLETE"), completedAt: null, ...(query.vehicle ? { vehicleId: query.vehicle } : {}) },
    include: {
      vehicle: {
        select: { brand: true, model: true, userId: true, shares: shareFor(user.id), purchaseMileage: true, finalMileage: true, mileageReadings: { orderBy: { date: "asc" } } },
      },
    },
  });
  const options = vehicles.filter(v => (!query.vehicle || v.id === query.vehicle) && vehicleRights(v, user.id).canWrite).map(({ id, brand, model }) => ({ id, brand, model }));
  const scheduled = schedules.map((schedule) => {
    const current = schedule.vehicle.finalMileage ?? drivingRate(schedule.vehicle.mileageReadings).current ?? schedule.vehicle.purchaseMileage;
    return { schedule, state: maintenanceState(schedule, current, schedule.vehicle.mileageReadings) };
  }).sort((a, b) => ({ OVERDUE: 0, SOON: 1, OK: 2 }[a.state.status] - { OVERDUE: 0, SOON: 1, OK: 2 }[b.state.status]));
  return <div className="space-y-8">
    <PageHeader title="Entretiens" description="Anticipez par date, kilométrage ou les deux. Drivio retient toujours le seuil atteint en premier." />
    <div className="space-y-3"><Link href="/entretiens" className="inline-flex min-h-11 items-center text-sm text-[var(--accent)]">Tous les véhicules</Link><VehiclePicker vehicles={vehicles} selected={query.vehicle} href="/entretiens" /></div>
    {options.length ? <div className="grid gap-5 xl:grid-cols-2"><details className="rounded-2xl bg-[var(--surface)]"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><Plus className="size-4 text-[var(--accent)]" />Enregistrer un entretien réalisé</summary><div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><MaintenanceRecordForm vehicles={options} /></div></details><details className="rounded-2xl bg-[var(--surface)]" open={scheduled.length === 0}><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><CalendarClock className="size-4 text-[var(--accent)]" />Créer une échéance</summary><div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><MaintenanceScheduleForm vehicles={options} /></div></details></div> : <p className="text-sm text-[var(--warning)]">Les entretiens nécessitent un accès complet. La saisie nécessite également le droit de modification.</p>}
    <div>
      <h2 className="mb-4 text-xl font-medium tracking-[-0.02em]">Échéances actives</h2>
      {scheduled.length ? <div id="echeances" className="scroll-mt-6 divide-y divide-[var(--line-soft)] overflow-hidden rounded-2xl bg-[var(--surface)]">{scheduled.map(({ schedule, state }) => <VehiclePermissions key={schedule.id} canWrite={vehicleRights(schedule.vehicle, user.id).canWrite}><article key={schedule.id} id={`entretien-${schedule.id}`} className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px] lg:items-center">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><MaintenanceIcon type={schedule.type} title={schedule.title} className="size-5 text-[var(--muted)]" /><h3 className="break-words font-medium">{schedule.title}</h3><Status status={state.status} /></div><p className="mt-2 text-sm text-[var(--muted)]">{schedule.vehicle.brand} {schedule.vehicle.model} · {maintenanceLabel(schedule.type)}</p></div>
          <div><p className="text-xs text-[var(--quiet)]">Kilomètres restants</p><p className="mt-1 font-medium">{state.kmRemaining === null ? "—" : formatNumber(state.kmRemaining, " km")}</p></div>
          <div><p className="text-xs text-[var(--quiet)]">Date</p><p className="mt-1 font-medium">{schedule.dueDate ? formatDate(schedule.dueDate) : state.estimatedDate ? `≈ ${formatDate(state.estimatedDate)}` : "—"}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <ApiActionButton endpoint={`/api/maintenance/${schedule.id}`}><Check aria-hidden="true" className="size-3.5" />Marquer réalisé</ApiActionButton>
          <ApiActionButton endpoint={`/api/maintenance/${schedule.id}`} method="DELETE" variant="danger" confirmation={`Supprimer l’échéance « ${schedule.title} » ?`}><Trash2 aria-hidden="true" className="size-3.5" />Supprimer l’échéance</ApiActionButton>
        </div>
        <MutationOnly><details className="mt-3"><summary className="w-fit cursor-pointer py-2 text-sm text-[var(--accent)]"><span className="inline-flex items-center gap-2 align-middle"><Pencil aria-hidden="true" className="size-3.5" />Modifier l’échéance<span className="sr-only"> : {schedule.title}</span></span></summary><div className="pt-3">
          <MaintenanceScheduleForm vehicles={[{ id: schedule.vehicleId, brand: schedule.vehicle.brand, model: schedule.vehicle.model }]} schedule={{
            id: schedule.id, vehicleId: schedule.vehicleId, type: schedule.type, title: schedule.title, notes: schedule.notes,
            dueDate: schedule.dueDate ? toDateInput(schedule.dueDate) : "", dueMileage: schedule.dueMileage,
            warningDays: schedule.warningDays, warningKm: schedule.warningKm, provenance: schedule.provenance,
            reference: schedule.reference, estimatedCost: schedule.estimatedCost === null ? null : Number(schedule.estimatedCost),
            cycleStartDate: schedule.cycleStartDate ? toDateInput(schedule.cycleStartDate) : "", cycleStartMileage: schedule.cycleStartMileage,
          }} />
        </div></details></MutationOnly>
      </article></VehiclePermissions>)}</div> : <Panel className="p-8 text-sm text-[var(--muted)]">Aucune échéance active.</Panel>}
    </div>
    <Panel title="Entretiens réalisés"><div className="divide-y divide-[var(--line-soft)]">{records.map((record) => <VehiclePermissions key={record.id} canWrite={vehicleRights(record.vehicle, user.id).canWrite}><article key={record.id} className="px-5 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
        <time className="text-sm text-[var(--quiet)]">{formatDate(record.date)}</time>
        <div className="min-w-0"><h3 className="flex items-start gap-2 text-sm font-medium"><MaintenanceIcon type={record.type} title={record.title} className="size-4 text-[var(--muted)]" /><span className="min-w-0 break-words">{record.title}</span></h3><p className="mt-1 text-xs text-[var(--muted)]">{record.vehicle.brand} {record.vehicle.model} · {maintenanceLabel(record.type)}{record.mileage !== null ? ` · ${formatNumber(record.mileage, " km")}` : ""}</p></div>
        <span className="text-sm">{record.cost !== null ? formatCurrency(Number(record.cost)) : "—"}</span>
      </div>
      <MutationOnly><details className="mt-3"><summary className="w-fit cursor-pointer py-2 text-sm text-[var(--accent)]"><span className="inline-flex items-center gap-2 align-middle"><Pencil aria-hidden="true" className="size-3.5" />Modifier l’entretien<span className="sr-only"> : {record.title}</span></span></summary><div className="pt-3">
        <MaintenanceRecordForm vehicles={[{ id: record.vehicleId, ...record.vehicle }]} record={{
          id: record.id, vehicleId: record.vehicleId, type: record.type, title: record.title,
          date: toDateInput(record.date), mileage: record.mileage, cost: record.cost === null ? null : Number(record.cost), notes: record.notes,
        }} />
      </div></details></MutationOnly>
      <div className="mt-2"><ApiActionButton endpoint={`/api/maintenance/records/${record.id}`} method="DELETE" variant="danger" confirmation={`Supprimer l’entretien « ${record.title} » et sa dépense associée ?`}><Trash2 aria-hidden="true" className="size-3.5" />Supprimer l’entretien</ApiActionButton></div>
    </article></VehiclePermissions>)}{records.length === 0 ? <p className="px-6 py-10 text-center text-sm text-[var(--muted)]">Aucun entretien réalisé.</p> : null}</div></Panel>
  </div>;
}

function Status({ status }: { status: "OK" | "SOON" | "OVERDUE" }) { const text = status === "OK" ? "OK" : status === "SOON" ? "Bientôt" : "En retard"; const color = status === "OK" ? "text-[var(--accent)] border-[var(--accent)]/30" : status === "SOON" ? "text-[var(--warning)] border-[var(--warning)]/30" : "text-[var(--danger)] border-[var(--danger)]/30"; return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[.08em] ${color}`}>{text}</span>; }
