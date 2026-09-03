import { NextRequest, NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/api";
import { db } from "@/lib/db";

type EntityType =
  | "vehicle"
  | "mileage_reading"
  | "maintenance_record"
  | "maintenance_schedule"
  | "expense"
  | "fuel_entry";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });

  try {
    const { entityType, entityId, operation, payload } = await request.json();

    if (!entityType || !entityId || !operation) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    if (operation === "delete") {
      await handleDelete(entityType as EntityType, entityId);
      return NextResponse.json({ version: 1 });
    }

    const result = await handleUpsert(entityType as EntityType, entityId, payload);
    return NextResponse.json({ version: result });
  } catch (error) {
    return apiError(error);
  }
}

async function handleDelete(entityType: EntityType, id: string): Promise<void> {
  switch (entityType) {
    case "vehicle":
      await db.vehicle.update({ where: { id }, data: { status: "ARCHIVED" } });
      break;
    default:
      break;
  }
}

async function handleUpsert(
  entityType: EntityType,
  id: string,
  data: Record<string, unknown>
): Promise<number> {
  const now = new Date();

  switch (entityType) {
    case "vehicle": {
      const existing = await db.vehicle.findUnique({ where: { id } });
      if (existing) {
        await db.vehicle.update({ where: { id }, data: { ...data, updatedAt: now } });
        return 1;
      }
      await db.vehicle.create({ data: { id, ...data } as never });
      return 1;
    }
    case "mileage_reading": {
      const existing = await db.mileageReading.findUnique({ where: { id } });
      if (existing) {
        await db.mileageReading.update({ where: { id }, data: { ...data, updatedAt: now } });
        return 1;
      }
      await db.mileageReading.create({ data: { id, ...data } as never });
      return 1;
    }
    case "maintenance_record": {
      const existing = await db.maintenanceRecord.findUnique({ where: { id } });
      if (existing) {
        await db.maintenanceRecord.update({ where: { id }, data: { ...data, updatedAt: now } });
        return 1;
      }
      await db.maintenanceRecord.create({ data: { id, ...data } as never });
      return 1;
    }
    case "maintenance_schedule": {
      const existing = await db.maintenanceSchedule.findUnique({ where: { id } });
      if (existing) {
        await db.maintenanceSchedule.update({ where: { id }, data: { ...data, updatedAt: now } });
        return 1;
      }
      await db.maintenanceSchedule.create({ data: { id, ...data } as never });
      return 1;
    }
    case "expense": {
      const existing = await db.expense.findUnique({ where: { id } });
      if (existing) {
        await db.expense.update({ where: { id }, data: { ...data, updatedAt: now } });
        return 1;
      }
      await db.expense.create({ data: { id, ...data } as never });
      return 1;
    }
    case "fuel_entry": {
      const existing = await db.fuelEntry.findUnique({ where: { id } });
      if (existing) {
        await db.fuelEntry.update({ where: { id }, data: { ...data, updatedAt: now } });
        return 1;
      }
      await db.fuelEntry.create({ data: { id, ...data } as never });
      return 1;
    }
    default:
      return 1;
  }
}
