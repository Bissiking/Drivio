-- Additive: no vehicle, maintenance, expense or personal-token data changed.
CREATE TABLE "HubAuthorization" (
  "codeHash" TEXT NOT NULL PRIMARY KEY, "nonce" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL, "redirectUri" TEXT NOT NULL, "codeChallenge" TEXT NOT NULL,
  "vehicleIds" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, "consumedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HubAuthorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "HubAuthorization_nonce_key" ON "HubAuthorization"("nonce");
CREATE INDEX "HubAuthorization_expiresAt_idx" ON "HubAuthorization"("expiresAt");
CREATE TABLE "HubApplication" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "clientId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL, "vehicleIds" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL,
  "revokedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HubApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "HubApplication_tokenHash_key" ON "HubApplication"("tokenHash");
CREATE UNIQUE INDEX "HubApplication_userId_clientId_key" ON "HubApplication"("userId", "clientId");
