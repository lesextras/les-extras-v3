-- Les départements réellement couverts par une fiche, en codes INSEE.
--
-- Additif et sans perte : la colonne naît avec un tableau vide, aucune donnée
-- existante n'est touchée. `city` reste en place — elle dit la ville de base de
-- l'intervenant, ce qui n'est pas la même information que le territoire couvert.
--
-- ⚠ Le conteneur applique le schéma par `prisma db push` au démarrage : ce
-- fichier est documentaire, il retrace l'intention pour qui relira l'historique.
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "departements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
