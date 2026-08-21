-- DEVIS : DÉTAIL CHIFFRÉ, IDENTITÉS FIGÉES, BON POUR ACCORD
--
-- Écrite à la main plutôt que générée, et rendue idempotente : le conteneur
-- exécute `prisma migrate deploy` à chaque démarrage, et un redéploiement
-- rejoué sur une base déjà migrée ne doit pas tomber en erreur.
--
-- Toutes les colonnes sont nullables : les devis déjà en base restent
-- lisibles tels quels. Un devis antérieur n'a pas de totaux séparés parce que
-- la TVA y valait zéro pour tout le monde — son `amount` est donc à la fois
-- son HT et son TTC, et le générateur de PDF sait retomber sur ce cas.

ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "totalHt" DECIMAL(10,2);
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "totalTva" DECIMAL(10,2);
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "partiesSnapshot" JSONB;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "acceptedByName" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "acceptedByRole" TEXT;
