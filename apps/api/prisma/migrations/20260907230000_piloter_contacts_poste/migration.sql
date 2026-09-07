-- Les contacts autour de l'association : une catégorie de plus (institutionnel)
-- et le poste de la personne dans sa structure.
ALTER TYPE "RoleContact" ADD VALUE IF NOT EXISTS 'INSTITUTIONNEL';

ALTER TABLE "ContactAssociation" ADD COLUMN IF NOT EXISTS "poste" TEXT;
