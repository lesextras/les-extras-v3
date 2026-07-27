-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[];
