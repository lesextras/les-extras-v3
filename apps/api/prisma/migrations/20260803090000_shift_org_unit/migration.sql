-- Rattachement d'un créneau à un service (unité organisationnelle).
-- Sans cela, un chef de service voit le planning de tout l'établissement :
-- sur une structure découpée en cinq services, l'écran devient illisible
-- pour la personne qui en a le plus besoin.

ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "orgUnitId" TEXT;

CREATE INDEX IF NOT EXISTS "Shift_orgUnitId_startAt_idx" ON "Shift"("orgUnitId", "startAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Shift_orgUnitId_fkey'
  ) THEN
    ALTER TABLE "Shift"
      ADD CONSTRAINT "Shift_orgUnitId_fkey"
      FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Reprise de l'existant : un créneau hérite du service de son intervenant
-- quand celui-ci n'en a qu'un dans le compte. Les créneaux non affectés, ou
-- dont l'intervenant n'est rattaché à aucun service, restent sans service —
-- ils apparaîtront dans le filtre « Sans service », ce qui est l'information
-- utile plutôt qu'une affectation devinée.
UPDATE "Shift" s
SET "orgUnitId" = m."orgUnitId"
FROM "Membership" m
WHERE s."freelanceId" = m."userId"
  AND m."accountId" = s."accountId"
  AND m."orgUnitId" IS NOT NULL
  AND s."orgUnitId" IS NULL;
