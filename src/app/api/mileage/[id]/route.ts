import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { mileageSchema } from "@/lib/validations";
import { MileageConflict, recalculateFuel, recalculateMileage, validateMileage } from "@/lib/mileage";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) { return mutate(request, context, false); }
export async function DELETE(request: NextRequest, context: Context) { return mutate(request, context, true); }
async function mutate(request: NextRequest, context: Context, remove: boolean) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  const { id } = await context.params;
  const reading = await db.mileageReading.findFirst({ where: { id, vehicle: { userId: user.id } } });
  if (!reading) return NextResponse.json({ error: "Relevé introuvable." }, { status: 404 });
  try {
    await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: reading.vehicleId }, data: { updatedAt: new Date() } });
      if (remove) await tx.mileageReading.delete({ where: { id } });
      else {
        const data = mileageSchema.parse({ ...await request.json(), vehicleId: reading.vehicleId });
        await validateMileage(tx, reading.vehicleId, data.mileage, data.date, data.allowCorrection, id);
        const duplicate = await tx.mileageReading.findFirst({ where: { vehicleId: reading.vehicleId, id: { not: id }, date: data.date, mileage: data.mileage } });
        if (duplicate) throw new MileageConflict("Un relevé identique existe déjà à cette date.");
        await tx.mileageReading.update({ where: { id }, data: { mileage: data.mileage, date: data.date, comment: data.comment ?? null, isCorrection: true } });
        const linked = await tx.fuelEntry.findMany({ where: { mileageReadingId: id } });
        for (const fuel of linked) {
          await tx.fuelEntry.update({ where: { id: fuel.id }, data: { mileage: data.mileage, date: data.date } });
          await tx.expense.updateMany({ where: { fuelEntryId: fuel.id }, data: { mileage: data.mileage, date: data.date } });
        }
        await recalculateFuel(tx, reading.vehicleId);
      }
      await recalculateMileage(tx, reading.vehicleId);
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return error instanceof MileageConflict ? NextResponse.json({ error: error.message }, { status: 409 }) : apiError(error); }
}
