import { requireVehicleAccess } from "@/lib/vehicle-access";
// src/app/api/fuel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { fuelSchema } from "@/lib/validations";
import { saveFuel } from "@/lib/fuel-records";
import { MileageConflict } from "@/lib/mileage";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = fuelSchema.parse(await request.json());
    await requireVehicleAccess(user.id, data.vehicleId, "SIMPLE", true);
    if (data.stationId && (!data.fuelType || !await db.fuelStation.findUnique({ where: { id: data.stationId } }))) return NextResponse.json({ error: "Choisissez un carburant et un identifiant officiel de station connu dans la recherche." }, { status: 400 });
    const fuel = await saveFuel(data, undefined, user.id);
    return NextResponse.json({ fuel }, { status: 201 });
  } catch (error) { return error instanceof MileageConflict ? NextResponse.json({ error: error.message }, { status: 409 }) : apiError(error); }
}
