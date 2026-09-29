-- ADMINISTRATION DE L'ORGANISME DE FORMATION (Pilote académie, 29/09/2026) :
-- formateurs, salles, planning, émargement signé, documents et signatures,
-- facturation des clients, BPF. Additive et rejouable : aucune colonne
-- existante n'est modifiée, aucune donnée n'est supprimée.

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StatutFormateur" AS ENUM ('INTERNE', 'EXTERNE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "TypeDocumentSession" AS ENUM ('CONVENTION', 'CONTRAT', 'CONVOCATION', 'PROGRAMME', 'ATTESTATION', 'CERTIFICAT_REALISATION', 'EMARGEMENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StatutDocumentSession" AS ENUM ('PRODUIT', 'ENVOYE', 'A_SIGNER', 'SIGNE', 'REFUSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "TypeFactureOrganisme" AS ENUM ('FACTURE', 'AVOIR', 'DEVIS'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StatutFactureOrganisme" AS ENUM ('BROUILLON', 'EMISE', 'PAYEE', 'ANNULEE', 'ACCEPTE', 'REFUSE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "NatureAction" AS ENUM ('ACTION_FORMATION', 'BILAN_COMPETENCES', 'VAE', 'APPRENTISSAGE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ObjectifBpf" AS ENUM ('RNCP_6_8', 'RNCP_5', 'RNCP_4', 'RNCP_3', 'RNCP_2', 'CQP_SANS_NIVEAU', 'RS', 'CQP_NON_ENREGISTRE', 'AUTRE', 'BILAN', 'VAE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ModaliteSession" AS ENUM ('PRESENTIEL', 'DISTANCIEL', 'MIXTE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "SousTraitance" AS ENUM ('AUCUNE', 'RECUE', 'CONFIEE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "TypeStagiaire" AS ENUM ('SALARIE_PRIVE', 'APPRENTI', 'DEMANDEUR_EMPLOI', 'PARTICULIER', 'AUTRE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "OrigineFinancement" AS ENUM ('ENTREPRISE', 'OPCO_APPRENTISSAGE', 'OPCO_PROFESSIONNALISATION', 'OPCO_PRO_A', 'OPCO_TRANSITION', 'OPCO_CPF', 'OPCO_DEMANDEURS', 'OPCO_NON_SALARIES', 'OPCO_PLAN', 'PUBLICS_AGENTS', 'EUROPE', 'ETAT', 'REGION', 'FRANCE_TRAVAIL', 'AUTRES_PUBLICS', 'PARTICULIER', 'AUTRE_ORGANISME', 'AUTRES'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "codeCertification" TEXT,
ADD COLUMN IF NOT EXISTS "codeNsf" TEXT,
ADD COLUMN IF NOT EXISTS "natureAction" "NatureAction" NOT NULL DEFAULT 'ACTION_FORMATION',
ADD COLUMN IF NOT EXISTS "objectifBpf" "ObjectifBpf" NOT NULL DEFAULT 'AUTRE';

-- AlterTable
ALTER TABLE "FormationSession" ADD COLUMN IF NOT EXISTS "convocationsAuto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "delaiFroidJours" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS "dureeHeures" DECIMAL(7,2),
ADD COLUMN IF NOT EXISTS "enquetesAuto" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "formateurOrganismeId" TEXT,
ADD COLUMN IF NOT EXISTS "infosPratiques" TEXT,
ADD COLUMN IF NOT EXISTS "intra" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "modalite" "ModaliteSession" NOT NULL DEFAULT 'PRESENTIEL',
ADD COLUMN IF NOT EXISTS "organismePartenaire" TEXT,
ADD COLUMN IF NOT EXISTS "salleId" TEXT,
ADD COLUMN IF NOT EXISTS "sousTraitance" "SousTraitance" NOT NULL DEFAULT 'AUCUNE',
ADD COLUMN IF NOT EXISTS "tauxDistanciel" INTEGER;

-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "abandonLe" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "convocationEnvoyeeLe" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "entrepriseAdresse" TEXT,
ADD COLUMN IF NOT EXISTS "entrepriseContact" TEXT,
ADD COLUMN IF NOT EXISTS "entrepriseEmail" TEXT,
ADD COLUMN IF NOT EXISTS "entrepriseNom" TEXT,
ADD COLUMN IF NOT EXISTS "entrepriseSiret" TEXT,
ADD COLUMN IF NOT EXISTS "evaluationChaudDetail" JSONB,
ADD COLUMN IF NOT EXISTS "evaluationCommanditaire" JSONB,
ADD COLUMN IF NOT EXISTS "evaluationFroidDetail" JSONB,
ADD COLUMN IF NOT EXISTS "financeurNom" TEXT,
ADD COLUMN IF NOT EXISTS "jetonCommanditaire" TEXT,
ADD COLUMN IF NOT EXISTS "jetonStagiaire" TEXT,
ADD COLUMN IF NOT EXISTS "motifAbandon" TEXT,
ADD COLUMN IF NOT EXISTS "numeroDossier" TEXT,
ADD COLUMN IF NOT EXISTS "origineFinancement" "OrigineFinancement",
ADD COLUMN IF NOT EXISTS "positionnementEntree" JSONB,
ADD COLUMN IF NOT EXISTS "positionnementSortie" JSONB,
ADD COLUMN IF NOT EXISTS "prixHt" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "telephone" TEXT,
ADD COLUMN IF NOT EXISTS "typeStagiaire" "TypeStagiaire" NOT NULL DEFAULT 'SALARIE_PRIVE';

-- AlterTable
ALTER TABLE "Emargement" ADD COLUMN IF NOT EXISTS "signatureEmpreinte" TEXT,
ADD COLUMN IF NOT EXISTS "signatureIp" TEXT,
ADD COLUMN IF NOT EXISTS "signatureTrace" TEXT,
ADD COLUMN IF NOT EXISTS "signatureUa" TEXT,
ADD COLUMN IF NOT EXISTS "signeParStagiaireLe" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Academie" ADD COLUMN IF NOT EXISTS "coordonneesBancaires" TEXT,
ADD COLUMN IF NOT EXISTS "delaiPaiementJours" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS "exonereTva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "numeroTva" TEXT,
ADD COLUMN IF NOT EXISTS "reglementInterieurUrl" TEXT,
ADD COLUMN IF NOT EXISTS "representantNom" TEXT,
ADD COLUMN IF NOT EXISTS "representantQualite" TEXT,
ADD COLUMN IF NOT EXISTS "tauxTva" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE IF NOT EXISTS "FormateurOrganisme" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "statut" "StatutFormateur" NOT NULL DEFAULT 'INTERNE',
    "structure" TEXT,
    "siret" TEXT,
    "metier" TEXT,
    "competences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diplomes" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormateurOrganisme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SalleOrganisme" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "capacite" INTEGER,
    "accessiblePmr" BOOLEAN NOT NULL DEFAULT false,
    "equipements" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalleOrganisme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CreneauSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "intitule" TEXT,
    "formateurId" TEXT,
    "salleId" TEXT,
    "distanciel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreneauSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SeanceEmargement" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "slotDate" TIMESTAMP(3) NOT NULL,
    "slot" "EmargementSlot" NOT NULL,
    "code" TEXT NOT NULL,
    "ouverteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fermeeLe" TIMESTAMP(3),
    "formateurNom" TEXT,
    "formateurTrace" TEXT,
    "formateurSigneLe" TIMESTAMP(3),
    "formateurIp" TEXT,

    CONSTRAINT "SeanceEmargement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DocumentSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "type" "TypeDocumentSession" NOT NULL,
    "titre" TEXT NOT NULL,
    "empreinte" TEXT,
    "envoyeLe" TIMESTAMP(3),
    "envoyeA" TEXT,
    "jetonSignature" TEXT,
    "signataireNom" TEXT,
    "signataireEmail" TEXT,
    "codeHache" TEXT,
    "codeExpireLe" TIMESTAMP(3),
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutDocumentSession" NOT NULL DEFAULT 'PRODUIT',
    "signeLe" TIMESTAMP(3),
    "signeIp" TEXT,
    "signeUa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FactureOrganisme" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "TypeFactureOrganisme" NOT NULL DEFAULT 'FACTURE',
    "statut" "StatutFactureOrganisme" NOT NULL DEFAULT 'BROUILLON',
    "numero" TEXT,
    "sessionId" TEXT,
    "inscriptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client" JSONB NOT NULL,
    "origineBpf" "OrigineFinancement",
    "numeroDossier" TEXT,
    "referenceClient" TEXT,
    "lignes" JSONB NOT NULL,
    "totalHt" DECIMAL(12,2) NOT NULL,
    "totalTva" DECIMAL(12,2) NOT NULL,
    "totalTtc" DECIMAL(12,2) NOT NULL,
    "mentionTva" TEXT,
    "dateEmission" TIMESTAMP(3),
    "echeance" TIMESTAMP(3),
    "conditions" TEXT,
    "montantPaye" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payeeLe" TIMESTAMP(3),
    "relancesActives" BOOLEAN NOT NULL DEFAULT true,
    "relances" INTEGER NOT NULL DEFAULT 0,
    "derniereRelanceLe" TIMESTAMP(3),
    "factureOrigineId" TEXT,
    "devisId" TEXT,
    "emetteur" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactureOrganisme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompteurNumerotation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "dernier" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompteurNumerotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BpfExercice" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "saisies" JSONB NOT NULL DEFAULT '{}',
    "deposeLe" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BpfExercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ActionAutoSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionAutoSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FormateurOrganisme_accountId_actif_idx" ON "FormateurOrganisme"("accountId", "actif");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SalleOrganisme_accountId_actif_idx" ON "SalleOrganisme"("accountId", "actif");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreneauSession_sessionId_debut_idx" ON "CreneauSession"("sessionId", "debut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreneauSession_formateurId_debut_idx" ON "CreneauSession"("formateurId", "debut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CreneauSession_salleId_debut_idx" ON "CreneauSession"("salleId", "debut");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SeanceEmargement_sessionId_slotDate_slot_key" ON "SeanceEmargement"("sessionId", "slotDate", "slot");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentSession_jetonSignature_key" ON "DocumentSession"("jetonSignature");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentSession_accountId_sessionId_idx" ON "DocumentSession"("accountId", "sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentSession_inscriptionId_idx" ON "DocumentSession"("inscriptionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FactureOrganisme_accountId_type_statut_idx" ON "FactureOrganisme"("accountId", "type", "statut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FactureOrganisme_sessionId_idx" ON "FactureOrganisme"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FactureOrganisme_accountId_numero_key" ON "FactureOrganisme"("accountId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompteurNumerotation_accountId_serie_key" ON "CompteurNumerotation"("accountId", "serie");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BpfExercice_accountId_annee_key" ON "BpfExercice"("accountId", "annee");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ActionAutoSession_cle_key" ON "ActionAutoSession"("cle");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionAutoSession_accountId_createdAt_idx" ON "ActionAutoSession"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Inscription_jetonStagiaire_key" ON "Inscription"("jetonStagiaire");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Inscription_jetonCommanditaire_key" ON "Inscription"("jetonCommanditaire");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "FormationSession" ADD CONSTRAINT "FormationSession_formateurOrganismeId_fkey" FOREIGN KEY ("formateurOrganismeId") REFERENCES "FormateurOrganisme"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "FormationSession" ADD CONSTRAINT "FormationSession_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "SalleOrganisme"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "FormateurOrganisme" ADD CONSTRAINT "FormateurOrganisme_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "SalleOrganisme" ADD CONSTRAINT "SalleOrganisme_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "CreneauSession" ADD CONSTRAINT "CreneauSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FormationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "CreneauSession" ADD CONSTRAINT "CreneauSession_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "FormateurOrganisme"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "CreneauSession" ADD CONSTRAINT "CreneauSession_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "SalleOrganisme"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "SeanceEmargement" ADD CONSTRAINT "SeanceEmargement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FormationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "DocumentSession" ADD CONSTRAINT "DocumentSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "DocumentSession" ADD CONSTRAINT "DocumentSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FormationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "FactureOrganisme" ADD CONSTRAINT "FactureOrganisme_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "FactureOrganisme" ADD CONSTRAINT "FactureOrganisme_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FormationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "CompteurNumerotation" ADD CONSTRAINT "CompteurNumerotation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

