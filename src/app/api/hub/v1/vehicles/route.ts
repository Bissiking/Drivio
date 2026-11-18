import { db } from "@/lib/db";
import { hubFailure, hubJson, hubUnauthorized, hubUser } from "@/lib/hub";

export async function GET(request: Request) {
  try {
    const user = await hubUser(request);
    if (!user) return hubUnauthorized();
    const query = new URL(request.url).searchParams;
    const offset = Number(query.get("offset") ?? "0");
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000) return hubJson({ error: { code: "INVALID_QUERY", message: "offset doit être un entier entre 0 et 10000." } }, 400);
    const now = new Date();
    const rows = await db.vehicle.findMany({
      where: { userId: user.id, ...(user.vehicleIds ? { id: { in: user.vehicleIds } } : {}) }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }], skip: offset, take: 51,
      select: { id: true, brand: true, model: true, year: true, status: true, isPrimary: true, purchaseMileage: true, purchaseDate: true, finalMileage: true, saleDate: true,
        mileageReadings: { where: { date: { lte: now } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 1, select: { mileage: true, date: true } },
      },
    });
    return hubJson({ version: "1", generatedAt: now, vehicles: rows.slice(0, 50).map(v => ({
      id: v.id, brand: v.brand, model: v.model, year: v.year, status: v.status, isPrimary: v.isPrimary,
      mileage: { value: v.finalMileage ?? v.mileageReadings[0]?.mileage ?? v.purchaseMileage, unit: "km", source: "recorded", recordedAt: v.finalMileage !== null ? v.saleDate : v.mileageReadings[0]?.date ?? v.purchaseDate },
    })), nextOffset: rows.length > 50 ? offset + 50 : null });
  } catch { return hubFailure(); }
}
