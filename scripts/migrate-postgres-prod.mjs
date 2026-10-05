// scripts/migrate-postgres-prod.mjs
import "dotenv/config";
import { spawnSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const INIT_MIGRATION = "20260831173755_init";
const CONFIG = "prisma.postgresql.config.ts";

const requiredLegacyColumns = {
  User: ["id", "kyrosSubject", "createdAt", "updatedAt"],
  Vehicle: ["id", "userId", "brand", "model", "purchaseDate", "purchaseMileage"],
  VehicleImageRequest: ["id", "vehicleId", "prompt", "status"],
  MileageReading: ["id", "vehicleId", "mileage", "date", "isCorrection"],
  MaintenanceRecord: ["id", "vehicleId", "type", "title", "date"],
  MaintenanceSchedule: ["id", "vehicleId", "type", "title"],
  Expense: ["id", "vehicleId", "category", "amount", "date"],
  FuelEntry: ["id", "vehicleId", "date", "mileage", "liters", "totalPrice", "unitPrice"],
};

const v120Markers = [
  ["MileageReading", "source"],
  ["Expense", "fuelEntryId"],
  ["Expense", "maintenanceRecordId"],
  ["FuelEntry", "mileageReadingId"],
];

const v120Tables = [
  "Warranty",
  "TechnicalInspection",
  "InsurancePolicy",
  "VehicleDocument",
  "TireSet",
  "NotificationSettings",
  "NotificationDelivery",
];

function prisma(args) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, ["prisma", ...args], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT to_regclass($1) IS NOT NULL AS "exists"`,
    [`public."${tableName}"`],
  );
  return rows[0]?.exists === true;
}

async function columnExists(client, tableName, columnName) {
  const { rows } = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) AS "exists"
    `,
    [tableName, columnName],
  );
  return rows[0]?.exists === true;
}

async function initMigrationApplied(client) {
  if (!(await tableExists(client, "_prisma_migrations"))) return false;

  const { rows } = await client.query(
    `
      SELECT "finished_at", "rolled_back_at"
      FROM "_prisma_migrations"
      WHERE "migration_name" = $1
      ORDER BY "started_at" DESC
      LIMIT 1
    `,
    [INIT_MIGRATION],
  );

  if (!rows.length) return false;
  return rows[0].finished_at !== null && rows[0].rolled_back_at === null;
}

async function verifyLegacyBaseline(client) {
  const problems = [];

  for (const [tableName, columns] of Object.entries(requiredLegacyColumns)) {
    if (!(await tableExists(client, tableName))) {
      problems.push(`table manquante: ${tableName}`);
      continue;
    }

    for (const columnName of columns) {
      if (!(await columnExists(client, tableName, columnName))) {
        problems.push(`colonne manquante: ${tableName}.${columnName}`);
      }
    }
  }

  for (const tableName of v120Tables) {
    if (await tableExists(client, tableName)) {
      problems.push(`marqueur 1.2.0 déjà présent: table ${tableName}`);
    }
  }

  for (const [tableName, columnName] of v120Markers) {
    if (await columnExists(client, tableName, columnName)) {
      problems.push(`marqueur 1.2.0 déjà présent: colonne ${tableName}.${columnName}`);
    }
  }

  return problems;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est requis.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    if (await initMigrationApplied(client)) {
      console.log(`[Drivio] Migration initiale déjà enregistrée. Déploiement normal.`);
    } else {
      console.log(`[Drivio] Historique Prisma initial absent ou en échec. Vérification du schéma PROD existant...`);

      const problems = await verifyLegacyBaseline(client);
      if (problems.length) {
        console.error("[Drivio] Baselining refusé pour protéger les données :");
        for (const problem of problems) console.error(`  - ${problem}`);
        console.error("[Drivio] Aucune migration supplémentaire n'a été lancée.");
        process.exit(2);
      }

      console.log(`[Drivio] Schéma 1.0.x reconnu. Enregistrement de ${INIT_MIGRATION} comme déjà appliquée.`);
      prisma(["migrate", "resolve", "--applied", INIT_MIGRATION, "--config", CONFIG]);
    }
  } finally {
    await client.end();
  }

  console.log("[Drivio] Application des migrations PostgreSQL restantes...");
  prisma(["migrate", "deploy", "--config", CONFIG]);
  console.log("[Drivio] Migration PostgreSQL terminée.");
}

main().catch((error) => {
  console.error("[Drivio] Échec de la migration PROD :", error);
  process.exit(1);
});
