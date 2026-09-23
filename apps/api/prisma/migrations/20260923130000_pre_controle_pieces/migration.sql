-- Pré-contrôle automatique des pièces : note de lecture et date.
ALTER TABLE "ComplianceDocument"
  ADD COLUMN "preControle" JSONB,
  ADD COLUMN "preControleLe" TIMESTAMP(3);
