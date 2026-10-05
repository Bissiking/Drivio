import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { persistRecord, recordKind } from "@/lib/vehicle-records";
export async function POST(request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const kind = recordKind.parse((await context.params).kind), body = await request.json();
    const { vehicleId } = z.object({ vehicleId: z.string() }).parse(body);
    if (!await ownedVehicle(user.id, vehicleId)) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    return NextResponse.json({ record: await persistRecord(kind, body) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
