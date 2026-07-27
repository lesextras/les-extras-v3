-- CreateEnum: QuoteStatus (idempotent — may already exist from earlier migration)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus') THEN
        -- Drop the old enum and recreate with new values
        -- Safe: no column uses this enum yet in this migration
        DROP TYPE "QuoteStatus";
    END IF;
    CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'REVISED');
END $$;

-- CreateEnum: MessageType (idempotent)
DO $$ BEGIN
    CREATE TYPE "MessageType" AS ENUM ('USER', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum: BookingStatus — add new values (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'QUOTE_SENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" ADD VALUE 'QUOTE_SENT';
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'QUOTE_ACCEPTED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" ADD VALUE 'QUOTE_ACCEPTED';
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_PROGRESS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" ADD VALUE 'IN_PROGRESS';
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AWAITING_PAYMENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" ADD VALUE 'AWAITING_PAYMENT';
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAID' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')) THEN
        ALTER TYPE "BookingStatus" ADD VALUE 'PAID';
    END IF;
END $$;

-- AlterTable: Message — add type and metadata
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "type" "MessageType" NOT NULL DEFAULT 'USER';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- AlterTable: Conversation — add bookingId
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_bookingId_key" ON "Conversation"("bookingId");
CREATE INDEX IF NOT EXISTS "Conversation_bookingId_idx" ON "Conversation"("bookingId");
DO $$ BEGIN
    ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop old Quote table if it exists (from migration 20260303221500 — different schema)
DROP TABLE IF EXISTS "QuoteLine" CASCADE;
DROP TABLE IF EXISTS "Quote" CASCADE;

-- CreateTable: Quote
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalHT" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,
    "validUntil" TIMESTAMP(3),
    "conditions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable: QuoteLine
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'heure',
    "totalHT" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Quote_bookingId_idx" ON "Quote"("bookingId");
CREATE INDEX IF NOT EXISTS "Quote_issuedBy_idx" ON "Quote"("issuedBy");
CREATE INDEX IF NOT EXISTS "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
