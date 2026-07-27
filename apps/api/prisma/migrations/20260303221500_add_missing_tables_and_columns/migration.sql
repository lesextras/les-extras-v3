-- =========================================================================
-- Migration: Add missing tables (Quote, Invoice, DirectMessage,
--            Notification, PackPurchase) and missing columns
-- =========================================================================

-- ─── Enums ───────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING_PAYMENT', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── DirectMessage ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DirectMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- ─── Notification ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- ─── PackPurchase ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PackPurchase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "creditsAdded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackPurchase_pkey" PRIMARY KEY ("id")
);

-- ─── Quote ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "freelanceId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "reliefMissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- ─── Invoice ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "url" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bookingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- ─── Ensure Invoice has all required columns (table may pre-exist) ───────
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ─── Add missing columns to Profile ─────────────────────────────────────
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "siret" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "tvaNumber" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "availableCredits" INTEGER NOT NULL DEFAULT 0;

-- ─── Add quoteId to Booking ──────────────────────────────────────────────
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;

-- ─── Unique constraints ──────────────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_invoiceNumber_key" UNIQUE ("invoiceNumber");
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_key" UNIQUE ("bookingId");
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_key" UNIQUE ("quoteId");
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- ─── Foreign key constraints ─────────────────────────────────────────────
DO $$ BEGIN
    ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey"
        FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiverId_fkey"
        FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PackPurchase" ADD CONSTRAINT "PackPurchase_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_freelanceId_fkey"
        FOREIGN KEY ("freelanceId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_establishmentId_fkey"
        FOREIGN KEY ("establishmentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_reliefMissionId_fkey"
        FOREIGN KEY ("reliefMissionId") REFERENCES "ReliefMission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey"
        FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey"
        FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Booking_quoteId_idx" ON "Booking"("quoteId");
