-- TÂCHES DES PROJETS (Piloter mon association, 01/10/2026) : chaque projet
-- (ActionAssociation) reçoit ses tâches, attribuées à une personne de l'équipe
-- (répertoire) ou à une personne qui a un accès au compte, avec début,
-- échéance, priorité et statut — de quoi tenir un « À faire » et un planning.
-- Additive et rejouable : aucune colonne existante n'est modifiée, aucune
-- donnée n'est supprimée.
-- SQL produit par `prisma migrate diff`, rendu idempotent.

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'BLOQUEE', 'FAITE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "PrioriteTache" AS ENUM ('BASSE', 'NORMALE', 'HAUTE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TacheProjet" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "priorite" "PrioriteTache" NOT NULL DEFAULT 'NORMALE',
    "debut" TIMESTAMP(3),
    "echeance" TIMESTAMP(3),
    "responsableContactId" TEXT,
    "responsableUserId" TEXT,
    "responsableNom" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "faiteLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacheProjet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TacheProjet_organisationId_statut_idx" ON "TacheProjet"("organisationId", "statut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TacheProjet_actionId_statut_ordre_idx" ON "TacheProjet"("actionId", "statut", "ordre");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TacheProjet_responsableContactId_idx" ON "TacheProjet"("responsableContactId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TacheProjet_responsableUserId_idx" ON "TacheProjet"("responsableUserId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "TacheProjet" ADD CONSTRAINT "TacheProjet_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "TacheProjet" ADD CONSTRAINT "TacheProjet_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionAssociation"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "TacheProjet" ADD CONSTRAINT "TacheProjet_responsableContactId_fkey" FOREIGN KEY ("responsableContactId") REFERENCES "ContactAssociation"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "TacheProjet" ADD CONSTRAINT "TacheProjet_responsableUserId_fkey" FOREIGN KEY ("responsableUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
