// src/app/api/mileage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
import { mileageSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = mileageSchema.parse(await request.json());
    if (!(await ownedVehicle(user.id, data.vehicleId))) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const previous = await db.mileageReading.findFirst({ where: { vehicleId: data.vehicleId, date: { lte: data.date } }, orderBy: { date: "desc" } });
    if (previous && data.mileage < previous.mileage && !data.allowCorrection) {
      return NextResponse.json({ error: `Le dernier relevé est de ${previous.mileage.toLocaleString("fr-FR")} km. Cochez « correction explicite » pour enregistrer une valeur inférieure.` }, { status: 409 });
    }
    const reading = await db.mileageReading.create({
      data: {
        vehicleId: data.vehicleId,
        mileage: data.mileage,
        date: data.date,
        comment: data.comment,
        isCorrection: Boolean(previous && data.mileage < previous.mileage),
        distanceFromPrevious: previous ? data.mileage - previous.mileage : null,
      },
    });
    return NextResponse.json({ reading }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
