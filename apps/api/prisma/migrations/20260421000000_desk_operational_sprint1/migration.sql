-- CreateEnum
CREATE TYPE "DeskRequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "DeskRequest"
ADD COLUMN "priority" "DeskRequestPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "assignedToAdminId" TEXT;

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminActionLog_adminId_idx" ON "AdminActionLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminActionLog_entityType_entityId_idx" ON "AdminActionLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminActionLog_action_idx" ON "AdminActionLog"("action");

-- CreateIndex
CREATE INDEX "DeskRequest_type_idx" ON "DeskRequest"("type");

-- CreateIndex
CREATE INDEX "DeskRequest_priority_idx" ON "DeskRequest"("priority");

-- CreateIndex
CREATE INDEX "DeskRequest_assignedToAdminId_idx" ON "DeskRequest"("assignedToAdminId");

-- AddForeignKey
ALTER TABLE "DeskRequest" ADD CONSTRAINT "DeskRequest_assignedToAdminId_fkey" FOREIGN KEY ("assignedToAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
