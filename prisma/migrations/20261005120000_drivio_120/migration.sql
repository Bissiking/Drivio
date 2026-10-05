-- DropIndex
DROP INDEX "VehicleImageRequest_vehicleId_createdAt_idx";

-- DropIndex
DROP INDEX "VehicleImageRequest_vehicleId_status_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VehicleImageRequest";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "maxMileage" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Warranty_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TechnicalInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "nextDate" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpDeadline" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TechnicalInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contractReference" TEXT,
    "startDate" DATETIME NOT NULL,
    "renewalDate" DATETIME NOT NULL,
    "cost" DECIMAL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "includeInCosts" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsurancePolicy_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TireSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "dimensions" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "mountedAt" DATETIME NOT NULL,
    "mountedMileage" INTEGER NOT NULL,
    "removedAt" DATETIME,
    "removedMileage" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TireSet_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenance" BOOLEAN NOT NULL DEFAULT true,
    "warranty" BOOLEAN NOT NULL DEFAULT true,
    "inspection" BOOLEAN NOT NULL DEFAULT true,
    "insurance" BOOLEAN NOT NULL DEFAULT true,
    "warningDays" INTEGER NOT NULL DEFAULT 30,
    "warningKm" INTEGER NOT NULL DEFAULT 1500,
    "tokenEncrypted" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sentAt" DATETIME,
    "claimedAt" DATETIME,
    CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MileageReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "isCorrection" BOOLEAN NOT NULL DEFAULT false,
    "distanceFromPrevious" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MileageReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MileageReading" ("comment", "createdAt", "date", "distanceFromPrevious", "id", "isCorrection", "mileage", "updatedAt", "vehicleId") SELECT "comment", "createdAt", "date", "distanceFromPrevious", "id", "isCorrection", "mileage", "updatedAt", "vehicleId" FROM "MileageReading";
DROP TABLE "MileageReading";
ALTER TABLE "new_MileageReading" RENAME TO "MileageReading";
CREATE INDEX "MileageReading_vehicleId_date_idx" ON "MileageReading"("vehicleId", "date");
CREATE INDEX "MileageReading_vehicleId_mileage_idx" ON "MileageReading"("vehicleId", "mileage");
CREATE TABLE "new_Expense" (
    "fuelEntryId" TEXT,
    "maintenanceRecordId" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "mileage" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_fuelEntryId_fkey" FOREIGN KEY ("fuelEntryId") REFERENCES "FuelEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "category", "comment", "createdAt", "date", "id", "mileage", "updatedAt", "vehicleId") SELECT "amount", "category", "comment", "createdAt", "date", "id", "mileage", "updatedAt", "vehicleId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE UNIQUE INDEX "Expense_fuelEntryId_key" ON "Expense"("fuelEntryId");
CREATE UNIQUE INDEX "Expense_maintenanceRecordId_key" ON "Expense"("maintenanceRecordId");
CREATE INDEX "Expense_vehicleId_date_idx" ON "Expense"("vehicleId", "date");
CREATE INDEX "Expense_vehicleId_category_idx" ON "Expense"("vehicleId", "category");
CREATE TABLE "new_FuelEntry" (
    "mileageReadingId" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mileage" INTEGER NOT NULL,
    "liters" DECIMAL NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "isFull" BOOLEAN NOT NULL DEFAULT true,
    "distanceSincePrevious" INTEGER,
    "consumptionPer100Km" DECIMAL,
    "costPer100Km" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelEntry_mileageReadingId_fkey" FOREIGN KEY ("mileageReadingId") REFERENCES "MileageReading" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FuelEntry" ("consumptionPer100Km", "costPer100Km", "createdAt", "date", "distanceSincePrevious", "id", "isFull", "liters", "mileage", "totalPrice", "unitPrice", "updatedAt", "vehicleId") SELECT "consumptionPer100Km", "costPer100Km", "createdAt", "date", "distanceSincePrevious", "id", "isFull", "liters", "mileage", "totalPrice", "unitPrice", "updatedAt", "vehicleId" FROM "FuelEntry";
DROP TABLE "FuelEntry";
ALTER TABLE "new_FuelEntry" RENAME TO "FuelEntry";
CREATE INDEX "FuelEntry_vehicleId_date_idx" ON "FuelEntry"("vehicleId", "date");
CREATE INDEX "FuelEntry_vehicleId_mileage_idx" ON "FuelEntry"("vehicleId", "mileage");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Warranty_vehicleId_endDate_idx" ON "Warranty"("vehicleId", "endDate");

-- CreateIndex
CREATE INDEX "TechnicalInspection_vehicleId_date_idx" ON "TechnicalInspection"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "InsurancePolicy_vehicleId_startDate_idx" ON "InsurancePolicy"("vehicleId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDocument_storageKey_key" ON "VehicleDocument"("storageKey");

-- CreateIndex
CREATE INDEX "VehicleDocument_vehicleId_date_idx" ON "VehicleDocument"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "TireSet_vehicleId_mountedAt_idx" ON "TireSet"("vehicleId", "mountedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_userId_key_key" ON "NotificationDelivery"("userId", "key");

-- Individual notification preferences, with all supported types enabled by default.
ALTER TABLE "NotificationSettings" ADD COLUMN "enabledTypes" TEXT NOT NULL DEFAULT 'maintenanceSoon,maintenanceOverdue,maintenanceMileage,warrantySoon,warrantyExpired,inspectionSoon,inspectionOverdue,insurance';
