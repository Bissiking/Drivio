-- prisma/migrations/20260831173755_init/migration.sql
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kyrosSubject" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT NOT NULL,
    "powertrain" TEXT,
    "year" INTEGER NOT NULL,
    "registration" TEXT,
    "vin" TEXT,
    "purchaseDate" DATETIME NOT NULL,
    "purchaseMileage" INTEGER NOT NULL,
    "purchasePrice" DECIMAL,
    "saleDate" DATETIME,
    "finalMileage" INTEGER,
    "salePrice" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "photoPath" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MileageReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "comment" TEXT,
    "isCorrection" BOOLEAN NOT NULL DEFAULT false,
    "distanceFromPrevious" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MileageReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mileage" INTEGER,
    "cost" DECIMAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME,
    "dueMileage" INTEGER,
    "warningDays" INTEGER NOT NULL DEFAULT 30,
    "warningKm" INTEGER NOT NULL DEFAULT 1500,
    "notes" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "mileage" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelEntry" (
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
    CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_kyrosSubject_key" ON "User"("kyrosSubject");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Vehicle_userId_status_idx" ON "Vehicle"("userId", "status");

-- CreateIndex
CREATE INDEX "Vehicle_userId_isPrimary_idx" ON "Vehicle"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "MileageReading_vehicleId_date_idx" ON "MileageReading"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "MileageReading_vehicleId_mileage_idx" ON "MileageReading"("vehicleId", "mileage");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_date_idx" ON "MaintenanceRecord"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_type_idx" ON "MaintenanceRecord"("vehicleId", "type");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_vehicleId_completedAt_dueDate_idx" ON "MaintenanceSchedule"("vehicleId", "completedAt", "dueDate");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_vehicleId_completedAt_dueMileage_idx" ON "MaintenanceSchedule"("vehicleId", "completedAt", "dueMileage");

-- CreateIndex
CREATE INDEX "Expense_vehicleId_date_idx" ON "Expense"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Expense_vehicleId_category_idx" ON "Expense"("vehicleId", "category");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_date_idx" ON "FuelEntry"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_mileage_idx" ON "FuelEntry"("vehicleId", "mileage");
