// src/app/api/image-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
import { vehicleImageRequestSchema } from "@/lib/validations";
import { buildVehicleImagePrompt } from "@/lib/vehicle-image-prompts";

export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = vehicleImageRequestSchema.parse(await request.json());
    const vehicle = await ownedVehicle(user.id, data.vehicleId);
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const prompt = buildVehicleImagePrompt(vehicle, data);
    const imageRequest = await db.vehicleImageRequest.create({ data: { ...data, prompt } });
    return NextResponse.json({ imageRequest }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
