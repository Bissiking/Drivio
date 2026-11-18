import { requireVehicleAccess } from "@/lib/vehicle-access";
// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { maintenanceRecordSchema, maintenanceScheduleSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const body = (await request.json()) as { kind?: string };
    if (body.kind === "schedule") {
      const data = maintenanceScheduleSchema.parse(body);
      await requireVehicleAccess(user.id, data.vehicleId, "COMPLETE", true);
      const schedule = await db.maintenanceSchedule.create({ data });
      return NextResponse.json({ schedule }, { status: 201 });
    }
    const data = maintenanceRecordSchema.parse(body);
    await requireVehicleAccess(user.id, data.vehicleId, "COMPLETE", true);
    const record = await db.$transaction(async (tx) => {
      const created = await tx.maintenanceRecord.create({ data });
      if (data.cost && data.cost > 0) await tx.expense.create({ data: { vehicleId: data.vehicleId, maintenanceRecordId: created.id, category: "ENTRETIEN", amount: data.cost, date: data.date, mileage: data.mileage, comment: data.title } });
      return created;
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
