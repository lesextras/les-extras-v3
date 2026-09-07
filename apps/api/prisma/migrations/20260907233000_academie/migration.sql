-- Piloter mon académie : le troisième type d'espace et la fiche de l'organisme.

ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'ACADEMIE';

CREATE TYPE "EtatQualiopi" AS ENUM ('PAS_ENGAGE', 'EN_PREPARATION', 'AUDIT_PLANIFIE', 'CERTIFIE', 'SUSPENDU');
CREATE TYPE "TypeVeille" AS ENUM ('LEGALE', 'METIER', 'HANDICAP', 'INNOVATION', 'EMPLOI');
CREATE TYPE "OrigineReclamation" AS ENUM ('APPRENANT', 'ENTREPRISE', 'FINANCEUR', 'FORMATEUR', 'AUTRE');
CREATE TYPE "StatutReclamation" AS ENUM ('OUVERTE', 'EN_COURS', 'RESOLUE', 'CLASSEE');

CREATE TABLE "Academie" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sigle" TEXT,
    "nda" TEXT,
    "ndaDeposeLe" TIMESTAMP(3),
    "dreets" TEXT,
    "siren" TEXT,
    "siret" TEXT,
    "ape" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "commune" TEXT,
    "telephone" TEXT,
    "courriel" TEXT,
    "siteWeb" TEXT,
    "qualiopi" "EtatQualiopi" NOT NULL DEFAULT 'PAS_ENGAGE',
    "certificateur" TEXT,
    "auditPrevuLe" TIMESTAMP(3),
    "certifieDu" TIMESTAMP(3),
    "certifieAu" TIMESTAMP(3),
    "referentHandicap" TEXT,
    "referentPedagogique" TEXT,
    "resume" TEXT,
    "presentation" TEXT,
    "etapesFaites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Academie_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Academie_accountId_key" ON "Academie"("accountId");
CREATE INDEX "Academie_qualiopi_idx" ON "Academie"("qualiopi");

ALTER TABLE "Academie" ADD CONSTRAINT "Academie_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VeilleEntree" (
    "id" TEXT NOT NULL,
    "academieId" TEXT NOT NULL,
    "type" "TypeVeille" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "titre" TEXT NOT NULL,
    "source" TEXT,
    "lien" TEXT,
    "resume" TEXT,
    "consequence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VeilleEntree_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VeilleEntree_academieId_date_idx" ON "VeilleEntree"("academieId", "date");
CREATE INDEX "VeilleEntree_academieId_type_idx" ON "VeilleEntree"("academieId", "type");

ALTER TABLE "VeilleEntree" ADD CONSTRAINT "VeilleEntree_academieId_fkey"
    FOREIGN KEY ("academieId") REFERENCES "Academie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Reclamation" (
    "id" TEXT NOT NULL,
    "academieId" TEXT NOT NULL,
    "recueLe" TIMESTAMP(3) NOT NULL,
    "origine" "OrigineReclamation" NOT NULL DEFAULT 'APPRENANT',
    "auteur" TEXT,
    "objet" TEXT NOT NULL,
    "detail" TEXT,
    "traitement" TEXT,
    "clotureeLe" TIMESTAMP(3),
    "statut" "StatutReclamation" NOT NULL DEFAULT 'OUVERTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reclamation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reclamation_academieId_statut_idx" ON "Reclamation"("academieId", "statut");
CREATE INDEX "Reclamation_academieId_recueLe_idx" ON "Reclamation"("academieId", "recueLe");

ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_academieId_fkey"
    FOREIGN KEY ("academieId") REFERENCES "Academie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
