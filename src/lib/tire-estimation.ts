// Planning assumptions only: these coefficients are not measured tyre performance.
import { drivetrainLabels } from "./drivetrain";

export const DEFAULT_TIRE_LIFE_KM = 40_000;
export const tireQualityLabels: Record<string, string> = { UNKNOWN: "Gamme non renseignée", PREMIUM: "Premium", STANDARD: "Intermédiaire", BUDGET: "Budget" };
export const tireSeasonLabels: Record<string, string> = { ETE: "Été", HIVER: "Hiver", QUATRE_SAISONS: "4 saisons" };
export const tirePositionLabels: Record<string, string> = { AVANT: "Avant · 2 pneus", ARRIERE: "Arrière · 2 pneus", COMPLET: "Les 4 pneus" };
export type TireAxle = "AVANT" | "ARRIERE";
export type TireLifeInput = { mountedAt: Date; mountedMileage: number; estimatedLifeKm?: number | null; type?: string; quality?: string; position?: string };

export function tireLifeAssumption(tire: Pick<TireLifeInput, "estimatedLifeKm" | "type" | "quality" | "position">, drivetrain = "UNKNOWN") {
  const configured = tire.estimatedLifeKm;
  if (configured && Number.isFinite(configured) && configured > 0) return { lifeKm: configured, manual: true, formula: `${configured.toLocaleString("fr-FR")} km saisis manuellement`, explanation: "Longévité manuelle : les corrections automatiques ne sont pas appliquées." };
  const base = tire.quality === "PREMIUM" ? 45_000 : tire.quality === "BUDGET" ? 30_000 : DEFAULT_TIRE_LIFE_KM;
  const season = tire.type === "HIVER" ? 0.9 : tire.type === "QUATRE_SAISONS" ? 0.95 : 1;
  const driven = drivetrain === "FRONT" && tire.position === "AVANT" || drivetrain === "REAR" && tire.position === "ARRIERE";
  const axle = drivetrain === "AWD" ? 0.9 : driven ? 0.8 : 1;
  const lifeKm = Math.round(base * season * axle / 500) * 500;
  return { lifeKm, manual: false, formula: `${base.toLocaleString("fr-FR")} km × ${season.toLocaleString("fr-FR")} (saison) × ${axle.toLocaleString("fr-FR")} (motricité), arrondis à 500 km`, explanation: `Hypothèse automatique : ${tireQualityLabels[tire.quality ?? "UNKNOWN"] ?? tireQualityLabels.UNKNOWN}, ${tireSeasonLabels[tire.type ?? ""] ?? "saison non renseignée"}, ${drivetrainLabels[drivetrain] ?? drivetrainLabels.UNKNOWN}${driven ? ", essieu moteur" : ""}. Coefficients indicatifs de planification, sans garantie de longévité.` };
}

export function estimateTireLife(tire: TireLifeInput, currentMileage: number, now = new Date(), drivetrain = "UNKNOWN") {
  const assumption = tireLifeAssumption(tire, drivetrain), { lifeKm } = assumption;
  if (!Number.isFinite(currentMileage) || !Number.isFinite(tire.mountedMileage) || tire.mountedAt > now || currentMileage < tire.mountedMileage) return { ...assumption, distance: null, remainingKm: null, percent: null, dueMileage: null };
  const distance = currentMileage - tire.mountedMileage, remainingKm = lifeKm - distance;
  return { ...assumption, distance, remainingKm, percent: Math.min(100, Math.max(0, remainingKm / lifeKm * 100)), dueMileage: tire.mountedMileage + lifeKm };
}

// Expand four-tyre records and resolve legacy overlapping entries independently per axle.
export function activeTireAxles<T extends { id: string; position: string; mountedAt: Date; removedAt: Date | null }>(tires: T[]) {
  const seen = new Set<TireAxle>();
  return tires.filter(t => !t.removedAt).toSorted((a, b) => b.mountedAt.getTime() - a.mountedAt.getTime() || b.id.localeCompare(a.id)).flatMap(tire => {
    const position = tire.position.toUpperCase();
    const axles: TireAxle[] = position === "COMPLET" ? ["AVANT", "ARRIERE"] : position === "AVANT" || position === "ARRIERE" ? [position] : [];
    return axles.filter(axle => { if (seen.has(axle)) return false; seen.add(axle); return true; }).map(axle => ({ ...tire, id: position === "COMPLET" ? `${tire.id}-${axle.toLowerCase()}` : tire.id, sourceId: tire.id, sourcePosition: position, position: axle }));
  });
}
