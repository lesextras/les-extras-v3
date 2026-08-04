-- DropIndex
DROP INDEX "Invoice_number_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "vatMention" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_accountId_number_key" ON "Invoice"("accountId", "number");
