-- prisma/migrations/20261115210000_maintenance_gauges/migration.sql
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "cycleStartDate" DATETIME;
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "cycleStartMileage" INTEGER;
ALTER TABLE "TireSet" ADD COLUMN "estimatedLifeKm" INTEGER NOT NULL DEFAULT 40000;
