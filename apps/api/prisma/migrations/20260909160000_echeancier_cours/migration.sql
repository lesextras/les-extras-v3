-- REGLEMENT EN PLUSIEURS FOIS.
--
-- Idempotente : le conteneur rejoue les migrations au demarrage.
--
-- `echeancesPayees` vaut 1 par defaut, y compris sur les lignes existantes :
-- une vente deja enregistree a bien ete encaissee une fois, en totalite.
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "montantTotalCents"  INTEGER;
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "echeances"          INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "echeancesPayees"    INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "stripeAbonnementId" TEXT;
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "incidentAt"         TIMESTAMP(3);
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "incidentMotif"      TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "VenteCours_stripeAbonnementId_key"
  ON "VenteCours"("stripeAbonnementId");
