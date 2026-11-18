import { requireVehicleAccess, vehicleWhere } from "@/lib/vehicle-access";
// src/app/api/maintenance/[id]/route.ts
import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { maintenanceScheduleSchema } from "@/lib/validations";
import { z } from "zod";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const schedule = await db.maintenanceSchedule.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!schedule) return NextResponse.json({ error: "Échéance introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, schedule.vehicleId, "COMPLETE", true);
    const body = await request.json();
    const { action } = z.object({ action: z.enum(["update", "complete"]).default("complete") }).parse(body);
    if (schedule.completedAt) return NextResponse.json({ error: "Cette échéance a déjà été réalisée." }, { status: 409 });
    const data = action === "update"
      ? maintenanceScheduleSchema.parse({ ...body, vehicleId: schedule.vehicleId })
      : null;
    await db.maintenanceSchedule.update({ where: { id }, data: data ? {
      ...data, dueDate: data.dueDate ?? null, dueMileage: data.dueMileage ?? null,
      reference: data.reference ?? null, estimatedCost: data.estimatedCost ?? null,
      cycleStartDate: data.cycleStartDate ?? null, cycleStartMileage: data.cycleStartMileage ?? null,
      notes: data.notes ?? null,
    } : { completedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const target = await db.maintenanceSchedule.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!target) return NextResponse.json({ error: "Échéance introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, target.vehicleId, "COMPLETE", true);
    const deleted = await db.maintenanceSchedule.deleteMany({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!deleted.count) return NextResponse.json({ error: "Échéance introuvable." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
