-- PROSPECTS ET FINANCEMENTS (Pilote académie, 01/10/2026) : prises en charge
-- par un financeur (OPCO, France Travail, CPF…) avec leur checklist de pièces,
-- et un CRM commercial court. Additive et rejouable : aucune colonne
-- existante n'est modifiée, aucune donnée n'est supprimée.
-- SQL produit par `prisma migrate diff`, rendu idempotent.

-- CreateEnum
DO $$ BEGIN CREATE TYPE "TypeFinanceur" AS ENUM ('OPCO', 'FRANCE_TRAVAIL', 'CPF', 'ENTREPRISE', 'REGION', 'AUTRE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StatutPriseEnCharge" AS ENUM ('A_DEPOSER', 'DEPOSE', 'ACCORDE', 'REFUSE', 'EN_FORMATION', 'A_FACTURER', 'FACTURE', 'PAYE', 'ANNULE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "EtapeProspect" AS ENUM ('NOUVEAU', 'CONTACTE', 'DEVIS_ENVOYE', 'GAGNE', 'PERDU'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PriseEnCharge" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sessionId" TEXT,
    "entrepriseNom" TEXT NOT NULL,
    "entrepriseSiret" TEXT,
    "contactNom" TEXT,
    "contactEmail" TEXT,
    "financeur" "TypeFinanceur" NOT NULL DEFAULT 'OPCO',
    "nomFinanceur" TEXT,
    "numeroDossier" TEXT,
    "nbStagiaires" INTEGER NOT NULL DEFAULT 1,
    "heures" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "tarifHoraireCents" INTEGER NOT NULL DEFAULT 0,
    "montantDemandeCents" INTEGER NOT NULL DEFAULT 0,
    "montantAccordeCents" INTEGER,
    "salairesRembourses" BOOLEAN,
    "subrogation" BOOLEAN NOT NULL DEFAULT false,
    "dateDebutFormation" TIMESTAMP(3),
    "dateLimiteDepot" TIMESTAMP(3),
    "dateDepot" TIMESTAMP(3),
    "dateAccord" TIMESTAMP(3),
    "dateFinFormation" TIMESTAMP(3),
    "dateFacturation" TIMESTAMP(3),
    "datePaiement" TIMESTAMP(3),
    "statut" "StatutPriseEnCharge" NOT NULL DEFAULT 'A_DEPOSER',
    "factureId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriseEnCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PiecePriseEnCharge" (
    "id" TEXT NOT NULL,
    "priseEnChargeId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "libelle" TEXT NOT NULL,
    "cochee" BOOLEAN NOT NULL DEFAULT false,
    "cocheeLe" TIMESTAMP(3),

    CONSTRAINT "PiecePriseEnCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Prospect" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "contactNom" TEXT,
    "contactEmail" TEXT,
    "telephone" TEXT,
    "source" TEXT,
    "besoin" TEXT,
    "montantEstimeCents" INTEGER,
    "etape" "EtapeProspect" NOT NULL DEFAULT 'NOUVEAU',
    "prochaineAction" TEXT,
    "dateProchaineAction" TIMESTAMP(3),
    "notes" TEXT,
    "priseEnChargeId" TEXT,
    "factureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PriseEnCharge_accountId_statut_idx" ON "PriseEnCharge"("accountId", "statut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PriseEnCharge_sessionId_idx" ON "PriseEnCharge"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PriseEnCharge_factureId_idx" ON "PriseEnCharge"("factureId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PiecePriseEnCharge_priseEnChargeId_ordre_idx" ON "PiecePriseEnCharge"("priseEnChargeId", "ordre");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prospect_accountId_etape_idx" ON "Prospect"("accountId", "etape");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prospect_priseEnChargeId_idx" ON "Prospect"("priseEnChargeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prospect_factureId_idx" ON "Prospect"("factureId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "PriseEnCharge" ADD CONSTRAINT "PriseEnCharge_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "PriseEnCharge" ADD CONSTRAINT "PriseEnCharge_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FormationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "PriseEnCharge" ADD CONSTRAINT "PriseEnCharge_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "FactureOrganisme"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "PiecePriseEnCharge" ADD CONSTRAINT "PiecePriseEnCharge_priseEnChargeId_fkey" FOREIGN KEY ("priseEnChargeId") REFERENCES "PriseEnCharge"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_priseEnChargeId_fkey" FOREIGN KEY ("priseEnChargeId") REFERENCES "PriseEnCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "FactureOrganisme"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

