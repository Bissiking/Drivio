// src/lib/maintenance-gauges.ts
import { drivingRate } from "./predictions";
import { activeTireAxles, estimateTireLife } from "./tire-estimation";

const DAY = 86_400_000;
type Schedule = { id: string; type: string; title: string; dueDate: Date | null; dueMileage: number | null; warningDays: number; warningKm: number; completedAt: Date | null; cycleStartDate?: Date | null; cycleStartMileage?: number | null };
type Record = { id: string; type: string; title: string; date: Date; mileage: number | null };
type Tire = { id: string; brand: string; position: string; mountedAt: Date; mountedMileage: number; removedAt: Date | null; estimatedLifeKm?: number | null; quality?: string; type?: string };
export type GaugeVehicle = { id: string; drivetrain?: string; purchaseMileage: number; finalMileage: number | null; mileageReadings: { date: Date; mileage: number }[]; schedules: Schedule[]; maintenance: Record[]; tireSets: Tire[] };
export type MaintenanceGauge = {
  id: string; title: string; type: string; kind: "SCHEDULE" | "TIRE"; percent: number | null;
  status: "OK" | "SOON" | "OVERDUE" | "UNKNOWN"; kmRemaining: number | null; daysRemaining: number | null;
  dueDate: Date | null; dateEstimated: boolean; referenceDate: Date | null; referenceMileage: number | null;
  referenceSource: "MANUAL" | "RECORD" | "COMPLETED_SCHEDULE" | "MOUNTING" | null;
  referenceLabel: string | null; limitingFactor: "KM" | "DATE" | null;
  isEstimate: boolean; estimatedLifeKm: number | null; distanceSinceMount: number | null;
  explanation: string; href: string;
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function maintenanceGauges(vehicle: GaugeVehicle, now = new Date()): MaintenanceGauge[] {
  const readings = vehicle.mileageReadings.filter(r => r.date <= now);
  const rate = drivingRate(readings, now), current = vehicle.finalMileage ?? rate.current ?? vehicle.purchaseMileage;
  const active = vehicle.schedules.filter(s => !s.completedAt);
  const result: MaintenanceGauge[] = active.map(schedule => {
    const explicit = schedule.cycleStartDate != null || schedule.cycleStartMileage != null;
    const sameTitle = (title: string) => normalize(title) === normalize(schedule.title);
    // Generic types and multiple tasks of the same type need an exact title match.
    const canUseType = !["PERSONNALISE", "FILTRES"].includes(schedule.type) && active.filter(s => s.type === schedule.type).length === 1;
    const compatible = (type: string, title: string) => type === schedule.type && (sameTitle(title) || canUseType);
    const candidates = vehicle.maintenance.filter(r => r.date <= now && compatible(r.type, r.title) && (!schedule.dueDate || r.date < schedule.dueDate) && (schedule.dueMileage === null || r.mileage === null || r.mileage < schedule.dueMileage));
    const exact = candidates.filter(r => sameTitle(r.title));
    const record = (exact.length ? exact : candidates).toSorted((a, b) => b.date.getTime() - a.date.getTime())[0];
    const completedCandidates = vehicle.schedules.filter(s => s.id !== schedule.id && s.completedAt && s.completedAt <= now && compatible(s.type, s.title) && (!schedule.dueDate || s.completedAt < schedule.dueDate));
    const completedExact = completedCandidates.filter(s => sameTitle(s.title));
    const completed = (completedExact.length ? completedExact : completedCandidates).toSorted((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];
    const useCompleted = !explicit && completed && (!record || completed.completedAt! > record.date);
    const referenceDate = explicit ? schedule.cycleStartDate ?? null : useCompleted ? completed.completedAt : record?.date ?? null;
    const referenceMileage = explicit ? schedule.cycleStartMileage ?? null : useCompleted ? null : record?.mileage ?? null;
    const referenceSource = explicit ? "MANUAL" : useCompleted ? "COMPLETED_SCHEDULE" : record ? "RECORD" : null;
    const referenceLabel = explicit ? "Référence renseignée" : useCompleted ? completed.title : record?.title ?? null;
    const kmRemaining = schedule.dueMileage === null ? null : schedule.dueMileage - current;
    const daysRemaining = schedule.dueDate ? Math.ceil((schedule.dueDate.getTime() - now.getTime()) / DAY) : null;
    const ratios: { value: number; factor: "KM" | "DATE" }[] = [];
    if (kmRemaining !== null && referenceMileage !== null && schedule.dueMileage! > referenceMileage && current >= referenceMileage) ratios.push({ value: kmRemaining / (schedule.dueMileage! - referenceMileage) * 100, factor: "KM" });
    if (schedule.dueDate && referenceDate && referenceDate <= now && schedule.dueDate > referenceDate) ratios.push({ value: (schedule.dueDate.getTime() - now.getTime()) / (schedule.dueDate.getTime() - referenceDate.getTime()) * 100, factor: "DATE" });
    const overdue = (kmRemaining !== null && kmRemaining <= 0) || (daysRemaining !== null && daysRemaining <= 0);
    const soon = (kmRemaining !== null && kmRemaining <= schedule.warningKm) || (daysRemaining !== null && daysRemaining <= schedule.warningDays);
    const limiting = ratios.toSorted((a, b) => a.value - b.value)[0];
    // Reaching a known deadline establishes zero even without a start reference.
    const percent = overdue ? 0 : limiting ? clamp(limiting.value) : null;
    const projected = schedule.dueMileage !== null && rate.daily && rate.lastDate ? new Date(rate.lastDate.getTime() + (schedule.dueMileage - current) / rate.daily * DAY) : null;
    const dateEstimated = Boolean(projected && (!schedule.dueDate || projected < schedule.dueDate));
    const dueDate = dateEstimated ? projected : schedule.dueDate;
    const missingDimension = (schedule.dueDate !== null && !ratios.some(r => r.factor === "DATE")) || (schedule.dueMileage !== null && !ratios.some(r => r.factor === "KM"));
    const explanation = percent === null ? "Renseignez le début de l'intervalle ou un entretien réalisé compatible pour calculer la jauge." : overdue ? "Échéance atteinte : la marge avant intervention est épuisée. Cela ne mesure pas l'usure physique de la pièce." : `Part de l'intervalle restant avant l'échéance${missingDimension ? "; calculée uniquement sur la dimension disposant d'une référence" : ", en retenant le seuil date ou kilométrage le plus proche"}. Cela ne mesure pas l'usure physique de la pièce.`;
    return { id: `schedule-${schedule.id}`, title: schedule.title, type: schedule.type, kind: "SCHEDULE", percent, status: overdue ? "OVERDUE" : soon ? "SOON" : percent === null ? "UNKNOWN" : "OK", kmRemaining, daysRemaining, dueDate, dateEstimated, referenceDate, referenceMileage, referenceSource, referenceLabel, limitingFactor: overdue ? (kmRemaining !== null && kmRemaining <= 0 ? "KM" : "DATE") : limiting?.factor ?? null, isEstimate: false, estimatedLifeKm: null, distanceSinceMount: null, explanation, href: `/suivi?vehicle=${encodeURIComponent(vehicle.id)}#gauge-schedule-${schedule.id}` };
  });
  for (const tire of activeTireAxles(vehicle.tireSets)) {
    const estimate = estimateTireLife(tire, current, now, vehicle.drivetrain), { percent } = estimate;
    const dueDate = estimate.remainingKm !== null && rate.daily && rate.lastDate ? new Date(rate.lastDate.getTime() + estimate.remainingKm / rate.daily * DAY) : null;
    result.push({ id: `tire-${tire.id}`, title: `Pneus ${tire.brand} · ${tire.position === "AVANT" ? "avant" : tire.position === "ARRIERE" ? "arrière" : "train complet"}`, type: "PNEUS", kind: "TIRE", percent, status: percent === null ? "UNKNOWN" : percent <= 0 ? "OVERDUE" : percent <= 25 ? "SOON" : "OK", kmRemaining: estimate.remainingKm, daysRemaining: dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / DAY) : null, dueDate, dateEstimated: Boolean(dueDate), referenceDate: tire.mountedAt, referenceMileage: tire.mountedMileage, referenceSource: "MOUNTING", referenceLabel: "Montage des pneus", limitingFactor: percent === null ? null : "KM", isEstimate: true, estimatedLifeKm: estimate.lifeKm, distanceSinceMount: estimate.distance, explanation: `Usure estimée — contrôle manuel nécessaire. Hypothèse de ${estimate.lifeKm.toLocaleString("fr-FR")} km depuis le montage. ${estimate.explanation} Réglable dans Pneumatiques. Ce pourcentage ne mesure pas l'état réel des pneus.`, href: `/suivi?vehicle=${encodeURIComponent(vehicle.id)}#gauge-tire-${tire.id}` });
  }
  const severity = { OVERDUE: 0, SOON: 1, OK: 2, UNKNOWN: 3 };
  return result.sort((a, b) => severity[a.status] - severity[b.status] || (a.percent ?? Infinity) - (b.percent ?? Infinity) || a.title.localeCompare(b.title, "fr"));
}
