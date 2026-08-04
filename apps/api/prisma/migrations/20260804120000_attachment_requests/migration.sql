-- CreateEnum
CREATE TYPE "AttachmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AttachmentRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterAccountId" TEXT NOT NULL,
    "establishmentAccountId" TEXT NOT NULL,
    "message" TEXT,
    "status" "AttachmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttachmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttachmentRequest_establishmentAccountId_status_idx" ON "AttachmentRequest"("establishmentAccountId", "status");

-- CreateIndex
CREATE INDEX "AttachmentRequest_requesterUserId_idx" ON "AttachmentRequest"("requesterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentRequest_requesterAccountId_establishmentAccountId_key" ON "AttachmentRequest"("requesterAccountId", "establishmentAccountId");

-- AddForeignKey
ALTER TABLE "AttachmentRequest" ADD CONSTRAINT "AttachmentRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentRequest" ADD CONSTRAINT "AttachmentRequest_requesterAccountId_fkey" FOREIGN KEY ("requesterAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentRequest" ADD CONSTRAINT "AttachmentRequest_establishmentAccountId_fkey" FOREIGN KEY ("establishmentAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentRequest" ADD CONSTRAINT "AttachmentRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
