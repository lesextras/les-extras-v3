-- Add password reset fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_resetToken_key" UNIQUE ("resetToken");
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;
