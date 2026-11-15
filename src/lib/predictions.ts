// src/lib/predictions.ts
import { calculateScheduleState, type ReadingPoint } from "./calculations";
import { fuelStats, monthKey, operatingCosts, type Money, type CostPoint, type FuelPoint, type PolicyPoint } from "./analytics";

const DAY = 86_400_000;
export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export const confidenceLabels = { LOW: "faible", MEDIUM: "moyenne", HIGH: "élevée" };
const median = (values: number[]) => { const ordered = values.toSorted((a, b) => a - b); const n = ordered.length; return n ? (ordered[Math.floor((n - 1) / 2)] + ordered[Math.floor(n / 2)]) / 2 : null; };

export function drivingRate(readings: ReadingPoint[], now = new Date()) {
  const distinct = new Map(readings.filter(r => r.date <= now && Number.isFinite(r.mileage)).map(r => [r.date.getTime(), r]));
  const ordered = [...distinct.values()].toSorted((a, b) => a.date.getTime() - b.date.getTime());
  // A corrected/reset counter starts a new usable segment.
  let start = 0;
  for (let i = 1; i < ordered.length; i++) if (ordered[i].mileage < ordered[i - 1].mileage) start = i;
  const segment = ordered.slice(start);
  const recent = segment.filter(r => now.getTime() - r.date.getTime() <= 180 * DAY);
  const points = recent.length >= 2 ? recent : segment.slice(-2);
  const first = points[0], last = points.at(-1) ?? ordered.at(-1);
  const days = first && last ? (last.date.getTime() - first.date.getTime()) / DAY : 0;
  const stale = !last || now.getTime() - last.date.getTime() > 60 * DAY;
  const daily = first && last && days >= 7 ? Math.max(0, last.mileage - first.mileage) / days : null;
  const confidence: Confidence = stale || days < 30 || points.length < 3 ? "LOW" : points.length >= 6 && days >= 90 ? "HIGH" : "MEDIUM";
  return { daily, current: last?.mileage ?? null, lastDate: last?.date ?? null, confidence, samples: points.length, days, stale };
}

export type Prediction = {
  id: string; title: string; type: string; origin: "USER" | "MANUFACTURER" | "OBSERVED" | "ESTIMATED";
  reference?: string | null; dueDate: Date | null; dueMileage: number | null; confidence: Confidence;
  status: "OK" | "SOON" | "OVERDUE"; amount: number | null; measuredDepth?: number | null;
  measuredAt?: Date | null; explanation: string;
};
type Maintenance = { id: string; vehicleId: string; type: string; title: string; date: Date; mileage: number | null; cost: Money | null };
type Schedule = { id: string; type: string; title: string; dueDate: Date | null; dueMileage: number | null; warningDays: number; warningKm: number; completedAt: Date | null; provenance?: string; reference?: string | null; estimatedCost?: Money | null };
type Tire = { id: string; brand: string; position: string; mountedMileage: number; removedAt: Date | null; targetDepthMm?: Money | null; replacementCost?: Money | null; measurements: { date: Date; mileage: number; treadDepthMm: Money }[] };
export type PredictionVehicle = { id: string; status: string; purchaseDate: Date; mileageReadings: ReadingPoint[]; maintenance: Maintenance[]; schedules: Schedule[]; tireSets: Tire[]; fuelEntries: FuelPoint[]; expenses: CostPoint[]; insurancePolicies: PolicyPoint[]; inspections?: { id: string; date: Date; nextDate: Date; requiresFollowUp: boolean; followUpDeadline: Date | null }[] };
export function vehicleDrivingRate(vehicle: PredictionVehicle, now = new Date()) {
  return drivingRate([...vehicle.mileageReadings, ...vehicle.tireSets.flatMap(t => t.measurements.map(m => ({ date: m.date, mileage: m.mileage })))], now);
}

export function wearPredictions(vehicle: PredictionVehicle, now = new Date()): Prediction[] {
  const rate = vehicleDrivingRate(vehicle, now);
  const fromMileage = (km: number | null) => km !== null && rate.current !== null && rate.daily && rate.lastDate ? new Date(rate.lastDate.getTime() + (km - rate.current) / rate.daily * DAY) : null;
  const records = vehicle.maintenance.filter(r => r.date <= now);
  const costFor = (type: string) => median(records.filter(r => r.type === type && r.cost !== null).map(r => Number(r.cost)));
  const result: Prediction[] = vehicle.schedules.filter(s => !s.completedAt).map(s => {
    const projected = fromMileage(s.dueMileage);
    const dueDate = s.dueDate && projected ? new Date(Math.min(s.dueDate.getTime(), projected.getTime())) : s.dueDate ?? projected;
    const state = calculateScheduleState(s, rate.current ?? 0, rate.daily ?? 0, now);
    return { id: `schedule-${s.id}`, title: s.title, type: s.type, origin: s.provenance === "MANUFACTURER" && s.reference ? "MANUFACTURER" : "USER", reference: s.reference, dueDate, dueMileage: s.dueMileage, confidence: s.dueDate && !projected ? "HIGH" : rate.confidence, status: state.status, amount: s.estimatedCost != null ? Number(s.estimatedCost) : costFor(s.type), explanation: projected ? "Date estimée au rythme observé, à partir du dernier compteur réel. L'échéance la plus proche prévaut." : "Échéance renseignée ; aucune préconisation ajoutée par Drivio." };
  });
  // Repeat intervals only when no explicit schedule exists for the same intervention.
  for (const type of new Set(records.map(r => r.type))) {
    if (result.some(r => r.type === type)) continue;
    const group = records.filter(r => r.type === type).toSorted((a, b) => a.date.getTime() - b.date.getTime());
    if (group.length < 2 || type === "PNEUS") continue;
    const last = group.at(-1)!;
    const intervals = group.slice(1).map((r, i) => (r.date.getTime() - group[i].date.getTime()) / DAY).filter(d => d >= 30);
    const interval = median(intervals);
    if (!interval) continue;
    const kms = group.slice(1).flatMap((r, i) => r.mileage != null && group[i].mileage != null && r.mileage > group[i].mileage! ? [r.mileage - group[i].mileage!] : []);
    const kmInterval = median(kms), dueMileage = kmInterval && last.mileage != null ? Math.round(last.mileage + kmInterval) : null;
    const calendar = new Date(last.date.getTime() + interval * DAY), projected = fromMileage(dueMileage);
    const dueDate = projected && projected < calendar ? projected : calendar;
    result.push({ id: `repeat-${type}`, title: last.title, type, origin: "ESTIMATED", dueDate, dueMileage, confidence: group.length >= 4 && !rate.stale ? "MEDIUM" : "LOW", status: dueDate <= now ? "OVERDUE" : dueDate.getTime() - now.getTime() < 30 * DAY ? "SOON" : "OK", amount: costFor(type), explanation: "Répétition estimée des interventions passées ; à confirmer avec le carnet d'entretien." });
  }
  const inspection = vehicle.inspections?.filter(i => i.date <= now).toSorted((a, b) => b.date.getTime() - a.date.getTime())[0];
  if (inspection && !result.some(p => p.type === "CONTROLE_TECHNIQUE")) {
    const dueDate = inspection.requiresFollowUp && inspection.followUpDeadline ? inspection.followUpDeadline : inspection.nextDate;
    result.push({ id: `inspection-${inspection.id}`, title: inspection.requiresFollowUp ? "Contre-visite technique" : "Contrôle technique", type: "CONTROLE_TECHNIQUE", origin: "USER", dueDate, dueMileage: null, confidence: "HIGH", status: dueDate <= now ? "OVERDUE" : dueDate.getTime() - now.getTime() <= 30 * DAY ? "SOON" : "OK", amount: costFor("CONTROLE_TECHNIQUE"), explanation: "Échéance issue du dernier contrôle enregistré. Le coût est estimé d'après l'historique disponible." });
  }
  for (const tire of vehicle.tireSets.filter(t => !t.removedAt)) {
    const measures = tire.measurements.filter(m => m.date <= now).toSorted((a, b) => a.date.getTime() - b.date.getTime());
    const first = measures[0], last = measures.at(-1);
    const target = tire.targetDepthMm == null ? null : Number(tire.targetDepthMm);
    const valid = first && last && last.mileage - first.mileage >= 1000 && last.date.getTime() - first.date.getTime() >= 14 * DAY && measures.every((m, i) => i === 0 || (m.mileage > measures[i - 1].mileage && Number(m.treadDepthMm) <= Number(measures[i - 1].treadDepthMm)));
    const slope = valid ? (Number(first.treadDepthMm) - Number(last.treadDepthMm)) / (last.mileage - first.mileage) : 0;
    const remaining = last && target !== null ? Number(last.treadDepthMm) - target : null;
    const dueMileage = remaining !== null && last && remaining <= 0 ? last.mileage : remaining !== null && last && slope > 0 ? Math.round(last.mileage + remaining / slope) : null;
    const dueDate = fromMileage(dueMileage);
    result.push({ id: `tire-${tire.id}`, title: `Pneus ${tire.brand} · ${tire.position}`, type: "PNEUS", origin: "OBSERVED", dueDate, dueMileage, confidence: valid && measures.length >= 3 && rate.confidence !== "LOW" ? "MEDIUM" : "LOW", status: remaining !== null && remaining <= 0 ? "OVERDUE" : dueDate && dueDate.getTime() - now.getTime() <= 30 * DAY ? "SOON" : "OK", amount: tire.replacementCost == null ? costFor("PNEUS") : Number(tire.replacementCost), measuredDepth: last ? Number(last.treadDepthMm) : null, measuredAt: last?.date ?? null, explanation: target === null ? "Renseignez un seuil de remplacement choisi pour établir une projection." : !valid || slope <= 0 ? "Deux mesures cohérentes espacées d'au moins 1 000 km et 14 jours sont nécessaires pour estimer l'usure." : `Projection linéaire vers le seuil choisi de ${target} mm. Contrôle physique nécessaire ; le kilométrage ne mesure pas la gomme.` });
  }
  return result.sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity));
}

export function addMonths(date: Date, count: number) {
  const day = date.getUTCDate(), result = new Date(date);
  result.setUTCDate(1); result.setUTCMonth(result.getUTCMonth() + count);
  result.setUTCDate(Math.min(day, new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()));
  return result;
}
export type BudgetItem = { key: string; label: string; date: Date; amount: number; certainty: "CERTAIN" | "ESTIMATED" | "POTENTIAL"; category: string };
export function budgetForecast(vehicle: PredictionVehicle, months: 3 | 6 | 12, prudent = false, now = new Date()) {
  const end = addMonths(now, months), rate = vehicleDrivingRate(vehicle, now), wear = wearPredictions(vehicle, now);
  const items: BudgetItem[] = [], unknown: string[] = [];
  if (vehicle.status !== "ACTIVE") return { items, unknown: ["Véhicule archivé : aucune projection."], total: 0, monthly: [], confidence: "LOW" as Confidence };
  const all = operatingCosts(vehicle.expenses, vehicle.fuelEntries, vehicle.maintenance, vehicle.insurancePolicies, end);
  for (const cost of all.filter(c => c.date > now && c.date <= end)) items.push({ key: cost.id ?? `${cost.category}-${cost.date.toISOString()}`, label: cost.origin === "calculated" ? "Échéance d'assurance contractuelle" : "Dépense future enregistrée", date: cost.date, amount: Number(cost.amount), certainty: "CERTAIN", category: cost.category });
  const historyStart = new Date(Math.max(now.getTime() - 180 * DAY, vehicle.purchaseDate.getTime()));
  const exposure = Math.max(30, (now.getTime() - historyStart.getTime()) / DAY);
  const historical = operatingCosts(vehicle.expenses, vehicle.fuelEntries, vehicle.maintenance, vehicle.insurancePolicies, now).filter(c => c.date >= historyStart);
  const fuel = fuelStats(vehicle.fuelEntries.filter(f => f.date >= historyStart), now);
  const dailyFuel = fuel.costPer100 !== null && rate.daily !== null ? fuel.costPer100 / 100 * rate.daily : historical.filter(c => c.category === "CARBURANT").reduce((n, c) => n + Number(c.amount), 0) / exposure;
  if (!vehicle.fuelEntries.some(f => f.date <= now)) unknown.push("Carburant : aucun plein historique disponible.");
  const multiplier = prudent ? 1.15 : 1;
  const routineCategories = new Set(historical.filter(c => !["CARBURANT", "ENTRETIEN", "REPARATION", "PNEUS", "ASSURANCE", "ACHAT"].includes(c.category)).map(c => c.category));
  for (let i = 0; i < months; i++) {
    const start = addMonths(now, i), date = addMonths(now, i + 1), days = (date.getTime() - start.getTime()) / DAY;
    for (const [category, daily] of [["CARBURANT", dailyFuel] as const, ...[...routineCategories].map(category => [category, historical.filter(c => c.category === category).reduce((n, c) => n + Number(c.amount), 0) / exposure] as const)]) {
      const booked = items.filter(it => it.certainty === "CERTAIN" && it.category === category && it.date > start && it.date <= date).reduce((sum, it) => sum + it.amount, 0);
      const amount = Math.max(0, daily * days * multiplier - booked);
      if (amount > 0) items.push({ key: `${category}-${i}`, label: category === "CARBURANT" ? "Usage carburant estimé" : `${category} · moyenne historique`, date, amount, certainty: "ESTIMATED", category });
    }
  }
  const matchedFutureCosts = new Set<string>();
  for (const prediction of wear) {
    if (!prediction.dueDate || prediction.dueDate > end) { if (!prediction.dueDate) unknown.push(`${prediction.title} : date de remplacement indisponible.`); continue; }
    // Tire observations and a tyre schedule describe the same planned replacement.
    if (prediction.id.startsWith("tire-") && wear.some(p => p.id.startsWith("schedule-") && p.type === "PNEUS" && p.dueDate && p.dueDate <= end)) continue;
    if (prediction.id.startsWith("schedule-") && prediction.dueDate <= now && vehicle.maintenance.some(record => record.type === prediction.type && record.date >= prediction.dueDate! && record.date <= now && (prediction.dueMileage === null || (record.mileage !== null && record.mileage >= prediction.dueMileage)))) {
      unknown.push(`${prediction.title} : intervention déjà enregistrée après l'échéance ; vérifiez sa clôture.`); continue;
    }
    const date = prediction.dueDate < now ? new Date(now.getTime() + 1) : prediction.dueDate;
    if (prediction.amount === null) { unknown.push(`${prediction.title} : coût à renseigner.`); continue; }
    const booked = items.find(it => !matchedFutureCosts.has(it.key) && it.certainty === "CERTAIN" && ["ENTRETIEN", "REPARATION", "PNEUS"].includes(it.category) && Math.abs(it.date.getTime() - date.getTime()) <= 30 * DAY && Math.abs(it.amount - prediction.amount!) < 0.01);
    if (booked) { matchedFutureCosts.add(booked.key); continue; }
    items.push({ key: prediction.id, label: prediction.title, date, amount: prediction.amount * multiplier, certainty: prediction.origin === "ESTIMATED" || prediction.confidence === "LOW" ? "POTENTIAL" : "ESTIMATED", category: prediction.type === "PNEUS" ? "PNEUS" : "ENTRETIEN" });
  }
  if (!vehicle.insurancePolicies.length) unknown.push("Assurance : aucun contrat disponible.");
  if (vehicle.insurancePolicies.some(p => p.cost === null || !p.includeInCosts)) unknown.push("Assurance : un contrat sans coût ou exclu des calculs n'est pas intégré au total.");
  if (vehicle.insurancePolicies.some(p => p.renewalDate <= end)) unknown.push("Assurance : aucun renouvellement au-delà des dates contractuelles n'est supposé.");
  const included = items.filter(i => prudent || i.certainty !== "POTENTIAL");
  return { items, unknown, total: included.reduce((n, i) => n + i.amount, 0), confidence: rate.confidence,
    monthly: Array.from({ length: months }, (_, index) => { const start = addMonths(now, index), stop = addMonths(now, index + 1); return { label: `${monthKey(start)} → ${monthKey(stop)}`, value: included.filter(i => i.date > start && i.date <= stop).reduce((n, i) => n + i.amount, 0) }; }) };
}
