// src/app/api/fuel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { calculateFuelMetrics } from "@/lib/calculations";
import { db } from "@/lib/db";
import { fuelSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = fuelSchema.parse(await request.json());
    if (!(await ownedVehicle(user.id, data.vehicleId))) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const previousEntry = await db.fuelEntry.findFirst({ where: { vehicleId: data.vehicleId, date: { lt: data.date } }, orderBy: { date: "desc" } });
    if (previousEntry && data.mileage < previousEntry.mileage) return NextResponse.json({ error: "Le kilométrage est inférieur au plein précédent." }, { status: 409 });
    const previousFull = data.isFull ? await db.fuelEntry.findFirst({ where: { vehicleId: data.vehicleId, isFull: true, date: { lt: data.date } }, orderBy: { date: "desc" } }) : null;
    const intermediate = previousFull
      ? await db.fuelEntry.aggregate({ where: { vehicleId: data.vehicleId, date: { gt: previousFull.date, lt: data.date } }, _sum: { liters: true, totalPrice: true } })
      : null;
    const distance = previousFull ? data.mileage - previousFull.mileage : null;
    const reliableLiters = Number(intermediate?._sum.liters ?? 0) + data.liters;
    const reliableCost = Number(intermediate?._sum.totalPrice ?? 0) + data.totalPrice;
    const metrics = calculateFuelMetrics(reliableLiters, reliableCost, data.isFull ? distance : null);
    const result = await db.$transaction(async (tx) => {
      const fuel = await tx.fuelEntry.create({ data: {
        vehicleId: data.vehicleId,
        date: data.date,
        mileage: data.mileage,
        liters: data.liters,
        totalPrice: data.totalPrice,
        unitPrice: data.unitPrice ?? data.totalPrice / data.liters,
        isFull: data.isFull,
        distanceSincePrevious: previousEntry ? data.mileage - previousEntry.mileage : null,
        consumptionPer100Km: metrics.consumption,
        costPer100Km: metrics.costPer100Km,
      } });
      await tx.expense.create({ data: { vehicleId: data.vehicleId, category: "CARBURANT", amount: data.totalPrice, date: data.date, mileage: data.mileage, comment: `Plein · ${data.liters.toFixed(2)} L` } });
      return fuel;
    });
    return NextResponse.json({ fuel: result }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
