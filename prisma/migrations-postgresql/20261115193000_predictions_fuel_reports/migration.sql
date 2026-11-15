-- prisma/migrations-postgresql/20261115193000_predictions_fuel_reports/migration.sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoFuelDesktop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoFuelMobile" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MaintenanceSchedule" ADD COLUMN     "estimatedCost" DECIMAL(65,30),
ADD COLUMN     "provenance" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "FuelEntry" ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "stationId" TEXT;

-- AlterTable
ALTER TABLE "TireSet" ADD COLUMN     "replacementCost" DECIMAL(65,30),
ADD COLUMN     "targetDepthMm" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "TireMeasurement" (
    "id" TEXT NOT NULL,
    "tireSetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER NOT NULL,
    "treadDepthMm" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TireMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelPromptClaim" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPromptClaim_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "FuelStation" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "searchText" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "missingSince" TIMESTAMP(3),
    "fingerprint" TEXT NOT NULL,
    "availabilityUncertain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FuelStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelPrice" (
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "declaredAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FuelPrice_pkey" PRIMARY KEY ("stationId","fuelId")
);

-- CreateTable
CREATE TABLE "FuelPriceHistory" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "declaredAt" TIMESTAMP(3) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelOutage" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "fuelId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "endSource" TEXT,

    CONSTRAINT "FuelOutage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelSyncState" (
    "id" TEXT NOT NULL,
    "leaseOwner" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NEVER',
    "snapshotHash" TEXT,
    "stationCount" INTEGER NOT NULL DEFAULT 0,
    "statsJson" TEXT,
    "error" TEXT,

    CONSTRAINT "FuelSyncState_pkey" PRIMARY KEY ("id")
);

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

-- AddForeignKey
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireMeasurement" ADD CONSTRAINT "TireMeasurement_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPromptClaim" ADD CONSTRAINT "FuelPromptClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPrice" ADD CONSTRAINT "FuelPrice_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelPriceHistory" ADD CONSTRAINT "FuelPriceHistory_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelOutage" ADD CONSTRAINT "FuelOutage_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "FuelStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "FuelSyncState" ("id", "status", "stationCount") VALUES ('fuel-prices-sync', 'NEVER', 0);
