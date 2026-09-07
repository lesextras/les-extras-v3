-- La demande : ce que le financeur demande, l'idée de projet, le plafond.
ALTER TABLE "DossierFinancement" ADD COLUMN "description" TEXT;
ALTER TABLE "DossierFinancement" ADD COLUMN "ideeProjet" TEXT;
ALTER TABLE "DossierFinancement" ADD COLUMN "montantMax" DECIMAL(12,2);

-- La gestion budgétaire : dons, ventes, adhésions, subventions, dépenses.
CREATE TYPE "SensMouvement" AS ENUM ('RECETTE', 'DEPENSE');
CREATE TYPE "NatureMouvement" AS ENUM ('DON', 'ADHESION', 'VENTE', 'BILLETTERIE', 'SUBVENTION', 'MECENAT', 'PRESTATION', 'AUTRE_RECETTE', 'ACHAT', 'MATERIEL', 'LOCAL', 'ASSURANCE', 'DEPLACEMENT', 'COMMUNICATION', 'SALAIRE', 'BANQUE', 'AUTRE_DEPENSE');
CREATE TYPE "MoyenPaiement" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'EN_LIGNE', 'AUTRE');

CREATE TABLE "MouvementAssociation" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sens" "SensMouvement" NOT NULL,
    "nature" "NatureMouvement" NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tiers" TEXT,
    "moyen" "MoyenPaiement",
    "recuFiscal" BOOLEAN NOT NULL DEFAULT false,
    "dossierId" TEXT,
    "actionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MouvementAssociation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MouvementAssociation_organisationId_date_idx" ON "MouvementAssociation"("organisationId", "date");
CREATE INDEX "MouvementAssociation_organisationId_sens_idx" ON "MouvementAssociation"("organisationId", "sens");

ALTER TABLE "MouvementAssociation" ADD CONSTRAINT "MouvementAssociation_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
