-- CE QUI MANQUAIT FACE À TEACHIZY.
--
-- Un code promo se décrit (pour s'y retrouver dans la liste). Une école se
-- personnalise en entier : un favicon, six couleurs et non plus une seule,
-- des liens sociaux. Elle décide aussi de son certificat de réussite, de ses
-- commentaires, et porte ses codes de suivi.

ALTER TABLE "CodePromo" ADD COLUMN "description" TEXT;

ALTER TABLE "EcoleEnLigne" ADD COLUMN "faviconUrl" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "couleurFond" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "couleurTitres" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "couleurTextes" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "couleurBoutons" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "couleurTexteBoutons" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "liensSociaux" JSONB;

ALTER TABLE "EcoleEnLigne" ADD COLUMN "certificatModele" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "certificatsActifs" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "commentairesActifs" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "EcoleEnLigne" ADD COLUMN "googleAnalytics" TEXT;
ALTER TABLE "EcoleEnLigne" ADD COLUMN "pixelMeta" TEXT;

-- Ce qu'on a réellement versé à un affilié : sans ce chiffre, « commissions
-- payées » ne veut rien dire.
ALTER TABLE "Affilie" ADD COLUMN "gainsVersesCents" INTEGER NOT NULL DEFAULT 0;
