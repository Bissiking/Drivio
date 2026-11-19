// scripts/validate-postgres-migrations.mjs
// Runs exclusively in a new schema and rolls back every DDL/data change.
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
const url = process.env.DRIVIO_TEST_POSTGRES_URL;
if (!url?.startsWith("postgres")) throw new Error("Configurez DRIVIO_TEST_POSTGRES_URL vers une base PostgreSQL de test.");
const client = new Client({ connectionString: url });
const schema = `drivio_validation_${randomUUID().replaceAll("-", "")}`;
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET LOCAL search_path TO "${schema}"`);
  const names = (await readdir("prisma/migrations-postgresql")).filter(n => /^\d/.test(n)).sort();
  for (const name of names) {
    const sql = (await readFile(`prisma/migrations-postgresql/${name}/migration.sql`, "utf8")).replace('CREATE SCHEMA IF NOT EXISTS "public";', "");
    await client.query(sql);
    if (name === "20261005120000_drivio_120") {
      await client.query(`INSERT INTO "User" (id, "kyrosSubject", "updatedAt") VALUES ('validation', 'validation', NOW());
        INSERT INTO "Vehicle" (id, "userId", brand, model, trim, year, "purchaseDate", "purchaseMileage", "updatedAt") VALUES ('car', 'validation', 'Test', 'Car', 'V', 2022, NOW(), 10000, NOW());
        INSERT INTO "FuelEntry" (id, "vehicleId", date, mileage, liters, "totalPrice", "unitPrice", "updatedAt") VALUES ('fill', 'car', NOW(), 10500, 20, 40, 2, NOW());
        INSERT INTO "Expense" (id, "vehicleId", category, amount, date, "fuelEntryId", "updatedAt") VALUES ('expense', 'car', 'CARBURANT', 40, NOW(), 'fill', NOW());`);
    }
    if (name === "20261118100000_drivio_210") await client.query(`UPDATE "User" SET "themeMode" = 'light', "themePalette" = 'slate' WHERE id = 'validation'`);
  }
  const { rows } = await client.query(`SELECT e."fuelEntryId", e.amount, u."autoFuelMobile", u."autoFuelDesktop", u."homePage", u."interfaceStyle", u."themeMode", u."themePalette" FROM "Expense" e JOIN "Vehicle" v ON v.id = e."vehicleId" JOIN "User" u ON u.id = v."userId"`);
  if (rows.length !== 1 || rows[0].fuelEntryId !== "fill" || rows[0].autoFuelMobile !== false || Number(rows[0].amount) !== 40 || rows[0].homePage !== "auto" || rows[0].interfaceStyle !== "classic" || rows[0].themeMode !== "light" || rows[0].themePalette !== "slate") throw new Error("La migration a altéré les données de validation.");
  console.log(`${names.length} migrations PostgreSQL vérifiées, données et liens conservés.`);
} finally { await client.query("ROLLBACK"); await client.end(); }
