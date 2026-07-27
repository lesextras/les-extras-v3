-- AlterEnum: add finance incident types
ALTER TYPE "DeskRequestType" ADD VALUE 'PAYMENT_ISSUE';
ALTER TYPE "DeskRequestType" ADD VALUE 'BOOKING_FAILURE';
ALTER TYPE "DeskRequestType" ADD VALUE 'PACK_PURCHASE_FAILURE';
ALTER TYPE "DeskRequestType" ADD VALUE 'MISSION_PUBLISH_FAILURE';

-- AlterTable: make missionId nullable
ALTER TABLE "DeskRequest" ALTER COLUMN "missionId" DROP NOT NULL;

-- AlterTable: add bookingId column
ALTER TABLE "DeskRequest" ADD COLUMN "bookingId" TEXT;

-- Drop existing missionId FK (was ON DELETE CASCADE — now SET NULL since column is nullable)
ALTER TABLE "DeskRequest" DROP CONSTRAINT "DeskRequest_missionId_fkey";

-- Recreate missionId FK with SET NULL
ALTER TABLE "DeskRequest" ADD CONSTRAINT "DeskRequest_missionId_fkey"
  FOREIGN KEY ("missionId") REFERENCES "ReliefMission"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add bookingId FK
ALTER TABLE "DeskRequest" ADD CONSTRAINT "DeskRequest_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex for bookingId
CREATE INDEX "DeskRequest_bookingId_idx" ON "DeskRequest"("bookingId");
