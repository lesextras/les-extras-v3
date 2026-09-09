-- Liens publics de l'intervenant (site, réseaux) affichés sur ses fiches.
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "liens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
