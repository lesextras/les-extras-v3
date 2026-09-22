-- Le devis signé, déposé par le demandeur : ce dépôt vaut acceptation.
ALTER TYPE "FileKind" ADD VALUE 'QUOTE';
ALTER TABLE "Quote" ADD COLUMN "signedFileId" TEXT, ADD COLUMN "signedAt" TIMESTAMP(3);
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_signedFileId_fkey" FOREIGN KEY ("signedFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Quote_signedFileId_idx" ON "Quote"("signedFileId");
