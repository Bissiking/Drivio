// src/lib/tire-estimation.ts
// Product assumption, configurable by the owner. Never a manufacturer recommendation.
export const DEFAULT_TIRE_LIFE_KM = 40_000;
export function estimateTireLife(tire: { mountedAt: Date; mountedMileage: number; estimatedLifeKm?: number | null }, currentMileage: number, now = new Date()) {
  const lifeKm = tire.estimatedLifeKm && tire.estimatedLifeKm > 0 ? tire.estimatedLifeKm : DEFAULT_TIRE_LIFE_KM;
  if (tire.mountedAt > now || currentMileage < tire.mountedMileage) return { lifeKm, distance: null, remainingKm: null, percent: null, dueMileage: null };
  const distance = currentMileage - tire.mountedMileage, remainingKm = lifeKm - distance;
  return { lifeKm, distance, remainingKm, percent: Math.min(100, Math.max(0, remainingKm / lifeKm * 100)), dueMileage: tire.mountedMileage + lifeKm };
}
