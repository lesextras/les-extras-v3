-- Dérogation aux plafonds de durée du travail sur un créneau.
-- Renseignée uniquement quand un responsable passe outre un constat bloquant :
-- c'est la trace qui le couvre en cas de contrôle URSSAF ou d'inspection.
ALTER TABLE "Shift" ADD COLUMN "derogationMotif" TEXT;
ALTER TABLE "Shift" ADD COLUMN "derogationCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Shift" ADD COLUMN "derogationLe" TIMESTAMP(3);
