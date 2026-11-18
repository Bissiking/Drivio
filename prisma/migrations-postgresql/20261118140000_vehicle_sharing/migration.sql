-- Additive, no change to vehicle ownership or existing facts.
CREATE TABLE "VehicleShare" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "recipientId" TEXT,
  "scope" TEXT NOT NULL DEFAULT 'SIMPLE',
  "permission" TEXT NOT NULL DEFAULT 'READ',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleShare_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VehicleShare_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VehicleShare_scope_check" CHECK ("scope" IN ('SIMPLE', 'COMPLETE')),
  CONSTRAINT "VehicleShare_permission_check" CHECK ("permission" IN ('READ', 'WRITE'))
);
CREATE UNIQUE INDEX "VehicleShare_vehicleId_email_key" ON "VehicleShare"("vehicleId", "email");
CREATE UNIQUE INDEX "VehicleShare_vehicleId_recipientId_key" ON "VehicleShare"("vehicleId", "recipientId");
CREATE INDEX "VehicleShare_recipientId_scope_permission_idx" ON "VehicleShare"("recipientId", "scope", "permission");
CREATE INDEX "VehicleShare_email_acceptedAt_expiresAt_idx" ON "VehicleShare"("email", "acceptedAt", "expiresAt");
