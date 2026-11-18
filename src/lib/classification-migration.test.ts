import { readdir, readFile } from "node:fs/promises";
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { maintenanceClassification } from "./taxonomy";
import { maintenanceGauges } from "./maintenance-gauges";

it("reclasse seulement les codes certains et conserve intégralement les faits et les jauges", async () => {
  const sqlite = new Database(":memory:");
  try {
    const target = "20261118100000_drivio_210";
    for (const name of (await readdir("prisma/migrations")).filter(n => /^\d/.test(n) && n < target).sort()) sqlite.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
    sqlite.exec(`INSERT INTO "User" (id, kyrosSubject, updatedAt) VALUES ('u', 'sub', CURRENT_TIMESTAMP);
      INSERT INTO "Vehicle" (id, userId, brand, model, trim, year, purchaseDate, purchaseMileage, updatedAt) VALUES ('v', 'u', 'Test', 'Car', 'V', 2024, '2026-01-01', 1000, CURRENT_TIMESTAMP);`);
    const codes = ["VIDANGE", "FILTRES", "FREINS", "PLAQUETTES", "DISQUES", "PNEUS", "PERSONNALISE", "ANCIEN_INCONNU"];
    for (const code of codes) {
      sqlite.prepare('INSERT INTO "MaintenanceRecord" (id, vehicleId, type, title, date, mileage, cost, notes, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').run(code, "v", code, `Intitulé original ${code}`, "2026-01-10", 1200, 123.45, "Notes conservées");
      sqlite.prepare('INSERT INTO "MaintenanceSchedule" (id, vehicleId, type, title, dueMileage, cycleStartMileage, updatedAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').run(code, "v", code, `Échéance originale ${code}`, 3000, 1200);
    }
    sqlite.exec(`INSERT INTO "Expense" (id, vehicleId, maintenanceRecordId, category, amount, date, mileage, updatedAt) VALUES ('e', 'v', 'VIDANGE', 'ENTRETIEN', 123.45, '2026-01-10', 1200, CURRENT_TIMESTAMP);`);
    const originalRecords = sqlite.prepare('SELECT id, type, title, date, mileage, cost, notes FROM "MaintenanceRecord" ORDER BY id').all();
    const originalSchedules = sqlite.prepare('SELECT id, type, title, dueMileage, cycleStartMileage FROM "MaintenanceSchedule" ORDER BY id').all();
    const expense = sqlite.prepare('SELECT id, maintenanceRecordId, amount, date FROM "Expense"').all();
    const input = { id: "v", purchaseMileage: 1000, finalMileage: null, mileageReadings: [{ mileage: 1500, date: new Date("2026-02-01") }], schedules: [{ id: "s", type: "PLAQUETTES", title: "Plaquettes", dueDate: null, dueMileage: 3000, warningDays: 30, warningKm: 300, completedAt: null, cycleStartMileage: 1200 }], maintenance: [], tireSets: [] };
    const gauges = maintenanceGauges(input, new Date("2026-02-02"));
    await sqlite.exec(await readFile(`prisma/migrations/${target}/migration.sql`, "utf8"));
    expect(sqlite.prepare('SELECT id, type, title, date, mileage, cost, notes FROM "MaintenanceRecord" ORDER BY id').all()).toEqual(originalRecords);
    expect(sqlite.prepare('SELECT id, type, title, dueMileage, cycleStartMileage FROM "MaintenanceSchedule" ORDER BY id').all()).toEqual(originalSchedules);
    expect(sqlite.prepare('SELECT id, maintenanceRecordId, amount, date FROM "Expense"').all()).toEqual(expense);
    for (const table of ["MaintenanceRecord", "MaintenanceSchedule"]) {
      const rows = sqlite.prepare(`SELECT type, category, subcategory FROM "${table}"`).all() as { type: string; category: string | null; subcategory: string | null }[];
      for (const { type, ...classification } of rows) expect(classification).toEqual(maintenanceClassification(type));
    }
    expect(maintenanceGauges({ ...input, schedules: input.schedules.map(s => ({ ...s, ...maintenanceClassification(s.type) })) }, new Date("2026-02-02"))).toEqual(gauges);
    expect(sqlite.pragma("foreign_key_check")).toEqual([]);
    const pg = await readFile(`prisma/migrations-postgresql/${target}/migration.sql`, "utf8");
    expect(pg.replace('TIMESTAMP(3)', 'DATETIME')).toBe(await readFile(`prisma/migrations/${target}/migration.sql`, "utf8"));
  } finally { sqlite.close(); }
});
