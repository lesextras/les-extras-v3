-- LA DIFFUSION PROGRESSIVE.
-- Une leçon (ou tout un chapitre) ne s'ouvre qu'au bout de N jours comptés
-- depuis l'inscription. Zéro : disponible tout de suite, comme avant.
ALTER TABLE "ChapitreCours" ADD COLUMN IF NOT EXISTS "ouvertureJours" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LeconCours" ADD COLUMN IF NOT EXISTS "ouvertureJours" INTEGER NOT NULL DEFAULT 0;

-- LA DURÉE MINIMUM.
-- Quand elle est imposée, la leçon ne peut pas être cochée avant que le temps
-- annoncé se soit écoulé depuis sa première ouverture.
ALTER TABLE "LeconCours" ADD COLUMN IF NOT EXISTS "dureeImposee" BOOLEAN NOT NULL DEFAULT false;

-- TÂCHES & MISSIONS : [{ "id", "texte" }]
ALTER TABLE "LeconCours" ADD COLUMN IF NOT EXISTS "taches" JSONB;

-- CONTENU SCORM : l'adresse de l'index d'un paquet déposé ailleurs.
ALTER TABLE "LeconCours" ADD COLUMN IF NOT EXISTS "scormUrl" TEXT;

-- Deux genres de contenu pédagogique de plus.
ALTER TYPE "TypeLecon" ADD VALUE IF NOT EXISTS 'TACHES';
ALTER TYPE "TypeLecon" ADD VALUE IF NOT EXISTS 'SCORM';

-- CE QUE L'APPRENANT A FAIT.
-- « ouverteLe » est posé à la première ouverture : c'est lui qui rend la durée
-- minimum vérifiable côté serveur. « taches » garde les cases cochées.
ALTER TABLE "ProgressionLecon" ADD COLUMN IF NOT EXISTS "ouverteLe" TIMESTAMP(3);
ALTER TABLE "ProgressionLecon" ADD COLUMN IF NOT EXISTS "taches" JSONB;

-- LE PAIEMENT EN LIGNE D'UNE FORMATION.
-- La session Stripe rend l'encaissement idempotent : une relivraison du
-- webhook retombe sur la même vente et n'inscrit personne deux fois.
ALTER TABLE "VenteCours" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "VenteCours_stripeSessionId_key" ON "VenteCours"("stripeSessionId");
