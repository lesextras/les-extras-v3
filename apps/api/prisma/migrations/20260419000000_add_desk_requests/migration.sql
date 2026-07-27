-- CreateEnum
CREATE TYPE "DeskRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeskRequestType" AS ENUM ('MISSION_INFO_REQUEST');

-- CreateTable
CREATE TABLE "DeskRequest" (
    "id" TEXT NOT NULL,
    "type" "DeskRequestType" NOT NULL,
    "status" "DeskRequestStatus" NOT NULL DEFAULT 'OPEN',
    "missionId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeskRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeskRequest_requesterId_idx" ON "DeskRequest"("requesterId");

-- CreateIndex
CREATE INDEX "DeskRequest_missionId_idx" ON "DeskRequest"("missionId");

-- CreateIndex
CREATE INDEX "DeskRequest_status_idx" ON "DeskRequest"("status");

-- AddForeignKey
ALTER TABLE "DeskRequest" ADD CONSTRAINT "DeskRequest_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ReliefMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeskRequest" ADD CONSTRAINT "DeskRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeskRequest" ADD CONSTRAINT "DeskRequest_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
