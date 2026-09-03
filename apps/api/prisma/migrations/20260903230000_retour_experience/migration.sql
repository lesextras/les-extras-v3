-- Enquête de satisfaction après la première mise en ligne.
-- Additive : aucune colonne existante n'est touchée, aucune donnée déplacée.
-- (Le conteneur applique `prisma db push` au démarrage ; ce fichier documente.)

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "enqueteAtelierAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "RetourExperience" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "accountId"   TEXT,
    "source"      TEXT NOT NULL DEFAULT 'PREMIER_ATELIER',
    "noteGlobale" INTEGER NOT NULL,
    "noteSite"    INTEGER,
    "noteDepot"   INTEGER,
    "probleme"    TEXT,
    "commentaire" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RetourExperience_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RetourExperience_createdAt_idx" ON "RetourExperience"("createdAt");
CREATE INDEX IF NOT EXISTS "RetourExperience_accountId_idx" ON "RetourExperience"("accountId");

ALTER TABLE "RetourExperience" ADD CONSTRAINT "RetourExperience_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetourExperience" ADD CONSTRAINT "RetourExperience_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
