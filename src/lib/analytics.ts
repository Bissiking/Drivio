import type { ReadingPoint } from "./calculations";
const DAY = 86_400_000;
export type Money = number | string | { toString(): string };
export type FuelPoint = { id?: string; vehicleId: string; date: Date; mileage: number; liters: Money; totalPrice: Money; isFull: boolean };
export type CostPoint = { id?: string; vehicleId: string; date: Date; category: string; amount: Money; mileage?: number | null; fuelEntryId?: string | null; maintenanceRecordId?: string | null; origin?: "recorded" | "calculated" };
export function monthKey(date: Date) { return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(date).replace("/", "-"); }
export function dayKey(date: Date) { return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
export function yearOf(date: Date) { return Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", year: "numeric" }).format(date)); }
export function percentChange(current: number, previous: number) { return previous > 0 ? (current - previous) / previous * 100 : null; }
export function previousMonthKey(now: Date) { const [year, month] = monthKey(now).split("-").map(Number); return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`; }
export function monthKeys(now: Date, count = 12) { const [year, month] = monthKey(now).split("-").map(Number); return Array.from({ length: count }, (_, i) => monthKey(new Date(Date.UTC(year, month - count + i, 15)))); }
export function observedDistance(readings: ReadingPoint[], accepts: (date: Date) => boolean, now = new Date()) {
  const ordered = readings.filter(r => r.date <= now).toSorted((a, b) => a.date.getTime() - b.date.getTime());
  return ordered.reduce((sum, r, i) => sum + (i > 0 && accepts(r.date) ? Math.max(0, r.mileage - ordered[i - 1].mileage) : 0), 0);
}
export function fuelIntervals(input: FuelPoint[]) {
  const vehicles = new Map<string, FuelPoint[]>();
  for (const entry of input) { const group = vehicles.get(entry.vehicleId) ?? []; group.push(entry); vehicles.set(entry.vehicleId, group); }
  const result: { vehicleId: string; date: Date; distance: number | null; reliableDistance: number | null; liters: number; cost: number; consumption: number | null; costPer100: number | null }[] = [];
  for (const entries of vehicles.values()) {
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    let anchor: FuelPoint | undefined, liters = 0, cost = 0, valid = true;
    entries.forEach((entry, i) => {
      const previous = entries[i - 1];
      const delta = previous ? entry.mileage - previous.mileage : null;
      if (delta !== null && delta <= 0) valid = false;
      liters += Number(entry.liters); cost += Number(entry.totalPrice);
      const span = anchor ? entry.mileage - anchor.mileage : 0;
      const reliable = entry.isFull && valid && anchor != null && span > 0;
      result.push({ vehicleId: entry.vehicleId, date: entry.date, distance: delta !== null && delta > 0 ? delta : null, reliableDistance: reliable ? span : null, liters: reliable ? liters : 0, cost: reliable ? cost : 0, consumption: reliable ? liters / span * 100 : null, costPer100: reliable ? cost / span * 100 : null });
      if (entry.isFull) { anchor = entry; liters = 0; cost = 0; valid = true; }
    });
  }
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}
export function fuelStats(entries: FuelPoint[], now = new Date()) {
  const actual = entries.filter(e => e.date <= now);
  const intervals = fuelIntervals(actual), distances = intervals.filter(e => e.distance !== null).map(e => e.distance!);
  const reliable = intervals.filter(e => e.reliableDistance !== null);
  const span = reliable.reduce((sum, e) => sum + e.reliableDistance!, 0);
  const liters = actual.reduce((sum, e) => sum + Number(e.liters), 0);
  const total = actual.reduce((sum, e) => sum + Number(e.totalPrice), 0);
  const month = actual.filter(e => monthKey(e.date) === monthKey(now)).reduce((sum, e) => sum + Number(e.totalPrice), 0);
  const previous = actual.filter(e => monthKey(e.date) === previousMonthKey(now)).reduce((sum, e) => sum + Number(e.totalPrice), 0);
  return { total, month, previous, change: percentChange(month, previous), consumption: span ? reliable.reduce((sum, e) => sum + e.liters, 0) / span * 100 : null, costPer100: span ? reliable.reduce((sum, e) => sum + e.cost, 0) / span * 100 : null, unitPrice: liters ? total / liters : null, averageDistance: distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : null, minimumDistance: distances.length ? Math.min(...distances) : null, maximumDistance: distances.length ? Math.max(...distances) : null, rollingDistance: distances.length ? distances.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, distances.length) : null, intervals };
}
export type PolicyPoint = { id: string; vehicleId: string; startDate: Date; renewalDate: Date; cost: Money | null; frequency: string; includeInCosts: boolean };
function monthlyAnniversary(start: Date, offset: number) {
  const y = start.getUTCFullYear(), m = start.getUTCMonth() + offset;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(start.getUTCDate(), lastDay)));
}
// Charges due on the contract's anniversary; renewal is exclusive until explicitly renewed.
export function insuranceCharges(policies: PolicyPoint[], expenses: CostPoint[], now = new Date(), endDate?: Date | null) {
  const charges: CostPoint[] = [];
  for (const policy of policies) {
    if (!policy.includeInCosts || policy.cost == null) continue;
    const end = new Date(Math.min(now.getTime(), endDate?.getTime() ?? Infinity));
    const step = policy.frequency === "ANNUAL" ? 12 : 1;
    for (let offset = 0; ; offset += step) {
      const date = monthlyAnniversary(policy.startDate, offset);
      if (date > end || date >= policy.renewalDate) break;
      if (expenses.some(e => e.category === "ASSURANCE" && e.vehicleId === policy.vehicleId && monthKey(e.date) === monthKey(date))) continue;
      charges.push({ id: `insurance-${policy.id}-${offset}`, vehicleId: policy.vehicleId, date, category: "ASSURANCE", amount: Number(policy.cost), origin: "calculated" });
    }
  }
  return charges;
}
// Explicit foreign keys cover new data; date/mileage/amount matching covers legacy mirrored expenses.
export function operatingCosts(expenses: CostPoint[], fuel: FuelPoint[], maintenance: { id: string; vehicleId: string; date: Date; mileage: number | null; cost: Money | null }[], policies: PolicyPoint[], now = new Date(), endDate?: Date | null) {
  const limit = new Date(Math.min(now.getTime(), endDate?.getTime() ?? Infinity));
  const recorded = expenses.filter(e => e.date <= limit);
  const costs: CostPoint[] = [...recorded.map(e => ({ ...e, origin: "recorded" as const }))];
  const matches = (e: CostPoint, date: Date, mileage: number | null, amount: number) => e.date.getTime() === date.getTime() && (e.mileage ?? null) === mileage && Math.abs(Number(e.amount) - amount) < 0.005;
  for (const e of fuel.filter(e => e.date <= limit)) if (!recorded.some(c => c.fuelEntryId === e.id || (c.vehicleId === e.vehicleId && c.category === "CARBURANT" && matches(c, e.date, e.mileage, Number(e.totalPrice))))) costs.push({ id: `fuel-${e.id}`, vehicleId: e.vehicleId, date: e.date, category: "CARBURANT", amount: e.totalPrice, origin: "recorded" });
  for (const e of maintenance.filter(e => e.date <= limit && e.cost != null)) if (!recorded.some(c => c.maintenanceRecordId === e.id || (c.vehicleId === e.vehicleId && c.category === "ENTRETIEN" && matches(c, e.date, e.mileage, Number(e.cost))))) costs.push({ id: `maintenance-${e.id}`, vehicleId: e.vehicleId, date: e.date, category: "ENTRETIEN", amount: Number(e.cost), origin: "recorded" });
  return [...costs, ...insuranceCharges(policies, recorded, now, endDate)];
}
export function ownershipStats(vehicle: { purchasePrice: Money | null; salePrice: Money | null; purchaseDate: Date; saleDate: Date | null; purchaseMileage: number; finalMileage: number | null }, currentMileage: number, costs: CostPoint[], now = new Date()) {
  const end = vehicle.saleDate && vehicle.saleDate < now ? vehicle.saleDate : now;
  const relevant = costs.filter(c => dayKey(c.date) >= dayKey(vehicle.purchaseDate) && dayKey(c.date) <= dayKey(end));
  const sum = (categories: string[]) => relevant.filter(c => categories.includes(c.category)).reduce((n, c) => n + Number(c.amount), 0);
  const fuel = sum(["CARBURANT"]), maintenance = sum(["ENTRETIEN", "REPARATION", "PNEUS"]), insurance = sum(["ASSURANCE"]);
  const running = relevant.reduce((n, c) => n + Number(c.amount), 0), other = running - fuel - maintenance - insurance;
  const total = Number(vehicle.purchasePrice ?? 0) + running - Number(vehicle.salePrice ?? 0);
  const distance = Math.max(0, (vehicle.finalMileage ?? currentMileage) - vehicle.purchaseMileage);
  const months = Math.max(1, (end.getTime() - vehicle.purchaseDate.getTime()) / DAY / 30.4375);
  return { total, running, fuel, maintenance, insurance, other, distance, averageMonthly: total / months, averageAnnual: total / months * 12, costPerKm: distance > 0 ? total / distance : null, incomplete: vehicle.purchasePrice == null, calculatedInsurance: relevant.some(c => c.origin === "calculated") };
}
export function annualStats(year: number, readings: ReadingPoint[], fuel: FuelPoint[], costs: CostPoint[], now = new Date()) {
  const distance = observedDistance(readings, d => yearOf(d) === year, now);
  const yearly = costs.filter(c => yearOf(c.date) === year && c.date <= now);
  const sum = (cats: string[]) => yearly.filter(c => cats.includes(c.category)).reduce((n, c) => n + Number(c.amount), 0);
  const fuelCost = sum(["CARBURANT"]), maintenance = sum(["ENTRETIEN", "REPARATION", "PNEUS"]), insurance = sum(["ASSURANCE"]);
  const total = yearly.reduce((n, c) => n + Number(c.amount), 0);
  const intervals = fuelIntervals(fuel.filter(e => e.date <= now)).filter(e => yearOf(e.date) === year && e.reliableDistance !== null);
  const span = intervals.reduce((n, e) => n + e.reliableDistance!, 0);
  return { year, distance, liters: fuel.filter(e => e.date <= now && yearOf(e.date) === year).reduce((n, e) => n + Number(e.liters), 0), fuel: fuelCost, maintenance, insurance, other: total - fuelCost - maintenance - insurance, total, costPerKm: distance > 0 ? total / distance : null, consumption: span ? intervals.reduce((n, e) => n + e.liters, 0) / span * 100 : null };
}
export function warrantyState(warranty: { startDate: Date; endDate: Date; maxMileage: number | null }, mileage: number, now = new Date(), warningDays = 30, warningKm = 1500) {
  const days = Math.ceil((warranty.endDate.getTime() - now.getTime()) / DAY);
  const km = warranty.maxMileage === null ? null : warranty.maxMileage - mileage;
  const status: "EXPIRED" | "UPCOMING" | "SOON" | "ACTIVE" = days <= 0 || (km !== null && km <= 0) ? "EXPIRED" : warranty.startDate > now ? "UPCOMING" : days <= warningDays || (km !== null && km <= warningKm) ? "SOON" : "ACTIVE";
  return { status, days, km, months: Math.max(0, Math.floor(days / 30.4375)) };
}
export function tireDistance(tire: { mountedMileage: number; removedMileage: number | null }, currentMileage: number) { return Math.max(0, (tire.removedMileage ?? currentMileage) - tire.mountedMileage); }
