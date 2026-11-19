import { requireVehicleAccess, vehicleWhere, withVehicleWrite } from "@/lib/vehicle-access";
// src/app/api/maintenance/[id]/baseline/route.ts
import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { maintenanceCycleSchema } from "@/lib/validations";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const id = (await params).id;
    const schedule = await db.maintenanceSchedule.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!schedule) return NextResponse.json({ error: "Échéance introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, schedule.vehicleId, "COMPLETE", true);
    const data = maintenanceCycleSchema.parse(await request.json());
    const updated = await withVehicleWrite(user.id, schedule.vehicleId, "COMPLETE", async tx => {
      const current = await tx.maintenanceSchedule.findUniqueOrThrow({ where: { id } });
      if (data.cycleStartDate && current.dueDate && data.cycleStartDate >= current.dueDate) return NextResponse.json({ error: "La référence doit précéder la date d'échéance." }, { status: 400 });
      if (data.cycleStartMileage !== undefined && current.dueMileage !== null && data.cycleStartMileage >= current.dueMileage) return NextResponse.json({ error: "Le compteur de référence doit précéder le compteur d'échéance." }, { status: 400 });
      return tx.maintenanceSchedule.updateMany({ where: { id, completedAt: null }, data: { cycleStartDate: data.cycleStartDate ?? null, cycleStartMileage: data.cycleStartMileage ?? null } });
    });
    if (updated instanceof NextResponse) return updated;
    if (!updated.count) return NextResponse.json({ error: "Cette échéance a déjà été réalisée." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
