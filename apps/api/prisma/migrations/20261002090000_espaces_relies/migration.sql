-- ESPACES INTERCONNECTÉS (Pilote, 01/10/2026) : une association et une
-- académie peuvent être reliées (LiaisonEspace). Reliées, elles lisent et
-- écrivent les MÊMES lignes — projets, tâches, liens projets ↔ formations —
-- sans aucune copie.
--  - LiaisonEspace : le lien, EN_ATTENTE tant que l'autre espace n'a pas
--    accepté (ACTIVE d'emblée quand le demandeur administre les deux) ;
--  - ProjetFormation : un projet servi par une ou plusieurs formations (Cours) ;
--  - ActionAssociation / TacheProjet : un projet peut aussi appartenir à une
--    académie qui n'a pas d'association (`academieId`). `organisationId`
--    devient facultatif, et une contrainte CHECK impose exactement UN
--    propriétaire. Les lignes existantes ont toutes un organisationId : elles
--    respectent la contrainte telles quelles.
-- Additive et rejouable : aucune donnée n'est supprimée ni modifiée.

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StatutLiaison" AS ENUM ('EN_ATTENTE', 'ACTIVE', 'REFUSEE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable : un projet d'académie (sans association)
ALTER TABLE "ActionAssociation" ADD COLUMN IF NOT EXISTS "academieId" TEXT;
ALTER TABLE "ActionAssociation" ALTER COLUMN "organisationId" DROP NOT NULL;
DO $$ BEGIN ALTER TABLE "ActionAssociation" ADD CONSTRAINT "ActionAssociation_un_proprietaire" CHECK (num_nonnulls("organisationId", "academieId") = 1); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable : la tâche suit le propriétaire de son projet
ALTER TABLE "TacheProjet" ADD COLUMN IF NOT EXISTS "academieId" TEXT;
ALTER TABLE "TacheProjet" ALTER COLUMN "organisationId" DROP NOT NULL;
DO $$ BEGIN ALTER TABLE "TacheProjet" ADD CONSTRAINT "TacheProjet_un_proprietaire" CHECK (num_nonnulls("organisationId", "academieId") = 1); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LiaisonEspace" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "academieId" TEXT NOT NULL,
    "statut" "StatutLiaison" NOT NULL DEFAULT 'EN_ATTENTE',
    "demandeDepuisAccountId" TEXT NOT NULL,
    "demandeParUserId" TEXT,
    "accepteeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiaisonEspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjetFormation" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "academieId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetFormation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ActionAssociation_academieId_idx" ON "ActionAssociation"("academieId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TacheProjet_academieId_statut_idx" ON "TacheProjet"("academieId", "statut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiaisonEspace_academieId_statut_idx" ON "LiaisonEspace"("academieId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LiaisonEspace_organisationId_academieId_key" ON "LiaisonEspace"("organisationId", "academieId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjetFormation_coursId_idx" ON "ProjetFormation"("coursId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjetFormation_academieId_idx" ON "ProjetFormation"("academieId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProjetFormation_actionId_coursId_key" ON "ProjetFormation"("actionId", "coursId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ActionAssociation" ADD CONSTRAINT "ActionAssociation_academieId_fkey" FOREIGN KEY ("academieId") REFERENCES "Academie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "TacheProjet" ADD CONSTRAINT "TacheProjet_academieId_fkey" FOREIGN KEY ("academieId") REFERENCES "Academie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "LiaisonEspace" ADD CONSTRAINT "LiaisonEspace_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "LiaisonEspace" ADD CONSTRAINT "LiaisonEspace_academieId_fkey" FOREIGN KEY ("academieId") REFERENCES "Academie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "LiaisonEspace" ADD CONSTRAINT "LiaisonEspace_demandeParUserId_fkey" FOREIGN KEY ("demandeParUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ProjetFormation" ADD CONSTRAINT "ProjetFormation_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionAssociation"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ProjetFormation" ADD CONSTRAINT "ProjetFormation_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "ProjetFormation" ADD CONSTRAINT "ProjetFormation_academieId_fkey" FOREIGN KEY ("academieId") REFERENCES "Academie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
