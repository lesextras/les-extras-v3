-- AlterTable: add imageUrl and scheduleInfo to Service
ALTER TABLE "Service" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Service" ADD COLUMN "scheduleInfo" TEXT;
