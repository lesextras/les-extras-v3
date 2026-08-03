-- Contrat à durée déterminée : l'établissement est l'employeur, la plateforme
-- ne fournit personne. Aucune commission, aucun flux de paie ici.
CREATE TYPE "MotifRecoursCDD" AS ENUM ('REMPLACEMENT_SALARIE_ABSENT', 'REMPLACEMENT_ATTENTE_ENTREE', 'REMPLACEMENT_POSTE_SUPPRIME', 'ACCROISSEMENT_TEMPORAIRE');
CREATE TYPE "StatutContratCDD" AS ENUM ('BROUILLON', 'TRANSMIS', 'SIGNE', 'ACTIF', 'TERMINE', 'ROMPU');

CREATE TABLE "ContratCDD" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "missionId" TEXT,
  "motif" "MotifRecoursCDD" NOT NULL,
  "salarieRemplaceNom" TEXT,
  "salarieRemplaceQualification" TEXT,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateFin" TIMESTAMP(3),
  "dureeMinimaleJours" INTEGER,
  "poste" TEXT,
  "qualification" TEXT,
  "posteARisques" BOOLEAN,
  "conventionCollective" TEXT DEFAULT 'CCN 66',
  "remunerationBrute" DECIMAL(10,2),
  "remunerationDetail" TEXT,
  "caisseRetraiteComplementaire" TEXT,
  "organismePrevoyance" TEXT,
  "periodeEssaiJours" INTEGER,
  "statut" "StatutContratCDD" NOT NULL DEFAULT 'BROUILLON',
  "dpaeEffectueeLe" TIMESTAMP(3),
  "dpaeReference" TEXT,
  "transmisLe" TIMESTAMP(3),
  "signeSalarieLe" TIMESTAMP(3),
  "signeEmployeurLe" TIMESTAMP(3),
  "causeFin" TEXT,
  "termineLe" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContratCDD_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContratCDD_accountId_dateDebut_idx" ON "ContratCDD"("accountId", "dateDebut");
CREATE INDEX "ContratCDD_userId_dateDebut_idx" ON "ContratCDD"("userId", "dateDebut");
CREATE INDEX "ContratCDD_statut_idx" ON "ContratCDD"("statut");

ALTER TABLE "ContratCDD" ADD CONSTRAINT "ContratCDD_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContratCDD" ADD CONSTRAINT "ContratCDD_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContratCDD" ADD CONSTRAINT "ContratCDD_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ReliefMission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
