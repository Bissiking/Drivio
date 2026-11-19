// Isolated, synthetic data only. Never connects to DATABASE_URL from .env.
import { testDatabase } from "../src/test/database";
import { createSessionToken } from "../src/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
async function main() {
  const fixture = await testDatabase(), client = fixture.client;
  process.env.DATABASE_URL = `file:${fixture.directory}/test.db`;
  process.env.SESSION_SECRET = "drivio-210-local-browser-synthetic-secret";
  await client.user.createMany({ data: [{ id: "qa-owner", kyrosSubject: "qa-owner", name: "Recette 2.1.0" }, { id: "qa-outsider", kyrosSubject: "qa-outsider" }] });
  for (const [id, userId, brand, model] of [["qa-cupra", "qa-owner", "CUPRA", "Formentor"], ["qa-clio", "qa-owner", "Renault", "Clio"], ["qa-private", "qa-outsider", "Peugeot", "308"]]) await client.vehicle.create({ data: { id, userId, brand, model, trim: "V", year: 2024, purchaseDate: new Date("2025-01-01"), purchaseMileage: 10000, powertrain: "1.5 TSI 150 DSG7", isPrimary: id === "qa-cupra", drivetrain: "FRONT" } });
  for (const [date, mileage] of [["2026-06-01", 30000], ["2026-07-01", 31000], ["2026-08-01", 32000], ["2026-09-01", 33000], ["2026-10-01", 34000]] as const) await client.mileageReading.create({ data: { vehicleId: "qa-cupra", date: new Date(date), mileage } });
  for (const [id, date, mileage, liters] of [["qa-fuel-1", "2026-11-01", 35000, 40], ["qa-fuel-2", "2026-11-10", 35600, 38], ["qa-fuel-3", "2026-11-17", 36000, 30]] as const) {
    const reading = await client.mileageReading.create({ data: { vehicleId: "qa-cupra", date: new Date(date), mileage, source: "FUEL" } });
    await client.fuelEntry.create({ data: { id, vehicleId: "qa-cupra", date: new Date(date), mileage, liters, totalPrice: liters * 2, unitPrice: 2, isFull: true, mileageReadingId: reading.id } });
    await client.expense.create({ data: { vehicleId: "qa-cupra", fuelEntryId: id, date: new Date(date), mileage, category: "CARBURANT", amount: liters * 2 } });
  }
  await client.expense.create({ data: { id: "qa-expense", vehicleId: "qa-cupra", category: "PARKING", subcategory: "PONCTUEL", amount: 12, date: new Date("2026-11-16"), comment: "Parking centre-ville" } });
  await client.maintenanceRecord.create({ data: { id: "qa-record", vehicleId: "qa-cupra", type: "PLAQUETTES", category: "FREINAGE", subcategory: "PLAQUETTES", title: "Plaquettes avant", date: new Date("2026-05-01"), mileage: 29000, cost: 140 } });
  await client.expense.create({ data: { maintenanceRecordId: "qa-record", vehicleId: "qa-cupra", category: "ENTRETIEN", amount: 140, date: new Date("2026-05-01"), mileage: 29000 } });
  await client.maintenanceSchedule.createMany({ data: [{ id: "qa-schedule", vehicleId: "qa-cupra", type: "VIDANGE", category: "MOTEUR", subcategory: "VIDANGE", title: "Vidange moteur et filtre", dueMileage: 37000, warningKm: 1500, cycleStartMileage: 22000 }, { vehicleId: "qa-cupra", type: "PLAQUETTES", category: "FREINAGE", subcategory: "PLAQUETTES", title: "Plaquettes avant", dueDate: new Date("2027-05-01"), dueMileage: 60000 }] });
  await client.tireSet.create({ data: { vehicleId: "qa-cupra", brand: "Michelin", dimensions: "225/45 R18", type: "ETE", quality: "PREMIUM", position: "COMPLET", mountedAt: new Date("2026-01-01"), mountedMileage: 27000 } });
  let guestToken: string | undefined;
  if (process.argv.includes("--sharing")) {
    await client.user.update({ where: { id: "qa-owner" }, data: { email: "qa-owner@example.test" } });
    await client.user.create({ data: { id: "qa-guest", kyrosSubject: "qa-guest", email: "qa-guest@example.test", name: "Compte destinataire" } });
    await client.maintenanceRecord.update({ where: { id: "qa-record" }, data: { notes: "PRIVATE_MAINTENANCE_NOTE" } });
    await client.vehicle.update({ where: { id: "qa-cupra" }, data: { vin: "PRIVATE_VEHICLE_VIN" } });
    await mkdir(`${fixture.directory}/documents`);
    await writeFile(`${fixture.directory}/documents/private.pdf`, "%PDF-local-synthetic");
    await client.vehicleDocument.create({ data: { id: "qa-document", vehicleId: "qa-cupra", title: "PRIVATE_DOCUMENT_TITLE", category: "AUTRE", date: new Date("2026-01-01"), storageKey: "private.pdf", originalName: "private.pdf", mimeType: "application/pdf", size: 20 } });
    const until = Date.now() + 86400000;
    guestToken = await createSessionToken({ userId: "qa-guest", subject: "qa-guest", refreshToken: "synthetic-only", accessExpiresAt: until, refreshExpiresAt: until });
  }
  const expiry = Date.now() + 86400000;
  const token = await createSessionToken({ userId: "qa-owner", subject: "qa-owner", refreshToken: "synthetic-only", accessExpiresAt: expiry, refreshExpiresAt: expiry });
  const mobileTokens: Record<string, string> = {};
  if (process.argv.includes("--mobile")) for (const name of ["automaticToken", "priorityToken", "manualToken"]) mobileTokens[name] = await createSessionToken({ userId: "qa-owner", subject: "qa-owner", refreshToken: "synthetic-only", accessExpiresAt: expiry, refreshExpiresAt: expiry, loginId: `qa220-${name}` });
  await mkdir("tmp", { recursive: true });
  await writeFile("tmp/210-browser-session.json", JSON.stringify({ database: `${fixture.directory}/test.db`, directory: fixture.directory, token, guestToken, ...mobileTokens, secret: process.env.SESSION_SECRET }));
  await client.$disconnect();
  console.log("Isolated synthetic browser fixture ready.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
