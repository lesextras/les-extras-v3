-- LA VISIOCONSULTATION.
--
-- Migration ADDITIVE et REJOUABLE : une table, une énumération, aucun champ
-- ajouté à une table existante, donc aucun ALTER sur une table peuplée et
-- aucun risque au déploiement. Le Dockerfile fait `prisma db push` au
-- démarrage : ce fichier documente ce que le schéma applique.
--
-- ⚠ AUCUNE DONNÉE DE SANTÉ N'EST STOCKÉE ICI, et ce n'est pas un oubli : ces
-- séances sont de la rééducation et de l'éducation spécialisée, pas du soin.
-- Ajouter un jour un champ « motif » ferait basculer cette table dans le
-- régime des données de santé (art. 9 RGPD), avec l'hébergement HDS qui va
-- avec. Ne pas le faire sans mesurer ce que cela emporte.

DO $$ BEGIN
  CREATE TYPE "StatutVisio" AS ENUM ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Visioconsultation" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "salle" TEXT NOT NULL,
  "debutPrevu" TIMESTAMP(3) NOT NULL,
  "dureeMinutes" INTEGER NOT NULL DEFAULT 45,
  "jetonIntervenant" TEXT NOT NULL,
  "jetonDemandeur" TEXT NOT NULL,
  "statut" "StatutVisio" NOT NULL DEFAULT 'PLANIFIEE',
  "ouverteLe" TIMESTAMP(3),
  "termineeLe" TIMESTAMP(3),
  "annulationMotif" TEXT,
  "intervenantAffiche" TEXT,
  "demandeurAffiche" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Visioconsultation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Visioconsultation_salle_key" ON "Visioconsultation"("salle");
CREATE UNIQUE INDEX IF NOT EXISTS "Visioconsultation_jetonIntervenant_key" ON "Visioconsultation"("jetonIntervenant");
CREATE UNIQUE INDEX IF NOT EXISTS "Visioconsultation_jetonDemandeur_key" ON "Visioconsultation"("jetonDemandeur");
CREATE INDEX IF NOT EXISTS "Visioconsultation_bookingId_idx" ON "Visioconsultation"("bookingId");
CREATE INDEX IF NOT EXISTS "Visioconsultation_debutPrevu_idx" ON "Visioconsultation"("debutPrevu");
CREATE INDEX IF NOT EXISTS "Visioconsultation_statut_debutPrevu_idx" ON "Visioconsultation"("statut", "debutPrevu");

DO $$ BEGIN
  ALTER TABLE "Visioconsultation"
    ADD CONSTRAINT "Visioconsultation_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
