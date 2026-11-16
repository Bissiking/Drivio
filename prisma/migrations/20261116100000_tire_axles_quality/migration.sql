-- Preserve historical life assumptions; new automatic estimates use NULL.
ALTER TABLE "Vehicle" ADD COLUMN "drivetrain" TEXT NOT NULL DEFAULT 'UNKNOWN';

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TireSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "dimensions" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "quality" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "mountedAt" DATETIME NOT NULL,
    "mountedMileage" INTEGER NOT NULL,
    "removedAt" DATETIME,
    "removedMileage" INTEGER,
    "notes" TEXT,
    "targetDepthMm" DECIMAL,
    "replacementCost" DECIMAL,
    "estimatedLifeKm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TireSet_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TireSet" ("id", "vehicleId", "brand", "model", "dimensions", "type", "position", "mountedAt", "mountedMileage", "removedAt", "removedMileage", "notes", "targetDepthMm", "replacementCost", "estimatedLifeKm", "createdAt", "updatedAt")
SELECT "id", "vehicleId", "brand", "model", "dimensions", "type", "position", "mountedAt", "mountedMileage", "removedAt", "removedMileage", "notes", "targetDepthMm", "replacementCost", "estimatedLifeKm", "createdAt", "updatedAt" FROM "TireSet";
DROP TABLE "TireSet";
ALTER TABLE "new_TireSet" RENAME TO "TireSet";
CREATE INDEX "TireSet_vehicleId_mountedAt_idx" ON "TireSet"("vehicleId", "mountedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
