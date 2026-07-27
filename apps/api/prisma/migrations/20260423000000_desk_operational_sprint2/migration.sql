-- CreateEnum
CREATE TYPE "ContactBypassBlockedReason" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'TELEGRAM', 'EXTERNAL_URL');

-- CreateTable
CREATE TABLE "ContactBypassEvent" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "senderId" TEXT NOT NULL,
    "blockedReason" "ContactBypassBlockedReason" NOT NULL,
    "rawExcerpt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactBypassEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactBypassEvent_createdAt_idx" ON "ContactBypassEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ContactBypassEvent_blockedReason_idx" ON "ContactBypassEvent"("blockedReason");

-- CreateIndex
CREATE INDEX "ContactBypassEvent_senderId_idx" ON "ContactBypassEvent"("senderId");

-- CreateIndex
CREATE INDEX "ContactBypassEvent_conversationId_idx" ON "ContactBypassEvent"("conversationId");

-- AddForeignKey
ALTER TABLE "ContactBypassEvent" ADD CONSTRAINT "ContactBypassEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactBypassEvent" ADD CONSTRAINT "ContactBypassEvent_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
