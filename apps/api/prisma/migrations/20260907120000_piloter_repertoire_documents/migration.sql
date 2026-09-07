-- Piloter mon association : le projet en une page, la vie statutaire,
-- le budget prévu/réalisé des dossiers, le répertoire et les documents.

ALTER TABLE "Organisation"
  ADD COLUMN "projetPourQui" TEXT,
  ADD COLUMN "projetQuoi" TEXT,
  ADD COLUMN "projetComment" TEXT,
  ADD COLUMN "projetApres" TEXT,
  ADD COLUMN "projetDemande" TEXT,
  ADD COLUMN "dateDerniereAG" TIMESTAMP(3),
  ADD COLUMN "dureeMandatMois" INTEGER NOT NULL DEFAULT 12;

ALTER TABLE "DossierFinancement"
  ADD COLUMN "budgetPrevu" JSONB,
  ADD COLUMN "budgetRealise" JSONB,
  ADD COLUMN "bilanAction" TEXT,
  ADD COLUMN "nombreBeneficiaires" INTEGER;

CREATE TYPE "RoleContact" AS ENUM ('PRESIDENT', 'TRESORIER', 'SECRETAIRE', 'MEMBRE_BUREAU', 'MEMBRE', 'BENEVOLE', 'SALARIE', 'PARTENAIRE', 'FINANCEUR', 'ELU', 'AUTRE');

CREATE TABLE "ContactAssociation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "structure" TEXT,
    "roles" "RoleContact"[] DEFAULT ARRAY[]::"RoleContact"[],
    "dateAdhesion" TIMESTAMP(3),
    "cotisationAJour" BOOLEAN NOT NULL DEFAULT false,
    "mandatDebut" TIMESTAMP(3),
    "mandatFin" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactAssociation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentAssociation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "categorie" TEXT,
    "fileId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAssociation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactAssociation_organisationId_idx" ON "ContactAssociation"("organisationId");
CREATE INDEX "DocumentAssociation_organisationId_idx" ON "DocumentAssociation"("organisationId");

ALTER TABLE "ContactAssociation" ADD CONSTRAINT "ContactAssociation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAssociation" ADD CONSTRAINT "DocumentAssociation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentAssociation" ADD CONSTRAINT "DocumentAssociation_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
