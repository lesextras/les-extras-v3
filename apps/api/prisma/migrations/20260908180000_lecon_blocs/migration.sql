-- UNE LEÇON PEUT VIVRE SANS CHAPITRE, ET ELLE EST FAITE DE BLOCS.
--
-- Le chapitre devient facultatif : une leçon s'accroche soit à un chapitre,
-- soit directement à la formation. Les deux partagent le même « ordre », si
-- bien qu'un chapitre et une leçon se rangent côte à côte dans la même liste.
--
-- « blocs » remplace le contenu unique : un tableau ordonné de morceaux
-- (titre, texte, vidéo, image, fichier…). Les anciennes leçons gardent leurs
-- colonnes ; le service les convertit en blocs au démarrage.
--
-- « publie » met un chapitre ou une leçon en brouillon sans le supprimer.

ALTER TABLE "ChapitreCours" ADD COLUMN "publie" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "LeconCours" ADD COLUMN "publie" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LeconCours" ADD COLUMN "blocs" JSONB;
ALTER TABLE "LeconCours" ADD COLUMN "coursId" TEXT;
ALTER TABLE "LeconCours" ALTER COLUMN "chapitreId" DROP NOT NULL;

ALTER TABLE "LeconCours" ADD CONSTRAINT "LeconCours_coursId_fkey"
  FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LeconCours_coursId_ordre_idx" ON "LeconCours"("coursId", "ordre");
