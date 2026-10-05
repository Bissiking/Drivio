// src/app/api/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { vehicleSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = vehicleSchema.parse(await request.json());
    const count = await db.vehicle.count({ where: { userId: user.id } });
    const makePrimary = data.isPrimary || count === 0;
    const vehicle = await db.$transaction(async (tx) => {
      if (makePrimary) await tx.vehicle.updateMany({ where: { userId: user.id }, data: { isPrimary: false } });
      const created = await tx.vehicle.create({ data: { ...data, userId: user.id, isPrimary: makePrimary && data.status === "ACTIVE" } });
      await tx.mileageReading.create({ data: { vehicleId: created.id, mileage: data.purchaseMileage, date: data.purchaseDate, comment: "Kilométrage à l’achat" } });
      return created;
    });
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
