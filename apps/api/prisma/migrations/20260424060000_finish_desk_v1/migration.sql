-- Desk V1: universal inbox request types
DO $$
BEGIN
    ALTER TYPE "DeskRequestType" ADD VALUE 'TECHNICAL_ISSUE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DeskRequestType" ADD VALUE 'USER_REPORT';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DeskRequestType" ADD VALUE 'LITIGE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Invoice.status hardening:
-- older migrations created InvoiceStatus(PENDING_PAYMENT, PAID), while the
-- current product vocabulary is UNPAID/PAID. Rebuild the enum so Prisma and DB
-- expose only stable values.
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "Invoice" SET "status" = 'UNPAID' WHERE "status"::text = 'PENDING_PAYMENT';
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
DROP TYPE IF EXISTS "InvoiceStatus";
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID');
UPDATE "Invoice" SET "status" = 'UNPAID' WHERE "status" IS NULL OR "status" NOT IN ('UNPAID', 'PAID');
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus" USING "status"::"InvoiceStatus";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
ALTER TABLE "Invoice" ALTER COLUMN "status" SET NOT NULL;
