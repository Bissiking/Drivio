import { calculateMileageStats, calculateScheduleState } from "./calculations";
import type { NotificationType } from "./notification-types";
import { warrantyState } from "./analytics";
export type VehicleAlert = { types: NotificationType[]; key: string; category: "maintenance" | "warranty" | "inspection" | "insurance"; title: string; detail: string; urgent: boolean; href: string };
type Vehicle = {
  id: string; brand: string; model: string; purchaseMileage: number;
  mileageReadings: { mileage: number; date: Date }[];
  schedules: { id: string; title: string; dueDate: Date | null; dueMileage: number | null; warningDays: number; warningKm: number; completedAt: Date | null }[];
  warranties: { id: string; title: string; startDate: Date; endDate: Date; maxMileage: number | null }[];
  inspections: { id: string; date: Date; nextDate: Date; requiresFollowUp: boolean; followUpDeadline: Date | null }[];
  insurancePolicies: { id: string; company: string; startDate: Date; renewalDate: Date }[];
};
export function vehicleAlerts(vehicle: Vehicle, now = new Date(), warnings?: { warningDays: number; warningKm: number }) {
  const stats = calculateMileageStats(vehicle.mileageReadings, now), mileage = stats.current || vehicle.purchaseMileage;
  const alerts: VehicleAlert[] = [], name = `${vehicle.brand} ${vehicle.model}`;
  const days = warnings?.warningDays ?? 30;
  for (const schedule of vehicle.schedules.filter(s => s.completedAt === null)) {
    const state = calculateScheduleState({ ...schedule, ...(warnings ?? {}) }, mileage, stats.averageDaily, now);
    if (state.status === "OK") continue;
    alerts.push({ types: state.status === "OVERDUE" ? ["maintenanceOverdue"] : [...(state.daysRemaining !== null && state.daysRemaining <= (warnings?.warningDays ?? schedule.warningDays) ? ["maintenanceSoon" as const] : []), ...(state.kmRemaining !== null && state.kmRemaining <= (warnings?.warningKm ?? schedule.warningKm) ? ["maintenanceMileage" as const] : [])], key: `maintenance:${schedule.id}:${schedule.dueDate?.toISOString()}:${schedule.dueMileage}:${state.status}`, category: "maintenance", title: `${name} · ${schedule.title}`, detail: `${state.status === "OVERDUE" ? "Entretien dépassé" : "Entretien bientôt dû"}${state.daysRemaining === null ? "" : ` · ${state.daysRemaining} jours`}${state.kmRemaining === null ? "" : ` · ${state.kmRemaining} km`}`, urgent: state.status === "OVERDUE", href: "/entretiens" });
  }
  for (const warranty of vehicle.warranties) {
    const state = warrantyState(warranty, mileage, now, days, warnings?.warningKm);
    if (state.status !== "EXPIRED" && state.status !== "SOON") continue;
    alerts.push({ types: [state.status === "EXPIRED" ? "warrantyExpired" : "warrantySoon"], key: `warranty:${warranty.id}:${warranty.endDate.toISOString()}:${warranty.maxMileage}:${state.status}`, category: "warranty", title: `${name} · ${warranty.title}`, detail: state.status === "EXPIRED" ? "Garantie expirée" : `Garantie proche de l’expiration · ${state.days} jours${state.km == null ? "" : ` ou ${state.km} km`}`, urgent: state.status === "EXPIRED", href: `/suivi?vehicle=${vehicle.id}` });
  }
  const latest = vehicle.inspections.filter(i => i.date <= now).toSorted((a, b) => b.date.getTime() - a.date.getTime())[0];
  if (latest) {
    const deadline = latest.requiresFollowUp && latest.followUpDeadline ? latest.followUpDeadline : latest.nextDate;
    const remaining = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    if (remaining <= days) alerts.push({ types: [remaining <= 0 ? "inspectionOverdue" : "inspectionSoon"], key: `inspection:${latest.id}:${deadline.toISOString()}:${remaining <= 0 ? "OVERDUE" : "SOON"}`, category: "inspection", title: `${name} · ${latest.requiresFollowUp ? "Contre-visite" : "Contrôle technique"}`, detail: remaining <= 0 ? "Échéance atteinte ou dépassée" : `Échéance dans ${remaining} jours`, urgent: remaining <= 0, href: `/suivi?vehicle=${vehicle.id}` });
  }
  const insurance = vehicle.insurancePolicies.filter(p => p.startDate <= now).toSorted((a, b) => b.renewalDate.getTime() - a.renewalDate.getTime())[0];
  if (insurance) {
    const remaining = Math.ceil((insurance.renewalDate.getTime() - now.getTime()) / 86400000);
    if (remaining <= days) alerts.push({ types: ["insurance"], key: `insurance:${insurance.id}:${insurance.renewalDate.toISOString()}:${remaining <= 0 ? "OVERDUE" : "SOON"}`, category: "insurance", title: `${name} · ${insurance.company}`, detail: remaining <= 0 ? "Assurance à renouveler : échéance atteinte" : `Assurance à renouveler dans ${remaining} jours`, urgent: remaining <= 0, href: `/suivi?vehicle=${vehicle.id}` });
  }
  return alerts.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
