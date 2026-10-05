import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
import { fuelSchema } from "@/lib/validations";
import { MileageConflict, recalculateFuel, recalculateMileage, validateMileage } from "@/lib/mileage";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = fuelSchema.parse(await request.json());
    if (!(await ownedVehicle(user.id, data.vehicleId))) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const fuel = await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { updatedAt: new Date() } });
      await validateMileage(tx, data.vehicleId, data.mileage, data.date);
      const neighbors = await tx.fuelEntry.findMany({ where: { vehicleId: data.vehicleId }, orderBy: { date: "asc" } });
      const before = neighbors.filter(e => e.date <= data.date).at(-1), after = neighbors.find(e => e.date > data.date);
      if ((before && data.mileage <= before.mileage) || (after && data.mileage >= after.mileage)) throw new MileageConflict("Le kilométrage doit se situer entre les pleins voisins, sans doublon.");
      let reading = await tx.mileageReading.findFirst({ where: { vehicleId: data.vehicleId, date: data.date, mileage: data.mileage } });
      reading ??= await tx.mileageReading.create({ data: { vehicleId: data.vehicleId, date: data.date, mileage: data.mileage, source: "FUEL", comment: "Relevé issu d’un plein" } });
      const created = await tx.fuelEntry.create({ data: { vehicleId: data.vehicleId, date: data.date, mileage: data.mileage, liters: data.liters, totalPrice: data.totalPrice, unitPrice: data.unitPrice ?? data.totalPrice / data.liters, isFull: data.isFull, mileageReadingId: reading.id } });
      await tx.expense.create({ data: { vehicleId: data.vehicleId, fuelEntryId: created.id, category: "CARBURANT", amount: data.totalPrice, date: data.date, mileage: data.mileage, comment: `Plein · ${data.liters.toFixed(2)} L` } });
      await recalculateMileage(tx, data.vehicleId);
      await recalculateFuel(tx, data.vehicleId);
      return tx.fuelEntry.findUniqueOrThrow({ where: { id: created.id } });
    });
    return NextResponse.json({ fuel }, { status: 201 });
  } catch (error) { return error instanceof MileageConflict ? NextResponse.json({ error: error.message }, { status: 409 }) : apiError(error); }
}
