-- Evaluations a chaud et a froid (referentiel national qualite).
--
-- L'evaluation a chaud existait a moitie : la colonne satisfaction etait lue et
-- agregee, mais aucun formulaire ne la remplissait. L'evaluation a froid, elle,
-- n'existait pas du tout — or c'est celle que l'auditeur regarde en premier,
-- parce qu'elle mesure ce qui reste trois mois apres la formation.
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "satisfactionComment" TEXT;
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "satisfactionAt" TIMESTAMP(3);
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "coldRating" INTEGER;
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "coldTransfer" TEXT;
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "coldComment" TEXT;
ALTER TABLE "Inscription" ADD COLUMN IF NOT EXISTS "coldAt" TIMESTAMP(3);
