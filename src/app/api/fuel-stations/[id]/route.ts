// src/app/api/fuel-stations/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { fuel, vehicle } = z.object({ fuel: z.enum(["1", "2", "3", "4", "5", "6"]), vehicle: z.string().optional() }).parse(Object.fromEntries(new URL(request.url).searchParams));
    if (vehicle && !await ownedVehicle(user.id, vehicle)) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const id = (await context.params).id, station = await db.fuelStation.findUnique({ where: { id } });
    if (!station) return NextResponse.json({ error: "Station introuvable." }, { status: 404 });
    const history = await db.fuelPriceHistory.findMany({ where: { stationId: id, fuelId: fuel }, orderBy: [{ declaredAt: "desc" }, { observedAt: "desc" }], take: 300 });
    const entries = vehicle ? await db.fuelEntry.findMany({ where: { vehicleId: vehicle, vehicle: { userId: user.id }, stationId: id, fuelType: fuel }, orderBy: { date: "desc" }, take: 30 }) : [];
    const comparisons = await Promise.all(entries.map(async e => {
      const official = await db.fuelPriceHistory.findFirst({ where: { stationId: id, fuelId: fuel, declaredAt: { lte: e.date } }, orderBy: [{ declaredAt: "desc" }, { observedAt: "desc" }] });
      return { date: e.date, paid: Number(e.unitPrice), official: official ? Number(official.value) : null, declaredAt: official?.declaredAt ?? null, difference: official ? Number(e.unitPrice) - Number(official.value) : null };
    }));
    return NextResponse.json({ history: history.toReversed().map(p => ({ date: p.declaredAt, value: Number(p.value), observedAt: p.observedAt })), comparisons }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
