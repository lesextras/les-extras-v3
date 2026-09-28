-- MES FACTURES (Pilote), 28/09/2026. Additive et rejouable.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutFactureFournisseur') THEN
    CREATE TYPE "StatutFactureFournisseur" AS ENUM ('A_VERIFIER', 'VALIDEE', 'PAYEE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AbonnementFactures" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "statut" TEXT NOT NULL DEFAULT 'pending',
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "quotaMensuel" INTEGER NOT NULL DEFAULT 100,
  "moisCompteur" TEXT NOT NULL DEFAULT '',
  "luesCeMois" INTEGER NOT NULL DEFAULT 0,
  "finPeriode" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AbonnementFactures_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AbonnementFactures_accountId_key" ON "AbonnementFactures"("accountId");
CREATE UNIQUE INDEX IF NOT EXISTS "AbonnementFactures_stripeSubscriptionId_key" ON "AbonnementFactures"("stripeSubscriptionId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AbonnementFactures_accountId_fkey') THEN
    ALTER TABLE "AbonnementFactures" ADD CONSTRAINT "AbonnementFactures_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "FactureFournisseur" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "fileId" TEXT,
  "fournisseur" TEXT NOT NULL,
  "numero" TEXT,
  "dateFacture" TIMESTAMP(3),
  "dateEcheance" TIMESTAMP(3),
  "montantHT" DECIMAL(12,2),
  "tva" DECIMAL(12,2),
  "montantTTC" DECIMAL(12,2) NOT NULL,
  "devise" TEXT NOT NULL DEFAULT 'EUR',
  "poste" TEXT,
  "lignes" JSONB,
  "statut" "StatutFactureFournisseur" NOT NULL DEFAULT 'A_VERIFIER',
  "alerte" TEXT,
  "variationPct" INTEGER,
  "origine" TEXT NOT NULL DEFAULT 'moteur',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FactureFournisseur_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FactureFournisseur_accountId_dateFacture_idx" ON "FactureFournisseur"("accountId", "dateFacture");
CREATE INDEX IF NOT EXISTS "FactureFournisseur_accountId_fournisseur_idx" ON "FactureFournisseur"("accountId", "fournisseur");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FactureFournisseur_accountId_fkey') THEN
    ALTER TABLE "FactureFournisseur" ADD CONSTRAINT "FactureFournisseur_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
