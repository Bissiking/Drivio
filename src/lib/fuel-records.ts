import { requireVehicleAccess } from "./vehicle-access";
import { z } from "zod";
import { db } from "./db";
import { fuelSchema } from "./validations";
import { MileageConflict, recalculateFuel, recalculateMileage, validateMileage } from "./mileage";

export async function saveFuel(data: z.output<typeof fuelSchema>, id?: string, actorId?: string) {
  return db.$transaction(async tx => {
    await tx.vehicle.update({ where: { id: data.vehicleId }, data: { updatedAt: new Date() } });
    if (actorId) await requireVehicleAccess(actorId, data.vehicleId, "SIMPLE", true, tx);
    const previousEntry = id ? await tx.fuelEntry.findUniqueOrThrow({ where: { id }, include: { mileageReading: { include: { fuelEntries: { select: { id: true } } } } } }) : null;
    const previousReading = previousEntry?.mileageReading;
    // A manually entered or shared reading is an independent historical fact.
    const managedReading = previousReading?.source === "FUEL" && previousReading.fuelEntries.length === 1 ? previousReading : null;
    await validateMileage(tx, data.vehicleId, data.mileage, data.date, false, managedReading?.id);
    const neighbors = await tx.fuelEntry.findMany({ where: { vehicleId: data.vehicleId, ...(id ? { id: { not: id } } : {}) }, orderBy: [{ date: "asc" }, { mileage: "asc" }] });
    const before = neighbors.filter(e => e.date < data.date || (+e.date === +data.date && e.mileage < data.mileage)).at(-1);
    const after = neighbors.find(e => e.date > data.date || (+e.date === +data.date && e.mileage > data.mileage));
    if (neighbors.some(e => e.mileage === data.mileage) || (before && data.mileage <= before.mileage) || (after && data.mileage >= after.mileage)) throw new MileageConflict("Le kilométrage doit se situer entre les pleins voisins, sans doublon.");
    let reading = await tx.mileageReading.findFirst({ where: { vehicleId: data.vehicleId, date: data.date, mileage: data.mileage } });
    if (!reading && managedReading) reading = await tx.mileageReading.update({ where: { id: managedReading.id }, data: { date: data.date, mileage: data.mileage, isCorrection: true } });
    reading ??= await tx.mileageReading.create({ data: { vehicleId: data.vehicleId, date: data.date, mileage: data.mileage, source: "FUEL", comment: "Relevé issu d’un plein" } });
    const record = { ...data, unitPrice: data.unitPrice ?? data.totalPrice / data.liters, stationId: data.stationId ?? null, fuelType: data.fuelType ?? null, mileageReadingId: reading.id };
    const fuel = id ? await tx.fuelEntry.update({ where: { id }, data: record }) : await tx.fuelEntry.create({ data: record });
    const expense = { vehicleId: data.vehicleId, category: "CARBURANT", amount: data.totalPrice, date: data.date, mileage: data.mileage, comment: `Plein · ${data.liters.toFixed(2)} L` };
    await tx.expense.upsert({ where: { fuelEntryId: fuel.id }, create: { ...expense, fuelEntryId: fuel.id }, update: expense });
    if (managedReading && managedReading.id !== reading.id) await tx.mileageReading.delete({ where: { id: managedReading.id } });
    await recalculateMileage(tx, data.vehicleId);
    await recalculateFuel(tx, data.vehicleId);
    return tx.fuelEntry.findUniqueOrThrow({ where: { id: fuel.id } });
  });
}
