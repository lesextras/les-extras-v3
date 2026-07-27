-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0;
