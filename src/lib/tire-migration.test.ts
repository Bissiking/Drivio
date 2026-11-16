import { readFile, readdir } from "node:fs/promises";
import Database from "better-sqlite3";
import { expect, it } from "vitest";

it("conserve les anciens montages, hypothèses et mesures lors de la migration SQLite", async () => {
  const sqlite = new Database(":memory:");
  try {
    const folders = (await readdir("prisma/migrations")).filter(name => /^\d/.test(name)).sort();
    const migration = "20261116100000_tire_axles_quality";
    for (const folder of folders.filter(name => name < migration)) sqlite.exec(await readFile(`prisma/migrations/${folder}/migration.sql`, "utf8"));
    sqlite.exec(`
      INSERT INTO "User" (id, "kyrosSubject", "updatedAt") VALUES ('owner', 'owner', CURRENT_TIMESTAMP);
      INSERT INTO "Vehicle" (id, "userId", brand, model, trim, year, "purchaseDate", "purchaseMileage", "updatedAt") VALUES ('car', 'owner', 'Test', 'Car', 'V', 2022, CURRENT_TIMESTAMP, 10000, CURRENT_TIMESTAMP);
      INSERT INTO "TireSet" (id, "vehicleId", brand, dimensions, type, position, "mountedAt", "mountedMileage", "estimatedLifeKm", "replacementCost", "updatedAt") VALUES ('old', 'car', 'Test', '205/55 R16', 'ETE', 'COMPLET', CURRENT_TIMESTAMP, 10000, 55000, 600, CURRENT_TIMESTAMP);
      INSERT INTO "TireMeasurement" (id, "tireSetId", date, mileage, "treadDepthMm") VALUES ('measure', 'old', CURRENT_TIMESTAMP, 12000, 6);
    `);
    const old = sqlite.prepare('SELECT * FROM "TireSet" WHERE id = ?').get("old") as Record<string, unknown>;
    sqlite.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    expect(sqlite.pragma("foreign_key_check")).toEqual([]);
    expect(sqlite.prepare('SELECT * FROM "TireSet" WHERE id = ?').get("old")).toEqual({ ...old, quality: "UNKNOWN" });
    expect(sqlite.prepare('SELECT "tireSetId", mileage FROM "TireMeasurement"').get()).toEqual({ tireSetId: "old", mileage: 12000 });
    expect(sqlite.prepare('SELECT drivetrain FROM "Vehicle"').get()).toEqual({ drivetrain: "UNKNOWN" });
    sqlite.exec(`INSERT INTO "TireSet" (id, "vehicleId", brand, dimensions, type, position, "mountedAt", "mountedMileage", "updatedAt") VALUES ('new', 'car', 'Test', '205/55 R16', 'ETE', 'AVANT', CURRENT_TIMESTAMP, 20000, CURRENT_TIMESTAMP);`);
    expect(sqlite.prepare('SELECT "estimatedLifeKm" FROM "TireSet" WHERE id = ?').get("new")).toEqual({ estimatedLifeKm: null });
    sqlite.exec('DELETE FROM "TireSet" WHERE id = \'old\'');
    expect(sqlite.prepare('SELECT count(*) AS total FROM "TireMeasurement"').get()).toEqual({ total: 0 });
  } finally { sqlite.close(); }
});
