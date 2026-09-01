// src/lib/api.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "./auth";
import { db } from "./db";

export async function apiUser() {
  return getCurrentUser();
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Données invalides", issues: error.flatten() }, { status: 400 });
  const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function ownedVehicle(userId: string, vehicleId: string) {
  return db.vehicle.findFirst({ where: { id: vehicleId, userId } });
}
