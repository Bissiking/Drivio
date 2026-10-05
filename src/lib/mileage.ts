import type { Prisma } from "@/generated/prisma/client";
import { dayKey } from "./analytics";
import { calculateFuelMetrics } from "./calculations";

export class MileageConflict extends Error {}

// All callers lock the vehicle in their transaction before reading its history.
export async function validateMileage(tx: Prisma.TransactionClient, vehicleId: string, mileage: number, date: Date, allowCorrection = false, excludeId?: string) {
  const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (dayKey(date) < dayKey(vehicle.purchaseDate)) throw new MileageConflict("La date du relevé doit suivre l’achat du véhicule.");
  if (date > new Date()) throw new MileageConflict("Un relevé réel ne peut pas être daté dans le futur.");
  const history = await tx.mileageReading.findMany({ where: { vehicleId, ...(excludeId ? { id: { not: excludeId } } : {}) }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] });
  const previous = history.filter(r => r.date <= date).at(-1);
  const next = history.find(r => r.date > date);
  const conflict = mileage < (previous?.mileage ?? vehicle.purchaseMileage) || (next != null && mileage > next.mileage);
  if (conflict && !allowCorrection) throw new MileageConflict("Ce kilométrage contredit les relevés voisins. Corrigez la valeur ou confirmez une correction explicite.");
  return conflict;
}

export async function recalculateMileage(tx: Prisma.TransactionClient, vehicleId: string) {
  const readings = await tx.mileageReading.findMany({ where: { vehicleId }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] });
  for (let index = 0; index < readings.length; index++) {
    const previous = readings[index - 1];
    await tx.mileageReading.update({ where: { id: readings[index].id }, data: { distanceFromPrevious: previous ? readings[index].mileage - previous.mileage : null } });
  }
}

export async function recalculateFuel(tx: Prisma.TransactionClient, vehicleId: string) {
  const entries = await tx.fuelEntry.findMany({ where: { vehicleId }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] });
  let anchor: (typeof entries)[number] | undefined;
  let liters = 0, cost = 0, valid = true;
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const previous = entries[index - 1];
    const distance = previous ? entry.mileage - previous.mileage : null;
    if (distance !== null && distance <= 0) valid = false;
    liters += Number(entry.liters); cost += Number(entry.totalPrice);
    const span = anchor ? entry.mileage - anchor.mileage : null;
    const metrics = calculateFuelMetrics(liters, cost, entry.isFull && valid ? span : null);
    await tx.fuelEntry.update({ where: { id: entry.id }, data: { distanceSincePrevious: distance && distance > 0 ? distance : null, consumptionPer100Km: metrics.consumption, costPer100Km: metrics.costPer100Km } });
    if (entry.isFull) { anchor = entry; liters = 0; cost = 0; valid = true; }
  }
}
