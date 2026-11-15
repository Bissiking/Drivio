// src/app/api/fuel-stations/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { distanceKm, normalizeArea } from "@/lib/fuel-feed";
const schema = z.object({ area: z.string().max(100).default(""), fuel: z.enum(["1", "2", "3", "4", "5", "6"]).default("1"), lat: z.coerce.number().min(-90).max(90).optional(), lon: z.coerce.number().min(-180).max(180).optional(), radius: z.coerce.number().min(1).max(100).default(10), liters: z.coerce.number().positive().max(2000).default(40) }).refine(q => (q.lat === undefined) === (q.lon === undefined), "Renseignez les deux coordonnées.");
export async function GET(request: Request) {
  if (!await apiUser()) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const q = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const now = new Date(), ongoing = { OR: [{ endedAt: null }, { endedAt: { gt: now } }] };
    if (!q.area && q.lat === undefined) return NextResponse.json({ error: "Choisissez une ville, un code postal ou votre position." }, { status: 400 });
    const latDelta = q.radius / 110, lonDelta = q.lat !== undefined ? Math.min(180, q.radius / (110 * Math.max(0.01, Math.cos(q.lat * Math.PI / 180)))) : 180;
    const stations = await db.fuelStation.findMany({ where: { active: true, ...(q.area ? { searchText: { contains: normalizeArea(q.area) } } : {}), ...(q.lat !== undefined && q.lon !== undefined ? { latitude: { gte: q.lat - latDelta, lte: q.lat + latDelta }, longitude: { gte: q.lon - lonDelta, lte: q.lon + lonDelta } } : {}), OR: [{ prices: { some: { fuelId: q.fuel, active: true } } }, { outages: { some: { fuelId: q.fuel, ...ongoing } } }] }, include: { prices: { where: { fuelId: q.fuel, active: true } }, outages: { where: { fuelId: q.fuel, ...ongoing } } } });
    const result = stations.map(s => {
      const price = s.prices[0], outage = s.outages.find(o => !o.endedAt || o.endedAt > now), distance = q.lat !== undefined && q.lon !== undefined && s.latitude !== null && s.longitude !== null ? distanceKm(q.lat, q.lon, s.latitude, s.longitude) : null;
      return { id: s.id, address: s.address, city: s.city, postalCode: s.postalCode, distance, price: price ? Number(price.value) : null, declaredAt: price?.declaredAt ?? null, stale: price ? Date.now() - price.declaredAt.getTime() > 7 * 86_400_000 : false, lastSeenAt: s.lastSeenAt, availabilityUncertain: s.availabilityUncertain, outage: outage ? { type: outage.type, startedAt: outage.startedAt } : null, estimatedFill: price && !outage && !s.availabilityUncertain ? Number(price.value) * q.liters : null };
    }).filter(s => s.distance === null || s.distance <= q.radius).sort((a, b) => Number(Boolean(a.outage)) - Number(Boolean(b.outage)) || (a.price ?? Infinity) - (b.price ?? Infinity));
    const sync = await db.fuelSyncState.findUnique({ where: { id: "fuel-prices-sync" }, select: { completedAt: true, status: true } });
    return NextResponse.json({ stations: result.slice(0, 50), total: result.length, sync }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}


