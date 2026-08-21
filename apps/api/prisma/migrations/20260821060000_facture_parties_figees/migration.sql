-- FACTURE : IDENTITÉ DES PARTIES FIGÉE À L'ÉMISSION
--
-- Le PDF d'une facture était reconstruit à chaque téléchargement depuis les
-- profils courants : corriger une raison sociale, une adresse ou un IBAN
-- réécrivait rétroactivement une facture déjà envoyée et déjà archivée par le
-- client. Deux exemplaires du même numéro pouvaient ne pas dire la même chose.
--
-- Idempotente, comme les autres : le conteneur exécute `prisma migrate deploy`
-- à chaque démarrage. Nullable, donc sans effet sur les factures existantes —
-- celles-ci retombent sur les profils courants, comme avant.

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "partiesSnapshot" JSONB;
