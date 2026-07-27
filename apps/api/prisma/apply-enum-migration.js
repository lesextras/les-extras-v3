/**
 * Applies the 20260216211200_add_cancelled_statuses_and_scheduled_at migration
 * SQL OUTSIDE a transaction. PostgreSQL cannot execute ALTER TYPE ... ADD VALUE
 * inside a transaction, which causes Prisma migrate deploy to fail repeatedly.
 *
 * This script runs each statement individually (auto-commit per statement),
 * then the entrypoint marks the migration as --applied so Prisma skips it.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "ReliefMissionStatus" ADD VALUE IF NOT EXISTS 'CANCELLED'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
  );
  console.log('Enum migration SQL applied outside transaction.');
}

main()
  .catch((e) => console.error('Enum migration warning:', e.message))
  .finally(() => prisma.$disconnect());
