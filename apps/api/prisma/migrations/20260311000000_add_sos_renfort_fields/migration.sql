-- Migration: add_sos_renfort_fields
-- Adds extended fields to ReliefMission for SOS Renfort multi-step form

ALTER TABLE "ReliefMission"
  ADD COLUMN IF NOT EXISTS "metier"  TEXT,
  ADD COLUMN IF NOT EXISTS "shift"   TEXT,
  ADD COLUMN IF NOT EXISTS "city"    TEXT,
  ADD COLUMN IF NOT EXISTS "zipCode" TEXT,
  ADD COLUMN IF NOT EXISTS "slots"   JSONB;
