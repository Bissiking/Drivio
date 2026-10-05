// src/app/(app)/historique/page.tsx
import type { Metadata } from "next";
import { Fuel, Gauge, History, ReceiptText, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requirePageUser } from "@/lib/auth";
import { LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { mergeHistory } from "@/lib/history";

export const metadata: Metadata = { title: "Historique" };

export default async function HistoryPage() {
  const user = await requirePageUser();
  const [mileage, fuel, maintenance, expenses, vehicles] = await Promise.all([
    db.mileageReading.findMany({ where: { vehicle: { userId: user.id } } }),
    db.fuelEntry.findMany({ where: { vehicle: { userId: user.id } } }),
    db.maintenanceRecord.findMany({ where: { vehicle: { userId: user.id } } }),
    db.expense.findMany({ where: { vehicle: { userId: user.id } } }),
    db.vehicle.findMany({ where: { userId: user.id }, select: { id: true, brand: true, model: true } }),
  ]);
  const vehicleNames = new Map(vehicles.map(vehicle => [vehicle.id, `${vehicle.brand} ${vehicle.model}`]));
  const events = mergeHistory({ mileage, fuel, maintenance, expenses });
  return <div className="space-y-8">
    <PageHeader title="Historique" description="Tous les faits du garage dans une chronologie unique." />
    {events.length ? <div className="relative mx-auto max-w-4xl before:absolute before:bottom-0 before:left-[19px] before:top-0 before:w-px before:bg-[var(--line)] sm:before:left-[155px]">{events.map((event, index) => {
      const previous = events[index - 1];
      const showDate = !previous || previous.date.toDateString() !== event.date.toDateString();
      return <article key={`${event.type}-${event.id}`} className="relative grid grid-cols-[40px_1fr] gap-4 pb-7 sm:grid-cols-[132px_48px_1fr] sm:gap-0">{showDate ? <time className="col-span-2 mb-2 text-xs font-medium uppercase tracking-[.08em] text-[var(--muted)] sm:col-span-1 sm:mb-0 sm:pt-3">{formatDate(event.date)}</time> : <span className="hidden sm:block" />}<span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--ink)] sm:mx-1">{event.type === "mileage" ? <Gauge className="size-4 text-[var(--accent)]" /> : event.type === "fuel" ? <Fuel className="size-4 text-[var(--accent)]" /> : event.type === "maintenance" ? <Wrench className="size-4 text-[var(--warning)]" /> : <ReceiptText className="size-4 text-[var(--muted)]" />}</span><div className="rounded-2xl bg-[var(--surface)] px-5 py-4 sm:ml-3"><div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-medium">{event.title}</h2><p className="mt-1 text-sm text-[var(--accent)]">{vehicleNames.get(event.vehicleId)}</p><p className="mt-1 text-sm text-[var(--muted)]">{LABELS[event.detail] ?? event.detail}</p></div>{event.amount !== undefined ? <strong className="whitespace-nowrap text-sm font-medium">{formatCurrency(event.amount)}</strong> : null}</div></div></article>;
    })}</div> : <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted)]"><History className="mb-4 size-8" strokeWidth={1.4} /><p className="text-sm">Votre historique apparaîtra ici.</p></div>}
  </div>;
}
