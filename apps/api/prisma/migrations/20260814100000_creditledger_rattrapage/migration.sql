-- RATTRAPAGE DE DÉRIVE — CreditLedger
--
-- Le schéma Prisma déclare depuis longtemps `userId`, `label` et deux index
-- supplémentaires sur CreditLedger, mais AUCUNE migration ne les a jamais
-- créés. En production ils existent quand même, parce que le conteneur API
-- lance `prisma db push` à chaque démarrage : la base suit le schéma, pas
-- l'historique. Conséquence : une restauration de sauvegarde repartirait sur
-- une table incomplète, et la première écriture d'un crédit échouerait.
--
-- Cette migration remet l'historique en phase avec le schéma. Elle est écrite
-- en idempotent (IF NOT EXISTS + garde sur pg_constraint) : sans aucun effet
-- sur la base de production déjà à jour, et correcte sur une base restaurée.

ALTER TABLE "CreditLedger" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "CreditLedger" ADD COLUMN IF NOT EXISTS "label" TEXT;

CREATE INDEX IF NOT EXISTS "CreditLedger_accountId_createdAt_idx" ON "CreditLedger"("accountId", "createdAt");
CREATE INDEX IF NOT EXISTS "CreditLedger_userId_idx" ON "CreditLedger"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CreditLedger_userId_fkey'
      AND conrelid = '"CreditLedger"'::regclass
  ) THEN
    ALTER TABLE "CreditLedger"
      ADD CONSTRAINT "CreditLedger_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
