-- prisma/migrations/20261115193000_predictions_fuel_reports/migration.sql
-- AlterTable
ALTER TABLE "TireSet" ADD COLUMN "replacementCost" DECIMAL;
ALTER TABLE "TireSet" ADD COLUMN "targetDepthMm" DECIMAL;

-- CreateTable
CREATE TABLE "TireMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tireSetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mileage" INTEGER NOT NULL,
    "treadDepthMm" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TireMeasurement_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelPromptClaim" (
    "sessionId" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "FuelPromptClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelStation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "searchText" TEXT NOT NULL DEFAULT '',
    "latitude" REAL,
    "longitude" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" DATETIME NOT NULL,
    "missingSince" DATETIME,
    "fingerprint" TEXT NOT NULL,
    "availabilityUncertain" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "FuelPrice" (
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "declaredAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("stationId", "fuelId"),
    CONSTRAINT "FuelPrice_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelPriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "value" DECIMAL NOT NULL,
    "declaredAt" DATETIME NOT NULL,
    "observedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelPriceHistory_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelOutage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "type" TEXT NOT NULL,
    "endSource" TEXT,
    CONSTRAINT "FuelOutage_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelSyncState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaseOwner" TEXT,
    "leaseUntil" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NEVER',
    "snapshotHash" TEXT,
    "stationCount" INTEGER NOT NULL DEFAULT 0,
    "statsJson" TEXT,
    "error" TEXT
);

-- Additive SQLite changes preserve all rows, links, triggers and indexes.
ALTER TABLE "User" ADD COLUMN "autoFuelMobile" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "autoFuelDesktop" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "provenance" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "reference" TEXT;
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "estimatedCost" DECIMAL;
ALTER TABLE "FuelEntry" ADD COLUMN "stationId" TEXT REFERENCES "FuelStation" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FuelEntry" ADD COLUMN "fuelType" TEXT;
-- CreateIndex
CREATE INDEX "TireMeasurement_tireSetId_mileage_idx" ON "TireMeasurement"("tireSetId", "mileage");

-- CreateIndex
CREATE UNIQUE INDEX "TireMeasurement_tireSetId_date_key" ON "TireMeasurement"("tireSetId", "date");

-- CreateIndex
CREATE INDEX "FuelPromptClaim_expiresAt_idx" ON "FuelPromptClaim"("expiresAt");

-- CreateIndex
CREATE INDEX "FuelStation_active_postalCode_idx" ON "FuelStation"("active", "postalCode");

-- CreateIndex
CREATE INDEX "FuelStation_active_latitude_longitude_idx" ON "FuelStation"("active", "latitude", "longitude");

-- CreateIndex
CREATE INDEX "FuelPriceHistory_stationId_fuelId_declaredAt_idx" ON "FuelPriceHistory"("stationId", "fuelId", "declaredAt");

-- CreateIndex
CREATE UNIQUE INDEX "FuelPriceHistory_stationId_fuelId_declaredAt_value_key" ON "FuelPriceHistory"("stationId", "fuelId", "declaredAt", "value");

-- CreateIndex
CREATE INDEX "FuelOutage_stationId_endedAt_idx" ON "FuelOutage"("stationId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FuelOutage_stationId_fuelId_startedAt_key" ON "FuelOutage"("stationId", "fuelId", "startedAt");


INSERT INTO "FuelSyncState" ("id", "status", "stationCount") VALUES ('fuel-prices-sync', 'NEVER', 0);
