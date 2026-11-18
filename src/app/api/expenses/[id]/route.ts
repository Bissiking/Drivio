import { requireVehicleAccess, vehicleWhere } from "@/lib/vehicle-access";
import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { expenseSchema } from "@/lib/validations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const expense = await db.expense.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!expense) return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, expense.vehicleId, "SIMPLE", true);
    if (expense.maintenanceRecordId) await requireVehicleAccess(user.id, expense.vehicleId, "COMPLETE", true);
    if (expense.fuelEntryId) return NextResponse.json({ error: "Cette dépense est liée à un plein. Modifiez le plein pour actualiser ses données et son montant." }, { status: 409 });
    const data = expenseSchema.parse({ ...await request.json(), vehicleId: expense.vehicleId });
    if (expense.maintenanceRecordId && data.category !== "ENTRETIEN") return NextResponse.json({ error: "Une dépense liée à un entretien doit conserver le type Entretien." }, { status: 409 });
    const saved = await db.$transaction(async tx => {
      await tx.vehicle.update({ where: { id: expense.vehicleId }, data: { updatedAt: new Date() } });
      await requireVehicleAccess(user.id, expense.vehicleId, "SIMPLE", true, tx);
      if (expense.maintenanceRecordId) await requireVehicleAccess(user.id, expense.vehicleId, "COMPLETE", true, tx);
      if (expense.maintenanceRecordId) await tx.maintenanceRecord.update({ where: { id: expense.maintenanceRecordId }, data: { cost: data.amount, date: data.date, mileage: data.mileage ?? null } });
      return tx.expense.update({ where: { id }, data: { ...data, subcategory: data.subcategory ?? null, mileage: data.mileage ?? null, comment: data.comment ?? null } });
    });
    return NextResponse.json({ expense: saved });
  } catch (error) { return apiError(error); }
}
