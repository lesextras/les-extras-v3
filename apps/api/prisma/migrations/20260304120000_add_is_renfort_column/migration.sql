-- Add the missing isRenfort column to ReliefMission
ALTER TABLE "ReliefMission" ADD COLUMN IF NOT EXISTS "isRenfort" BOOLEAN NOT NULL DEFAULT false;
