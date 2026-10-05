import { db } from "./db";
export async function vehicleWorkspace(userId: string, selected?: string) {
  const vehicles = await db.vehicle.findMany({ where: { userId }, select: { id: true, brand: true, model: true, status: true }, orderBy: [{ status: "asc" }, { isPrimary: "desc" }, { createdAt: "asc" }] });
  const vehicleId = selected ?? vehicles[0]?.id;
  const vehicle = vehicleId ? await db.vehicle.findFirst({ where: { id: vehicleId, userId }, include: { mileageReadings: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] }, expenses: { orderBy: { date: "desc" } }, fuelEntries: { orderBy: { date: "asc" } }, maintenance: { orderBy: { date: "desc" } }, schedules: true, warranties: { orderBy: { endDate: "desc" } }, inspections: { orderBy: { date: "desc" } }, insurancePolicies: { orderBy: { startDate: "desc" } }, tireSets: { orderBy: { mountedAt: "desc" } }, documents: { orderBy: { date: "desc" } } } }) : null;
  return { vehicles, vehicle };
}
