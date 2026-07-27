-- Fix Profile.skills column: ensure it has an empty-array default.
-- Uses DO $$ block so it is safe to re-run and skips if column does not exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Profile'
      AND column_name = 'skills'
  ) THEN
    ALTER TABLE "Profile" ALTER COLUMN "skills" SET DEFAULT ARRAY[]::TEXT[];
    UPDATE "Profile" SET "skills" = ARRAY[]::TEXT[] WHERE "skills" IS NULL;
  END IF;
END $$;
