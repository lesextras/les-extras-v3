-- Publics vises et duree en minutes sur les formations.
--
-- Additif et sans perte : deux colonnes nouvelles, l'une avec une valeur par
-- defaut (tableau vide), l'autre nullable. Rien a reprendre sur l'existant.
ALTER TABLE "Formation" ADD COLUMN "publicTargets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Formation" ADD COLUMN "durationMinutes" INTEGER;
