import { maintenanceClassification } from "@/lib/taxonomy";
import { db } from "@/lib/db";
import { calculateScheduleState } from "@/lib/calculations";
import { fuelStats } from "@/lib/analytics";
import { vehicleAlerts } from "@/lib/alerts";
import { hubFailure, hubJson, hubUnauthorized, hubUser } from "@/lib/hub";

export async function GET(request: Request) {
  try {
    const user = await hubUser(request);
    if (!user) return hubUnauthorized();
    const vehicleId = new URL(request.url).searchParams.get("vehicle");
    if (!vehicleId || vehicleId.length > 100) return hubJson({ error: { code: "INVALID_QUERY", message: "Le paramètre vehicle est requis (100 caractères maximum)." } }, 400);
    if (user.vehicleIds && !user.vehicleIds.includes(vehicleId)) return hubJson({ error: { code: "NOT_FOUND", message: "Véhicule introuvable." } }, 404);
    const now = new Date(), monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const vehicle = await db.vehicle.findFirst({
      where: { id: vehicleId, userId: user.id },
      select: { id: true, brand: true, model: true, purchaseMileage: true, purchaseDate: true, finalMileage: true,
        mileageReadings: { where: { date: { lte: now } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 1 },
        schedules: { where: { completedAt: null }, orderBy: [{ dueDate: "asc" }, { id: "asc" }], take: 101 },
        warranties: { orderBy: { endDate: "desc" }, take: 21 },
        inspections: { where: { date: { lte: now } }, orderBy: { date: "desc" }, take: 1 },
        insurancePolicies: { where: { startDate: { lte: now } }, orderBy: { renewalDate: "desc" }, take: 1 },
        fuelEntries: { where: { date: { lte: now } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 101 },
        expenses: { where: { date: { lte: now } }, orderBy: [{ date: "desc" }, { id: "desc" }], take: 5, select: { id: true, category: true, subcategory: true, amount: true, date: true } },
      },
    });
    if (!vehicle) return hubJson({ error: { code: "NOT_FOUND", message: "Véhicule introuvable." } }, 404);
    const current = vehicle.finalMileage ?? vehicle.mileageReadings[0]?.mileage ?? vehicle.purchaseMileage;
    const schedules = vehicle.schedules.slice(0, 100), warranties = vehicle.warranties.slice(0, 20);
    // Do not project an annual driving rate from one observation.
    const upcoming = schedules.map(s => ({ id: s.id, type: s.type, ...maintenanceClassification(s.type), title: s.title, dueDate: s.dueDate, dueMileage: s.dueMileage, ...calculateScheduleState(s, current, 0, now) }))
      .sort((a, b) => ({ OVERDUE: 0, SOON: 1, OK: 2 }[a.status] - { OVERDUE: 0, SOON: 1, OK: 2 }[b.status]) || (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity) || (a.kmRemaining ?? Infinity) - (b.kmRemaining ?? Infinity));
    const samples = vehicle.fuelEntries.slice(0, 100).reverse(), fuel = fuelStats(samples, now);
    const alerts = vehicleAlerts({ ...vehicle, schedules, warranties, mileageReadings: [{ mileage: current, date: vehicle.mileageReadings[0]?.date ?? vehicle.purchaseDate }] }, now);
    const totals = await db.expense.aggregate({ where: { vehicleId, vehicle: { userId: user.id }, date: { gte: monthStart, lte: now } }, _sum: { amount: true }, _count: true });
    return hubJson({ version: "1", generatedAt: now, vehicleId,
      mileage: { value: current, unit: "km", source: "recorded" },
      maintenance: { items: upcoming.slice(0, 5), totalInSample: schedules.length, truncated: vehicle.schedules.length > 100 },
      alerts: { items: alerts.slice(0, 10).map(a => ({ key: a.key, category: a.category, title: a.title, detail: a.detail, urgent: a.urgent })), truncated: alerts.length > 10 || vehicle.schedules.length > 100 || vehicle.warranties.length > 20 },
      expenses: { recent: vehicle.expenses.map(e => ({ ...e, amount: Number(e.amount) })), month: { from: monthStart, to: now, total: Number(totals._sum.amount ?? 0), count: totals._count, currency: "EUR", source: "recorded", basis: "expense-ledger" } },
      fuel: { entriesInSample: samples.length, truncated: vehicle.fuelEntries.length > 100, from: samples[0]?.date ?? null, to: samples.at(-1)?.date ?? null, consumptionPer100Km: fuel.consumption, costPer100Km: fuel.costPer100, total: fuel.total, liters: samples.reduce((sum, e) => sum + Number(e.liters), 0), currency: "EUR", source: "calculated" },
    });
  } catch { return hubFailure(); }
}
