-- Rename UserRole enum values
ALTER TYPE "UserRole" RENAME VALUE 'CLIENT' TO 'ESTABLISHMENT';
ALTER TYPE "UserRole" RENAME VALUE 'TALENT' TO 'FREELANCE';

-- Rename columns in ReliefMission
ALTER TABLE "ReliefMission" RENAME COLUMN "clientId" TO "establishmentId";

-- Rename columns in Booking
ALTER TABLE "Booking" RENAME COLUMN "clientId" TO "establishmentId";
ALTER TABLE "Booking" RENAME COLUMN "talentId" TO "freelanceId";

-- Rename columns in PackPurchase
ALTER TABLE "PackPurchase" RENAME COLUMN "clientId" TO "establishmentId";

-- Add ServiceStatus enum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- Add status column to Service
ALTER TABLE "Service" ADD COLUMN "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';

-- Create Review table
CREATE TABLE "Review" (
    "id"        TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorId"  TEXT NOT NULL,
    "targetId"  TEXT NOT NULL,
    "rating"    INTEGER NOT NULL,
    "comment"   TEXT,
    "type"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint and foreign keys on Review
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
