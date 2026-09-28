-- MES FACTURES, suite (29/09/2026) : devis fournisseurs, trésorerie prévisionnelle
-- (solde de départ, date de versement des subventions). Additive et rejouable.

-- AlterTable
ALTER TABLE "EnveloppeFactures" ADD COLUMN IF NOT EXISTS "dateVersementPrevu" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReglagesFactures" ADD COLUMN IF NOT EXISTS "soldeBancaire" DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "soldeBancaireAu" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DevisFournisseur" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "fileId" TEXT,
    "fournisseur" TEXT NOT NULL,
    "reference" TEXT,
    "dateDevis" TIMESTAMP(3),
    "dateValidite" TIMESTAMP(3),
    "montantHT" DECIMAL(12,2),
    "tva" DECIMAL(12,2),
    "montantTTC" DECIMAL(12,2) NOT NULL,
    "poste" TEXT,
    "lignes" JSONB,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "factureId" TEXT,
    "ecartPct" INTEGER,
    "alerte" TEXT,
    "origine" TEXT NOT NULL DEFAULT 'moteur',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisFournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DevisFournisseur_factureId_key" ON "DevisFournisseur"("factureId");
CREATE INDEX IF NOT EXISTS "DevisFournisseur_accountId_statut_idx" ON "DevisFournisseur"("accountId", "statut");
CREATE INDEX IF NOT EXISTS "DevisFournisseur_accountId_fournisseur_idx" ON "DevisFournisseur"("accountId", "fournisseur");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DevisFournisseur_accountId_fkey') THEN
    ALTER TABLE "DevisFournisseur" ADD CONSTRAINT "DevisFournisseur_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DevisFournisseur_factureId_fkey') THEN
    ALTER TABLE "DevisFournisseur" ADD CONSTRAINT "DevisFournisseur_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "FactureFournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
