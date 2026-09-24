-- CreateEnum
CREATE TYPE "NiveauPartage" AS ENUM ('DISPONIBILITES', 'TITRES', 'DETAILS', 'MODIFICATION');

-- CreateEnum
CREATE TYPE "SensPartage" AS ENUM ('INVITATION', 'DEMANDE');

-- CreateEnum
CREATE TYPE "StatutPartage" AS ENUM ('EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'RETIRE');

-- CreateTable
CREATE TABLE "PartageAgenda" (
    "id" TEXT NOT NULL,
    "compteId" TEXT,
    "proprietaireId" TEXT,
    "destinataireId" TEXT,
    "destinataireEmail" TEXT NOT NULL,
    "niveau" "NiveauPartage" NOT NULL DEFAULT 'TITRES',
    "sens" "SensPartage" NOT NULL,
    "statut" "StatutPartage" NOT NULL DEFAULT 'EN_ATTENTE',
    "inclutReservations" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "couleur" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "creeParId" TEXT NOT NULL,
    "reponduLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartageAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartageAgenda_destinataireId_statut_idx" ON "PartageAgenda"("destinataireId", "statut");

-- CreateIndex
CREATE INDEX "PartageAgenda_destinataireEmail_statut_idx" ON "PartageAgenda"("destinataireEmail", "statut");

-- CreateIndex
CREATE INDEX "PartageAgenda_compteId_statut_idx" ON "PartageAgenda"("compteId", "statut");

-- CreateIndex
CREATE INDEX "PartageAgenda_proprietaireId_statut_idx" ON "PartageAgenda"("proprietaireId", "statut");

-- AddForeignKey
ALTER TABLE "PartageAgenda" ADD CONSTRAINT "PartageAgenda_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartageAgenda" ADD CONSTRAINT "PartageAgenda_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartageAgenda" ADD CONSTRAINT "PartageAgenda_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartageAgenda" ADD CONSTRAINT "PartageAgenda_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

