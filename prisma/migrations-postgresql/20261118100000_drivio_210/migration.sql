-- Additive migration: historical types, records and relationships are preserved.
ALTER TABLE "Expense" ADD COLUMN "subcategory" TEXT;
ALTER TABLE "User" ADD COLUMN "themeMode" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "User" ADD COLUMN "themePalette" TEXT NOT NULL DEFAULT 'copper';
ALTER TABLE "User" ADD COLUMN "hubTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "hubTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_hubTokenHash_key" ON "User"("hubTokenHash");

ALTER TABLE "MaintenanceRecord" ADD COLUMN "category" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN "subcategory" TEXT;
UPDATE "MaintenanceRecord" SET "category" = 'FREINAGE', "subcategory" = CASE WHEN "type" = 'FREINS' THEN NULL ELSE "type" END WHERE "type" IN ('PLAQUETTES', 'DISQUES', 'LIQUIDE_FREIN', 'ETRIERS', 'FREINS');
UPDATE "MaintenanceRecord" SET "category" = 'MOTEUR', "subcategory" = CASE WHEN "type" = 'MOTEUR' THEN NULL ELSE "type" END WHERE "type" IN ('VIDANGE', 'BOUGIES', 'DISTRIBUTION', 'REFROIDISSEMENT', 'MOTEUR');
UPDATE "MaintenanceRecord" SET "category" = 'TRANSMISSION', "subcategory" = CASE WHEN "type" = 'TRANSMISSION' THEN NULL ELSE "type" END WHERE "type" IN ('BOITE_VITESSES', 'EMBRAYAGE', 'HUILE_BOITE', 'TRANSMISSION');
UPDATE "MaintenanceRecord" SET "category" = 'ECHAPPEMENT', "subcategory" = CASE WHEN "type" = 'ECHAPPEMENT' THEN NULL ELSE "type" END WHERE "type" IN ('CATALYSEUR', 'SILENCIEUX', 'LIGNE_ECHAPPEMENT', 'ECHAPPEMENT');
UPDATE "MaintenanceRecord" SET "category" = 'CARROSSERIE', "subcategory" = CASE WHEN "type" = 'CARROSSERIE' THEN NULL ELSE "type" END WHERE "type" IN ('PEINTURE', 'PARE_CHOCS', 'REPARATION_CARROSSERIE', 'CARROSSERIE');
UPDATE "MaintenanceRecord" SET "category" = 'PNEUMATIQUES', "subcategory" = CASE WHEN "type" = 'PNEUS' THEN NULL ELSE "type" END WHERE "type" IN ('REMPLACEMENT_PNEUS', 'EQUILIBRAGE', 'GEOMETRIE', 'PNEUS');
UPDATE "MaintenanceRecord" SET "category" = 'FILTRATION', "subcategory" = CASE WHEN "type" = 'FILTRES' THEN NULL ELSE "type" END WHERE "type" IN ('FILTRE_HUILE', 'FILTRE_AIR', 'FILTRE_HABITACLE', 'FILTRE_CARBURANT', 'FILTRES');
UPDATE "MaintenanceRecord" SET "category" = 'TRAINS_ROULANTS', "subcategory" = CASE WHEN "type" = 'TRAINS_ROULANTS' THEN NULL ELSE "type" END WHERE "type" IN ('SUSPENSION', 'DIRECTION', 'TRAINS_ROULANTS');
UPDATE "MaintenanceRecord" SET "category" = 'ELECTRICITE', "subcategory" = CASE WHEN "type" = 'ELECTRICITE' THEN NULL ELSE "type" END WHERE "type" IN ('BATTERIE', 'ESSUIE_GLACES', 'ECLAIRAGE', 'ELECTRICITE');
UPDATE "MaintenanceRecord" SET "category" = 'CONTROLES', "subcategory" = CASE WHEN "type" = 'CONTROLES' THEN NULL ELSE "type" END WHERE "type" IN ('ENTRETIEN_CONSTRUCTEUR', 'CONTROLE_TECHNIQUE', 'CONTROLES');

ALTER TABLE "MaintenanceSchedule" ADD COLUMN "category" TEXT;
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "subcategory" TEXT;
UPDATE "MaintenanceSchedule" SET "category" = 'FREINAGE', "subcategory" = CASE WHEN "type" = 'FREINS' THEN NULL ELSE "type" END WHERE "type" IN ('PLAQUETTES', 'DISQUES', 'LIQUIDE_FREIN', 'ETRIERS', 'FREINS');
UPDATE "MaintenanceSchedule" SET "category" = 'MOTEUR', "subcategory" = CASE WHEN "type" = 'MOTEUR' THEN NULL ELSE "type" END WHERE "type" IN ('VIDANGE', 'BOUGIES', 'DISTRIBUTION', 'REFROIDISSEMENT', 'MOTEUR');
UPDATE "MaintenanceSchedule" SET "category" = 'TRANSMISSION', "subcategory" = CASE WHEN "type" = 'TRANSMISSION' THEN NULL ELSE "type" END WHERE "type" IN ('BOITE_VITESSES', 'EMBRAYAGE', 'HUILE_BOITE', 'TRANSMISSION');
UPDATE "MaintenanceSchedule" SET "category" = 'ECHAPPEMENT', "subcategory" = CASE WHEN "type" = 'ECHAPPEMENT' THEN NULL ELSE "type" END WHERE "type" IN ('CATALYSEUR', 'SILENCIEUX', 'LIGNE_ECHAPPEMENT', 'ECHAPPEMENT');
UPDATE "MaintenanceSchedule" SET "category" = 'CARROSSERIE', "subcategory" = CASE WHEN "type" = 'CARROSSERIE' THEN NULL ELSE "type" END WHERE "type" IN ('PEINTURE', 'PARE_CHOCS', 'REPARATION_CARROSSERIE', 'CARROSSERIE');
UPDATE "MaintenanceSchedule" SET "category" = 'PNEUMATIQUES', "subcategory" = CASE WHEN "type" = 'PNEUS' THEN NULL ELSE "type" END WHERE "type" IN ('REMPLACEMENT_PNEUS', 'EQUILIBRAGE', 'GEOMETRIE', 'PNEUS');
UPDATE "MaintenanceSchedule" SET "category" = 'FILTRATION', "subcategory" = CASE WHEN "type" = 'FILTRES' THEN NULL ELSE "type" END WHERE "type" IN ('FILTRE_HUILE', 'FILTRE_AIR', 'FILTRE_HABITACLE', 'FILTRE_CARBURANT', 'FILTRES');
UPDATE "MaintenanceSchedule" SET "category" = 'TRAINS_ROULANTS', "subcategory" = CASE WHEN "type" = 'TRAINS_ROULANTS' THEN NULL ELSE "type" END WHERE "type" IN ('SUSPENSION', 'DIRECTION', 'TRAINS_ROULANTS');
UPDATE "MaintenanceSchedule" SET "category" = 'ELECTRICITE', "subcategory" = CASE WHEN "type" = 'ELECTRICITE' THEN NULL ELSE "type" END WHERE "type" IN ('BATTERIE', 'ESSUIE_GLACES', 'ECLAIRAGE', 'ELECTRICITE');
UPDATE "MaintenanceSchedule" SET "category" = 'CONTROLES', "subcategory" = CASE WHEN "type" = 'CONTROLES' THEN NULL ELSE "type" END WHERE "type" IN ('ENTRETIEN_CONSTRUCTEUR', 'CONTROLE_TECHNIQUE', 'CONTROLES');
