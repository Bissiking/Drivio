import { requireVehicleAccess, vehicleWhere } from "@/lib/vehicle-access";
// src/app/api/tire-measurements/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { MileageConflict, validateMileage } from "@/lib/mileage";
const optional = z.preprocess(v => v === "" || v == null ? undefined : v, z.coerce.number().finite().nonnegative().optional());
export async function POST(request: Request) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = z.object({ tireSetId: z.string().min(1), date: z.coerce.date().max(new Date()), mileage: z.coerce.number().int().nonnegative(), treadDepthMm: z.preprocess(v => v === "" || v == null ? undefined : v, z.coerce.number().nonnegative().max(30)), targetDepthMm: optional, replacementCost: optional }).parse(await request.json());
    const tire = await db.tireSet.findFirst({ where: { id: data.tireSetId, vehicle: vehicleWhere(user.id) } });
    if (!tire) return NextResponse.json({ error: "Pneumatiques introuvables." }, { status: 404 });
    await requireVehicleAccess(user.id, tire.vehicleId, "COMPLETE", true);
    if (data.mileage < tire.mountedMileage || data.date < tire.mountedAt || (tire.removedAt && data.date > tire.removedAt) || (tire.removedMileage != null && data.mileage > tire.removedMileage) || (data.targetDepthMm !== undefined && (data.targetDepthMm <= 0 || data.targetDepthMm > 30))) return NextResponse.json({ error: "Mesure incompatible avec le montage ou le démontage." }, { status: 400 });
    await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: tire.vehicleId }, data: { updatedAt: new Date() } });
      await requireVehicleAccess(user.id, tire.vehicleId, "COMPLETE", true, tx);
      await tx.tireSet.update({ where: { id: tire.id }, data: { updatedAt: new Date() } });
      await validateMileage(tx, tire.vehicleId, data.mileage, data.date);
      const neighbors = await tx.tireMeasurement.findMany({ where: { tireSetId: tire.id }, orderBy: { date: "asc" } });
      if (neighbors.some(m => (m.date < data.date && m.mileage > data.mileage) || (m.date > data.date && m.mileage < data.mileage))) throw new MileageConflict("Kilométrage incompatible avec les mesures voisines.");
      await tx.tireMeasurement.create({ data: { tireSetId: tire.id, date: data.date, mileage: data.mileage, treadDepthMm: data.treadDepthMm } });
      await tx.tireSet.update({ where: { id: tire.id }, data: { targetDepthMm: data.targetDepthMm, replacementCost: data.replacementCost } });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { if (error instanceof MileageConflict) return NextResponse.json({ error: error.message }, { status: 409 }); if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Une mesure existe déjà à cette date." }, { status: 409 }); return apiError(error); }
}
