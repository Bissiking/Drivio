import { requireVehicleAccess, vehicleWhere } from "@/lib/vehicle-access";
import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { maintenanceRecordSchema } from "@/lib/validations";
import { recordExpense } from "@/lib/record-expenses";
import { maintenanceExpenseSubtype } from "@/lib/taxonomy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const record = await db.maintenanceRecord.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!record) return NextResponse.json({ error: "Entretien introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, record.vehicleId, "COMPLETE", true);
    const data = maintenanceRecordSchema.parse({ ...await request.json(), vehicleId: record.vehicleId });
    await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: record.vehicleId }, data: { updatedAt: new Date() } });
      await requireVehicleAccess(user.id, record.vehicleId, "COMPLETE", true, tx);
      const original = await tx.maintenanceRecord.findUniqueOrThrow({ where: { id } });
      const previousExpense = await recordExpense(tx, "maintenance", { ...original, amount: original.cost });
      await tx.maintenanceRecord.update({ where: { id }, data: {
        ...data, mileage: data.mileage ?? null, cost: data.cost ?? null, notes: data.notes ?? null,
      } });
      if (data.cost && data.cost > 0) {
        const expense = { vehicleId: record.vehicleId, category: "ENTRETIEN", subcategory: maintenanceExpenseSubtype(data.type), amount: data.cost, date: data.date, mileage: data.mileage ?? null, comment: data.title, maintenanceRecordId: id };
        if (previousExpense) await tx.expense.update({ where: { id: previousExpense.id }, data: expense });
        else await tx.expense.create({ data: expense });
      } else {
        if (previousExpense) await tx.expense.delete({ where: { id: previousExpense.id } });
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
    const record = await db.maintenanceRecord.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!record) return NextResponse.json({ error: "Entretien introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, record.vehicleId, "COMPLETE", true);
    await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: record.vehicleId }, data: { updatedAt: new Date() } });
      await requireVehicleAccess(user.id, record.vehicleId, "COMPLETE", true, tx);
      await tx.expense.deleteMany({ where: { maintenanceRecordId: id } });
      await tx.maintenanceRecord.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
