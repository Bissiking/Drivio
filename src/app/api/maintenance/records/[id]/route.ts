import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { maintenanceRecordSchema } from "@/lib/validations";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const record = await db.maintenanceRecord.findFirst({ where: { id, vehicle: { userId: user.id } } });
    if (!record) return NextResponse.json({ error: "Entretien introuvable." }, { status: 404 });
    const data = maintenanceRecordSchema.parse({ ...await request.json(), vehicleId: record.vehicleId });
    await db.$transaction(async tx => {
      await tx.maintenanceRecord.update({ where: { id }, data: {
        ...data, mileage: data.mileage ?? null, cost: data.cost ?? null, notes: data.notes ?? null,
      } });
      if (data.cost && data.cost > 0) {
        const expense = { vehicleId: record.vehicleId, category: "ENTRETIEN", amount: data.cost, date: data.date, mileage: data.mileage ?? null, comment: data.title };
        await tx.expense.upsert({ where: { maintenanceRecordId: id }, create: { ...expense, maintenanceRecordId: id }, update: expense });
      } else {
        await tx.expense.deleteMany({ where: { maintenanceRecordId: id } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const record = await db.maintenanceRecord.findFirst({ where: { id, vehicle: { userId: user.id } } });
    if (!record) return NextResponse.json({ error: "Entretien introuvable." }, { status: 404 });
    await db.$transaction(async tx => {
      await tx.expense.deleteMany({ where: { maintenanceRecordId: id } });
      await tx.maintenanceRecord.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
