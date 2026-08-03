-- Service d'affectation porté par l'invitation.
-- Un membre invité n'était rattaché à aucun service tant qu'un responsable ne
-- le faisait pas à la main : il n'apparaissait donc dans le planning d'aucun
-- chef de service. On demande le service au moment où l'on invite, c'est-à-dire
-- au moment où on le sait.

ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "orgUnitId" TEXT;

CREATE INDEX IF NOT EXISTS "Invitation_orgUnitId_idx" ON "Invitation"("orgUnitId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invitation_orgUnitId_fkey') THEN
    ALTER TABLE "Invitation"
      ADD CONSTRAINT "Invitation_orgUnitId_fkey"
      FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
