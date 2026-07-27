-- =========================================================================
-- Migration: Schema v2 — Conversation, Document, Stripe fields, Review enum
-- LOT 3.2 — Target data model
-- =========================================================================

-- ─── New Enums ───────────────────────────────────────────────────────────

-- ReviewType replaces the free-text Review.type column
CREATE TYPE "ReviewType" AS ENUM ('ESTABLISHMENT_TO_FREELANCE', 'FREELANCE_TO_ESTABLISHMENT');

-- DocumentType for uploaded files
CREATE TYPE "DocumentType" AS ENUM ('AVATAR', 'SERVICE_PHOTO', 'IDENTITY_DOC', 'OTHER');

-- ─── Conversation table ──────────────────────────────────────────────────

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_participantAId_participantBId_key" ON "Conversation"("participantAId", "participantBId");
CREATE INDEX "Conversation_participantAId_idx" ON "Conversation"("participantAId");
CREATE INDEX "Conversation_participantBId_idx" ON "Conversation"("participantBId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Rename DirectMessage → Message ──────────────────────────────────────

ALTER TABLE "DirectMessage" RENAME TO "Message";
ALTER TABLE "Message" RENAME CONSTRAINT "DirectMessage_pkey" TO "Message_pkey";

-- Add conversationId column (nullable — existing messages have no conversation)
ALTER TABLE "Message" ADD COLUMN "conversationId" TEXT;

-- Indexes on Message
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- Foreign keys on Message
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename existing FK constraints from DirectMessage to Message
ALTER TABLE "Message" RENAME CONSTRAINT "DirectMessage_senderId_fkey" TO "Message_senderId_fkey";
ALTER TABLE "Message" RENAME CONSTRAINT "DirectMessage_receiverId_fkey" TO "Message_receiverId_fkey";

-- ─── Document table ──────────────────────────────────────────────────────

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "userId" TEXT,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_serviceId_idx" ON "Document"("serviceId");

ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── New columns on User ─────────────────────────────────────────────────

ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- ─── New columns on Profile ──────────────────────────────────────────────

ALTER TABLE "Profile" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "Profile" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN "longitude" DOUBLE PRECISION;

-- ─── New column on Booking ───────────────────────────────────────────────

ALTER TABLE "Booking" ADD COLUMN "stripePaymentIntentId" TEXT;

-- ─── Review.type: migrate from free-text String to ReviewType enum ───────

-- 1. Add a temporary column with the new enum type
ALTER TABLE "Review" ADD COLUMN "type_new" "ReviewType";

-- 2. Migrate existing data (map existing string values to enum)
UPDATE "Review" SET "type_new" = 'ESTABLISHMENT_TO_FREELANCE'::"ReviewType" WHERE "type" = 'ESTABLISHMENT_TO_FREELANCE';
UPDATE "Review" SET "type_new" = 'FREELANCE_TO_ESTABLISHMENT'::"ReviewType" WHERE "type" = 'FREELANCE_TO_ESTABLISHMENT';
-- Fallback: any unrecognized value defaults to ESTABLISHMENT_TO_FREELANCE
UPDATE "Review" SET "type_new" = 'ESTABLISHMENT_TO_FREELANCE'::"ReviewType" WHERE "type_new" IS NULL;

-- 3. Drop the old column and rename
ALTER TABLE "Review" DROP COLUMN "type";
ALTER TABLE "Review" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Review" ALTER COLUMN "type" SET NOT NULL;

-- ─── Indexes on Review ──────────────────────────────────────────────────

CREATE INDEX "Review_targetId_idx" ON "Review"("targetId");
CREATE INDEX "Review_authorId_idx" ON "Review"("authorId");
