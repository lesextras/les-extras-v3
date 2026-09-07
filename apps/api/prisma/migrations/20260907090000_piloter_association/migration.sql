-- Piloter mon association (association.toulali.fr) : type de compte,
-- organisation, classeur de pièces, dossiers de financement.

ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'ASSOCIATION';

CREATE TYPE "NiveauOrganisation" AS ENUM ('PETITE', 'GESTIONNAIRE', 'RESEAU');
CREATE TYPE "EtatPiece" AS ENUM ('A_FOURNIR', 'DEDUITE', 'PRESENTE');
CREATE TYPE "EtatDossier" AS ENUM ('REPERE', 'EN_ECRITURE', 'DEPOSE', 'ACCORDE', 'REFUSE', 'SOLDE');

CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sigle" TEXT,
    "rna" TEXT,
    "siren" TEXT,
    "siret" TEXT,
    "natureJuridique" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "commune" TEXT,
    "dateCreation" TIMESTAMP(3),
    "niveau" "NiveauOrganisation" NOT NULL DEFAULT 'PETITE',
    "moisClotureExercice" INTEGER NOT NULL DEFAULT 12,
    "etapesFaites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PieceAssociation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "etat" "EtatPiece" NOT NULL DEFAULT 'A_FOURNIR',
    "preuve" TEXT,
    "fileId" TEXT,
    "dateEmission" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "exercice" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PieceAssociation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DossierFinancement" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "dispositifCode" TEXT,
    "financeur" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "etat" "EtatDossier" NOT NULL DEFAULT 'REPERE',
    "montantDemande" DECIMAL(12,2),
    "montantAccorde" DECIMAL(12,2),
    "dateLimiteDepot" TIMESTAMP(3),
    "dateDepot" TIMESTAMP(3),
    "dateDecision" TIMESTAMP(3),
    "dateCompteRendu" TIMESTAMP(3),
    "piecesExigees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierFinancement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organisation_accountId_key" ON "Organisation"("accountId");
CREATE INDEX "Organisation_siren_idx" ON "Organisation"("siren");
CREATE INDEX "Organisation_rna_idx" ON "Organisation"("rna");
CREATE UNIQUE INDEX "PieceAssociation_organisationId_typeCode_key" ON "PieceAssociation"("organisationId", "typeCode");
CREATE INDEX "PieceAssociation_organisationId_dateExpiration_idx" ON "PieceAssociation"("organisationId", "dateExpiration");
CREATE INDEX "DossierFinancement_organisationId_etat_idx" ON "DossierFinancement"("organisationId", "etat");
CREATE INDEX "DossierFinancement_organisationId_dateLimiteDepot_idx" ON "DossierFinancement"("organisationId", "dateLimiteDepot");

ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PieceAssociation" ADD CONSTRAINT "PieceAssociation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PieceAssociation" ADD CONSTRAINT "PieceAssociation_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DossierFinancement" ADD CONSTRAINT "DossierFinancement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
