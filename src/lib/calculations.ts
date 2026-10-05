// src/lib/calculations.ts
import { observedDistance, monthKey, previousMonthKey, yearOf } from "./analytics";
const DAY_MS = 86_400_000;

export type ReadingPoint = { mileage: number; date: Date };

function diffDays(start: Date, end: Date) {
  return Math.max(1, (end.getTime() - start.getTime()) / DAY_MS);
}

export function calculateMileageStats(readings: ReadingPoint[], now = new Date()) {
  const ordered = readings.filter(r => r.date <= now).sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = ordered[0];
  const last = ordered.at(-1);
  if (!first || !last) {
    return { current: 0, month: 0, previousMonth: 0, year: 0, averageDaily: 0, averageMonthly: 0, annualProjection: 0, total: 0 };
  }

  const total = Math.max(0, last.mileage - first.mileage);
  const averageDaily = total / diffDays(first.date, last.date);
  const elapsedMonths = Math.max(1, diffDays(first.date, last.date) / 30.4375);

  return {
    current: last.mileage,
    month: observedDistance(ordered, d => monthKey(d) === monthKey(now), now),
    previousMonth: observedDistance(ordered, d => monthKey(d) === previousMonthKey(now), now),
    year: observedDistance(ordered, d => yearOf(d) === yearOf(now), now),
    averageDaily,
    averageMonthly: total / elapsedMonths,
    annualProjection: averageDaily * 365,
    total,
  };
}

export type ScheduleInput = {
  dueDate: Date | null;
  dueMileage: number | null;
  warningDays: number;
  warningKm: number;
};

export function calculateScheduleState(
  schedule: ScheduleInput,
  currentMileage: number,
  averageDaily: number,
  now = new Date(),
) {
  const daysRemaining = schedule.dueDate
    ? Math.ceil((schedule.dueDate.getTime() - now.getTime()) / DAY_MS)
    : null;
  const kmRemaining = schedule.dueMileage === null ? null : schedule.dueMileage - currentMileage;
  const estimatedDate =
    kmRemaining !== null && averageDaily > 0
      ? new Date(now.getTime() + Math.max(0, kmRemaining / averageDaily) * DAY_MS)
      : null;
  const overdue = (daysRemaining !== null && daysRemaining <= 0) || (kmRemaining !== null && kmRemaining <= 0);
  const soon =
    (daysRemaining !== null && daysRemaining <= schedule.warningDays) ||
    (kmRemaining !== null && kmRemaining <= schedule.warningKm);

  return { daysRemaining, kmRemaining, estimatedDate, status: overdue ? "OVERDUE" : soon ? "SOON" : "OK" } as const;
}

export function calculateFuelMetrics(liters: number, totalPrice: number, distance: number | null) {
  const unitPrice = liters > 0 ? totalPrice / liters : 0;
  if (!distance || distance <= 0) return { unitPrice, consumption: null, costPer100Km: null };
  return {
    unitPrice,
    consumption: (liters / distance) * 100,
    costPer100Km: (totalPrice / distance) * 100,
  };
}

export function calculateCostStats(totalExpenses: number, drivenKm: number, activeMonths: number) {
  return {
    total: totalExpenses,
    averageMonthly: activeMonths > 0 ? totalExpenses / activeMonths : totalExpenses,
    costPerKm: drivenKm > 0 ? totalExpenses / drivenKm : 0,
  };
}
