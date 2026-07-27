-- AlterTable: Service — extend with atelier fields
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "pricingType" TEXT NOT NULL DEFAULT 'SESSION';
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "pricePerParticipant" DOUBLE PRECISION;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "publicCible" JSONB;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "materials" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "objectives" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "methodology" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "evaluation" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "slots" JSONB;

-- AlterTable: Quote — make amount/description optional, add serviceId
ALTER TABLE "Quote" ALTER COLUMN "amount" SET DEFAULT 0;
ALTER TABLE "Quote" ALTER COLUMN "description" SET DEFAULT '';
ALTER TABLE "Quote" ALTER COLUMN "startDate" DROP NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "serviceId" TEXT;

-- AddForeignKey: Quote.serviceId -> Service.id
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Booking — add nbParticipants
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "nbParticipants" INTEGER;
