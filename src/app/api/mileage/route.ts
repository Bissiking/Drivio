import { requireVehicleAccess } from "@/lib/vehicle-access";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { mileageSchema } from "@/lib/validations";
import { MileageConflict, recalculateMileage, validateMileage } from "@/lib/mileage";
export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = mileageSchema.parse(await request.json());
    await requireVehicleAccess(user.id, data.vehicleId, "SIMPLE", true);
    const reading = await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { updatedAt: new Date() } });
      await requireVehicleAccess(user.id, data.vehicleId, "SIMPLE", true, tx);
      const conflict = await validateMileage(tx, data.vehicleId, data.mileage, data.date, data.allowCorrection);
      const existing = await tx.mileageReading.findFirst({ where: { vehicleId: data.vehicleId, date: data.date, mileage: data.mileage } });
      if (existing) return existing;
      const created = await tx.mileageReading.create({ data: { vehicleId: data.vehicleId, mileage: data.mileage, date: data.date, comment: data.comment, isCorrection: conflict } });
      await recalculateMileage(tx, data.vehicleId);
      return tx.mileageReading.findUniqueOrThrow({ where: { id: created.id } });
    });
    return NextResponse.json({ reading }, { status: 201 });
  } catch (error) { return error instanceof MileageConflict ? NextResponse.json({ error: error.message }, { status: 409 }) : apiError(error); }
}
