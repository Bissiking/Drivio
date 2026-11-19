-- Additive account preferences. Existing records and visual preferences are preserved.
ALTER TABLE "User" ADD COLUMN "homePage" TEXT NOT NULL DEFAULT 'auto' CHECK ("homePage" IN ('auto', 'dashboard', 'add'));
ALTER TABLE "User" ADD COLUMN "interfaceStyle" TEXT NOT NULL DEFAULT 'classic' CHECK ("interfaceStyle" IN ('classic', 'horizon'));
