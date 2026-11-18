// Run only against the isolated PostgreSQL instance used by the local recipe.
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { newHubToken } from "../src/lib/hub";
import { fuelSchema, maintenanceRecordSchema } from "../src/lib/validations";
import { saveFuel } from "../src/lib/fuel-records";
import { GET as summary } from "../src/app/api/hub/v1/summary/route";
import { GET as vehicles } from "../src/app/api/hub/v1/vehicles/route";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "file:invalid");
  assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "55441"); assert.equal(url.username, "drivio_qa");
  const id = `qa210-${Date.now()}`, key = newHubToken();
  try {
    await db.user.create({ data: { id, kyrosSubject: id, hubTokenHash: key.hash, hubTokenExpiresAt: key.expiresAt } });
    const car = await db.vehicle.create({ data: { userId: id, brand: "Test", model: "PostgreSQL", trim: "Synthetic", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 } });
    const first = await saveFuel(fuelSchema.parse({ vehicleId: car.id, date: "2026-02-01", mileage: 1100, liters: 10, totalPrice: 20, isFull: true }));
    const second = await saveFuel(fuelSchema.parse({ vehicleId: car.id, date: "2026-02-10", mileage: 1200, liters: 10, totalPrice: 20, isFull: true }));
    const edited = await saveFuel(fuelSchema.parse({ vehicleId: car.id, date: "2026-02-11", mileage: 1250, liters: 15, totalPrice: 30, isFull: true }), second.id);
    assert.equal(edited.id, second.id); assert.equal(Number(edited.consumptionPer100Km), 10);
    assert.equal(await db.fuelEntry.count({ where: { vehicleId: car.id } }), 2);
    assert.equal(await db.expense.count({ where: { vehicleId: car.id } }), 2);
    assert.equal(Number((await db.expense.findUniqueOrThrow({ where: { fuelEntryId: second.id } })).amount), 30);
    assert.equal(first.mileage, 1100);
    const record = await db.maintenanceRecord.create({ data: maintenanceRecordSchema.parse({ vehicleId: car.id, type: "ETRIERS", title: "Étriers avant", date: "2026-02-11", cost: 100 }) });
    assert.equal(record.category, "FREINAGE"); assert.equal(record.subcategory, "ETRIERS");
    const headers = { authorization: `Bearer ${key.token}` };
    const response = await summary(new Request(`http://localhost/api/hub/v1/summary?vehicle=${car.id}`, { headers }));
    assert.equal(response.status, 200); const payload = await response.json(); assert.equal(payload.fuel.entriesInSample, 2); assert.equal(payload.fuel.consumptionPer100Km, 10);
    const list = await (await vehicles(new Request("http://localhost/api/hub/v1/vehicles", { headers }))).json(); assert.equal(list.vehicles.length, 1); assert.equal(list.vehicles[0].mileage.value, 1250);
    await db.user.update({ where: { id }, data: { hubTokenHash: null, hubTokenExpiresAt: null } });
    assert.equal((await vehicles(new Request("http://localhost/api/hub/v1/vehicles", { headers }))).status, 401);
    console.log("PostgreSQL 14: fuel edit/recalculation/mirrors, maintenance classification, Hub JSON/mileage and revocation passed with Prisma PostgreSQL client.");
  } finally { await db.user.deleteMany({ where: { id } }); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
