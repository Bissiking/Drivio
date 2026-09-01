// src/app/(app)/depenses/page.tsx
import type { Metadata } from "next";
import { Plus, ReceiptText } from "lucide-react";
import { ExpenseForm } from "@/components/forms/expense-form";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { SourceBadge } from "@/components/ui/source-badge";
import { requirePageUser } from "@/lib/auth";
import { calculateCostStats } from "@/lib/calculations";
import { LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Dépenses" };

export default async function ExpensesPage() {
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, brand: true, model: true, purchaseDate: true, purchaseMileage: true, mileageReadings: { orderBy: { date: "desc" }, take: 1 } } });
  const expenses = await db.expense.findMany({ where: { vehicle: { userId: user.id } }, include: { vehicle: { select: { brand: true, model: true } } }, orderBy: { date: "desc" }, take: 200 });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const total = expenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const month = expenses.filter((entry) => entry.date >= monthStart).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const year = expenses.filter((entry) => entry.date >= yearStart).reduce((sum, entry) => sum + Number(entry.amount), 0);
  const driven = vehicles.reduce((sum, vehicle) => sum + Math.max(0, (vehicle.mileageReadings[0]?.mileage ?? vehicle.purchaseMileage) - vehicle.purchaseMileage), 0);
  const oldest = vehicles.length ? new Date(Math.min(...vehicles.map((vehicle) => vehicle.purchaseDate.getTime()))) : now;
  const activeMonths = Math.max(1, (now.getTime() - oldest.getTime()) / (86_400_000 * 30.4375));
  const costs = calculateCostStats(total, driven, activeMonths);
  return <div className="space-y-8">
    <PageHeader title="Dépenses" description="Un coût réel consolidé, du carburant aux accessoires." />
    <section className="grid divide-y divide-[var(--line-soft)] rounded-2xl bg-[var(--surface)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">{[["Ce mois", formatCurrency(month), "real"], ["Cette année", formatCurrency(year), "real"], ["Total", formatCurrency(total), "real"], ["Moyenne mensuelle", formatCurrency(costs.averageMonthly), "calculated"], ["Coût / km", formatCurrency(costs.costPerKm), "calculated"]].map(([label, value, kind]) => <div key={label} className="p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-xl font-medium">{value}</p><SourceBadge kind={kind as "real" | "calculated"} className="mt-3" /></div>)}</section>
    {vehicles.length ? <details className="rounded-2xl bg-[var(--surface)]"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><Plus className="size-4 text-[var(--accent)]" />Ajouter une dépense</summary><div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><ExpenseForm vehicles={vehicles} /></div></details> : null}
    <Panel title="Registre des dépenses"><div className="divide-y divide-[var(--line-soft)]">{expenses.map((expense) => <article key={expense.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[120px_1fr_180px_auto] sm:items-center sm:px-6"><time className="text-sm text-[var(--quiet)]">{formatDate(expense.date)}</time><div><p className="text-sm font-medium">{LABELS[expense.category] ?? expense.category}</p><p className="mt-1 text-xs text-[var(--muted)]">{expense.vehicle.brand} {expense.vehicle.model}{expense.comment ? ` · ${expense.comment}` : ""}</p></div><span className="text-sm text-[var(--muted)]">{expense.mileage ? formatNumber(expense.mileage, " km") : "—"}</span><strong className="font-medium">{formatCurrency(Number(expense.amount))}</strong></article>)}{expenses.length === 0 ? <div className="flex flex-col items-center py-14 text-[var(--muted)]"><ReceiptText className="mb-3 size-7" strokeWidth={1.4} /><p className="text-sm">Aucune dépense enregistrée.</p></div> : null}</div></Panel>
  </div>;
}
