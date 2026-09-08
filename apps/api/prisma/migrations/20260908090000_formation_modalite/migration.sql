-- UNE FORMATION, ET SA MODALITÉ.
--
-- Le présentiel, la classe virtuelle et le mixte cessent d'être des écrans
-- séparés : ce sont des options portées par la formation elle-même. On ajoute
-- au passage ce que l'atelier réclame — la lecture ordonnée, le nombre de
-- places, la TVA, les facilités de paiement, le référencement — et les
-- commentaires que les apprenants laissent sur une leçon.

CREATE TYPE "ModaliteCours" AS ENUM ('EN_LIGNE', 'PRESENTIEL', 'VIRTUEL', 'MIXTE');

ALTER TABLE "Cours"
  ADD COLUMN "modalite" "ModaliteCours" NOT NULL DEFAULT 'EN_LIGNE',
  ADD COLUMN "lieu" TEXT,
  ADD COLUMN "lienVisio" TEXT,
  ADD COLUMN "accesHandicap" TEXT,
  ADD COLUMN "lectureOrdonnee" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "placesMax" INTEGER,
  ADD COLUMN "tvaPourcent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "echeances" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "seoTitre" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "commentairesActifs" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Cours_accountId_modalite_idx" ON "Cours"("accountId", "modalite");

-- CE QUE LES APPRENANTS ÉCRIVENT SOUS UNE LEÇON.
CREATE TABLE "CommentaireCours" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "leconId" TEXT,
    "inscriptionId" TEXT,
    "auteur" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "reponse" TEXT,
    "reponduLe" TIMESTAMP(3),
    "masque" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentaireCours_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommentaireCours_coursId_createdAt_idx" ON "CommentaireCours"("coursId", "createdAt");
CREATE INDEX "CommentaireCours_leconId_idx" ON "CommentaireCours"("leconId");

ALTER TABLE "CommentaireCours" ADD CONSTRAINT "CommentaireCours_coursId_fkey"
    FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentaireCours" ADD CONSTRAINT "CommentaireCours_leconId_fkey"
    FOREIGN KEY ("leconId") REFERENCES "LeconCours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommentaireCours" ADD CONSTRAINT "CommentaireCours_inscriptionId_fkey"
    FOREIGN KEY ("inscriptionId") REFERENCES "InscriptionCours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
