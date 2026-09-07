-- Séparer les subventions des appels à projet.
CREATE TYPE "NatureDossier" AS ENUM ('SUBVENTION', 'APPEL_A_PROJET');

ALTER TABLE "DossierFinancement" ADD COLUMN "nature" "NatureDossier" NOT NULL DEFAULT 'SUBVENTION';
