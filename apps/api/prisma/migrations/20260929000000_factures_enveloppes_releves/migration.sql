-- MES FACTURES, suite (28/09/2026 soir) : enveloppes, fiches fournisseurs, relevés bancaires,
-- validation à deux, notes de frais, journal, réglages. Additive et rejouable.
-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypeEnveloppe') THEN
    CREATE TYPE "TypeEnveloppe" AS ENUM ('SUBVENTION', 'PROJET', 'FONDS_PROPRES', 'SESSION', 'AUTRE');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutNoteDeFrais') THEN
    CREATE TYPE "StatutNoteDeFrais" AS ENUM ('A_VALIDER', 'VALIDEE', 'REMBOURSEE', 'ABANDONNEE', 'REFUSEE');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "FactureFournisseur" ADD COLUMN IF NOT EXISTS "enveloppeId" TEXT,
ADD COLUMN IF NOT EXISTS "fournisseurId" TEXT,
ADD COLUMN IF NOT EXISTS "ibanEmpreinte" TEXT,
ADD COLUMN IF NOT EXISTS "ibanFin" TEXT,
ADD COLUMN IF NOT EXISTS "siret" TEXT,
ADD COLUMN IF NOT EXISTS "verification" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EnveloppeFactures" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeEnveloppe" NOT NULL DEFAULT 'SUBVENTION',
    "financeur" TEXT,
    "montantAccorde" DECIMAL(12,2),
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "dateJustification" TIMESTAMP(3),
    "dossierId" TEXT,
    "actionId" TEXT,
    "coursId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnveloppeFactures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FournisseurPilote" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomNormalise" TEXT NOT NULL,
    "siret" TEXT,
    "ibanEmpreinte" TEXT,
    "ibanFin" TEXT,
    "annuaire" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FournisseurPilote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReleveBancaire" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "fileId" TEXT,
    "libelle" TEXT NOT NULL,
    "periodeDebut" TIMESTAMP(3),
    "periodeFin" TIMESTAMP(3),
    "soldeDebut" DECIMAL(12,2),
    "soldeFin" DECIMAL(12,2),
    "nbOperations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleveBancaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OperationBancaire" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "releveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "poste" TEXT,
    "sens" TEXT NOT NULL,
    "factureId" TEXT,
    "enveloppeId" TEXT,
    "rapprochement" TEXT,
    "empreinte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationBancaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ValidationFacture" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationFacture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NoteDeFrais" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT,
    "beneficiaire" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "objet" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "poste" TEXT,
    "fileId" TEXT,
    "statut" "StatutNoteDeFrais" NOT NULL DEFAULT 'A_VALIDER',
    "abandon" BOOLEAN NOT NULL DEFAULT false,
    "recuNumero" TEXT,
    "enveloppeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteDeFrais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JournalFactures" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "cible" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalFactures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReglagesFactures" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "seuilDoubleValidation" DECIMAL(12,2),
    "jetonDepot" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReglagesFactures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EnveloppeFactures_accountId_type_idx" ON "EnveloppeFactures"("accountId", "type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FournisseurPilote_accountId_nomNormalise_key" ON "FournisseurPilote"("accountId", "nomNormalise");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReleveBancaire_accountId_createdAt_idx" ON "ReleveBancaire"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OperationBancaire_accountId_date_idx" ON "OperationBancaire"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OperationBancaire_accountId_empreinte_key" ON "OperationBancaire"("accountId", "empreinte");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ValidationFacture_factureId_userId_key" ON "ValidationFacture"("factureId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NoteDeFrais_accountId_date_idx" ON "NoteDeFrais"("accountId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JournalFactures_accountId_createdAt_idx" ON "JournalFactures"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReglagesFactures_accountId_key" ON "ReglagesFactures"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReglagesFactures_jetonDepot_key" ON "ReglagesFactures"("jetonDepot");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FactureFournisseur_accountId_enveloppeId_idx" ON "FactureFournisseur"("accountId", "enveloppeId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FactureFournisseur_enveloppeId_fkey') THEN
    ALTER TABLE "FactureFournisseur" ADD CONSTRAINT "FactureFournisseur_enveloppeId_fkey" FOREIGN KEY ("enveloppeId") REFERENCES "EnveloppeFactures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FactureFournisseur_fournisseurId_fkey') THEN
    ALTER TABLE "FactureFournisseur" ADD CONSTRAINT "FactureFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "FournisseurPilote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EnveloppeFactures_accountId_fkey') THEN
    ALTER TABLE "EnveloppeFactures" ADD CONSTRAINT "EnveloppeFactures_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FournisseurPilote_accountId_fkey') THEN
    ALTER TABLE "FournisseurPilote" ADD CONSTRAINT "FournisseurPilote_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReleveBancaire_accountId_fkey') THEN
    ALTER TABLE "ReleveBancaire" ADD CONSTRAINT "ReleveBancaire_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationBancaire_accountId_fkey') THEN
    ALTER TABLE "OperationBancaire" ADD CONSTRAINT "OperationBancaire_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationBancaire_releveId_fkey') THEN
    ALTER TABLE "OperationBancaire" ADD CONSTRAINT "OperationBancaire_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "ReleveBancaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationBancaire_factureId_fkey') THEN
    ALTER TABLE "OperationBancaire" ADD CONSTRAINT "OperationBancaire_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "FactureFournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationBancaire_enveloppeId_fkey') THEN
    ALTER TABLE "OperationBancaire" ADD CONSTRAINT "OperationBancaire_enveloppeId_fkey" FOREIGN KEY ("enveloppeId") REFERENCES "EnveloppeFactures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ValidationFacture_factureId_fkey') THEN
    ALTER TABLE "ValidationFacture" ADD CONSTRAINT "ValidationFacture_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "FactureFournisseur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NoteDeFrais_accountId_fkey') THEN
    ALTER TABLE "NoteDeFrais" ADD CONSTRAINT "NoteDeFrais_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NoteDeFrais_enveloppeId_fkey') THEN
    ALTER TABLE "NoteDeFrais" ADD CONSTRAINT "NoteDeFrais_enveloppeId_fkey" FOREIGN KEY ("enveloppeId") REFERENCES "EnveloppeFactures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JournalFactures_accountId_fkey') THEN
    ALTER TABLE "JournalFactures" ADD CONSTRAINT "JournalFactures_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReglagesFactures_accountId_fkey') THEN
    ALTER TABLE "ReglagesFactures" ADD CONSTRAINT "ReglagesFactures_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

