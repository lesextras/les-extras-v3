-- Migration: add_booking_candidature_fields
-- Adds motivation and proposedRate to Booking for SOS Renfort candidature

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "motivation"   TEXT,
  ADD COLUMN IF NOT EXISTS "proposedRate" DOUBLE PRECISION;
