-- SOS Renfort v2: add clinical context and logistics fields to ReliefMission
ALTER TABLE "ReliefMission"
  ADD COLUMN IF NOT EXISTS "description"          TEXT,
  ADD COLUMN IF NOT EXISTS "establishmentType"    TEXT,
  ADD COLUMN IF NOT EXISTS "targetPublic"         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "unitSize"             TEXT,
  ADD COLUMN IF NOT EXISTS "requiredSkills"       TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "diplomaRequired"      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "hasTransmissions"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "transmissionTime"     TEXT,
  ADD COLUMN IF NOT EXISTS "perks"                TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "exactAddress"         TEXT,
  ADD COLUMN IF NOT EXISTS "accessInstructions"   TEXT;
