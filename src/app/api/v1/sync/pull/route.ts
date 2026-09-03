import { NextRequest, NextResponse } from "next/server";
import { apiUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });

  const since = request.nextUrl.searchParams.get("since");

  const sinceDate = since ? new Date(since) : new Date(0);

  const [vehicles, mileageReadings, maintenanceRecords, maintenanceSchedules, expenses, fuelEntries] =
    await Promise.all([
      db.vehicle.findMany({
        where: { userId: user.id, updatedAt: { gt: sinceDate } },
        orderBy: { updatedAt: "asc" },
      }),
      db.mileageReading.findMany({
        where: {
          vehicle: { userId: user.id },
          updatedAt: { gt: sinceDate },
        },
        orderBy: { updatedAt: "asc" },
      }),
      db.maintenanceRecord.findMany({
        where: {
          vehicle: { userId: user.id },
          updatedAt: { gt: sinceDate },
        },
        orderBy: { updatedAt: "asc" },
      }),
      db.maintenanceSchedule.findMany({
        where: {
          vehicle: { userId: user.id },
          updatedAt: { gt: sinceDate },
        },
        orderBy: { updatedAt: "asc" },
      }),
      db.expense.findMany({
        where: {
          vehicle: { userId: user.id },
          updatedAt: { gt: sinceDate },
        },
        orderBy: { updatedAt: "asc" },
      }),
      db.fuelEntry.findMany({
        where: {
          vehicle: { userId: user.id },
          updatedAt: { gt: sinceDate },
        },
        orderBy: { updatedAt: "asc" },
      }),
    ]);

  return NextResponse.json({
    vehicles,
    mileageReadings,
    maintenanceRecords,
    maintenanceSchedules,
    expenses,
    fuelEntries,
  });
}
