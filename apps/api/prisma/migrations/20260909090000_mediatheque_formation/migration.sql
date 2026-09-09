-- LA MÉDIATHÈQUE D'UNE FORMATION.
--
-- Une famille de fichiers de plus : les vidéos et documents qui font le contenu
-- d'une leçon. Elle existe pour que l'académie n'ait plus besoin d'héberger ses
-- vidéos chez un prestataire extérieur.
ALTER TYPE "FileKind" ADD VALUE IF NOT EXISTS 'MEDIA';
