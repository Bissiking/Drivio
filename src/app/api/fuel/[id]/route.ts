import { requireVehicleAccess, vehicleWhere } from "@/lib/vehicle-access";
import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { fuelSchema } from "@/lib/validations";
import { saveFuel } from "@/lib/fuel-records";
import { MileageConflict } from "@/lib/mileage";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const existing = await db.fuelEntry.findFirst({ where: { id, vehicle: vehicleWhere(user.id) } });
    if (!existing) return NextResponse.json({ error: "Plein introuvable." }, { status: 404 });
    await requireVehicleAccess(user.id, existing.vehicleId, "SIMPLE", true);
    const data = fuelSchema.parse({ ...await request.json(), vehicleId: existing.vehicleId });
    if (data.stationId && (!data.fuelType || !await db.fuelStation.findUnique({ where: { id: data.stationId } }))) return NextResponse.json({ error: "Choisissez un carburant et une station officielle connue." }, { status: 400 });
    return NextResponse.json({ fuel: await saveFuel(data, id, user.id) });
  } catch (error) { return error instanceof MileageConflict ? NextResponse.json({ error: error.message }, { status: 409 }) : apiError(error); }
}
