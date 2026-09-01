-- prisma/migrations/20260831194500_vehicle_image_requests/migration.sql
CREATE TABLE "VehicleImageRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "bodyStyle" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "lighting" TEXT NOT NULL,
    "weather" TEXT NOT NULL,
    "imageStyle" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "details" TEXT,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resultPath" TEXT,
    "resultUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleImageRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VehicleImageRequest_vehicleId_createdAt_idx" ON "VehicleImageRequest"("vehicleId", "createdAt");
CREATE INDEX "VehicleImageRequest_vehicleId_status_idx" ON "VehicleImageRequest"("vehicleId", "status");
