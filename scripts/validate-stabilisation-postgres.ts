// Only run after migrations on the disposable PostgreSQL instance documented below.
import assert from "node:assert/strict";
import { Client } from "pg";
import { db } from "../src/lib/db";
import { withVehicleWrite, VehicleAccessError } from "../src/lib/vehicle-access";
import { manageVehicleShare } from "../src/lib/vehicle-sharing";
import { saveFuel } from "../src/lib/fuel-records";
import { fuelSchema } from "../src/lib/validations";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "file:invalid");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "55448");
  assert.equal(url.username, "drivio_stabilisation");
  const observer = new Client({ connectionString: url.href });
  const blocker = new Client({ connectionString: url.href });
  const id = `stabilisation-${Date.now()}`, guest = `${id}-guest`, car = `${id}-car`, share = `${id}-share`;
  const date = new Date("2026-02-01");
  await observer.connect(); await blocker.connect();
  async function waitForLock() {
    for (let i = 0; i < 100; i++) {
      const result = await observer.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND usename = $1 AND wait_event_type = 'Lock'", [url.username]);
      if (result.rows[0].n > 0) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error("La requête concurrente n’a pas attendu le verrou PostgreSQL.");
  }
  const grant = () => db.vehicleShare.create({ data: { id: share, vehicleId: car, recipientId: guest, email: "guest@example.test", acceptedAt: date, expiresAt: new Date("2099-01-01"), scope: "COMPLETE", permission: "WRITE" } });
  try {
    await db.user.createMany({ data: [{ id, kyrosSubject: id }, { id: guest, kyrosSubject: guest }] });
    await db.vehicle.create({ data: { id: car, userId: id, brand: "Test", model: "Stabilisation", trim: "Synthetic", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 } });
    await grant();
    // Revocation holds the row before the writer's initial access check sees it committed.
    await blocker.query("BEGIN");
    await blocker.query('UPDATE "Vehicle" SET "updatedAt" = NOW() WHERE id = $1', [car]);
    await blocker.query('DELETE FROM "VehicleShare" WHERE id = $1', [share]);
    const denied = withVehicleWrite(guest, car, "SIMPLE", tx => tx.expense.create({ data: { vehicleId: car, category: "PARKING", amount: 10, date } })).then(() => null, error => error);
    try { await waitForLock(); } finally { await blocker.query("COMMIT"); }
    const error = await denied;
    assert.ok(error instanceof VehicleAccessError); assert.equal(error.status, 404);
    assert.equal(await db.expense.count({ where: { vehicleId: car } }), 0);

    // A write that holds the lock finishes before a concurrent revocation can return.
    await grant();
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    const writing = withVehicleWrite(guest, car, "SIMPLE", async tx => {
      entered(); await gate;
      return tx.expense.create({ data: { vehicleId: car, category: "PARKING", amount: 12, date } });
    });
    await ready;
    const revoking = manageVehicleShare(id, car, tx => tx.vehicleShare.delete({ where: { id: share } }));
    try { await waitForLock(); } finally { release(); }
    await writing; await revoking;
    assert.equal(await db.vehicleShare.count({ where: { id: share } }), 0);
    assert.equal(await db.expense.count({ where: { vehicleId: car } }), 1);

    // Legacy mirrors are updated in place with the generated PostgreSQL client.
    await db.fuelEntry.create({ data: { id: `${id}-fuel`, vehicleId: car, date, mileage: 1100, liters: 10, totalPrice: 20, unitPrice: 2, isFull: true } });
    await db.expense.create({ data: { id: `${id}-mirror`, vehicleId: car, category: "CARBURANT", amount: 20, date, mileage: 1100 } });
    await saveFuel(fuelSchema.parse({ vehicleId: car, date: "2026-02-02", mileage: 1200, liters: 15, totalPrice: 30, isFull: true }), `${id}-fuel`, id);
    const mirror = await db.expense.findUniqueOrThrow({ where: { id: `${id}-mirror` } });
    assert.equal(mirror.fuelEntryId, `${id}-fuel`); assert.equal(Number(mirror.amount), 30);
    assert.equal(await db.expense.count({ where: { vehicleId: car, category: "CARBURANT" } }), 1);
    console.log("PostgreSQL: real row-lock contention in both orders, revoked writer denied, legacy fuel mirror retained and updated.");
  } finally {
    await blocker.query("ROLLBACK"); await blocker.end(); await observer.end();
    await db.user.deleteMany({ where: { id: { in: [id, guest] } } }); await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
