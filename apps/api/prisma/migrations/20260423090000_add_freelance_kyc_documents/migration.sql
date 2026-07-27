DO $$
BEGIN
    ALTER TYPE "DocumentType" ADD VALUE 'CV';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DocumentType" ADD VALUE 'DIPLOMA';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DocumentType" ADD VALUE 'AUTO_ENTREPRENEUR_CERTIFICATE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DocumentType" ADD VALUE 'DRIVER_LICENSE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DocumentType" ADD VALUE 'CRIMINAL_RECORD';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE "DocumentType" ADD VALUE 'RIB';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Document"
ADD COLUMN IF NOT EXISTS "status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "storagePath" TEXT,
ADD COLUMN IF NOT EXISTS "reviewReason" TEXT,
ADD COLUMN IF NOT EXISTS "reviewedById" TEXT,
ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "Document"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "Document"
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Document_reviewedById_idx" ON "Document"("reviewedById");
CREATE INDEX IF NOT EXISTS "Document_status_idx" ON "Document"("status");

DO $$
BEGIN
    ALTER TABLE "Document"
    ADD CONSTRAINT "Document_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
