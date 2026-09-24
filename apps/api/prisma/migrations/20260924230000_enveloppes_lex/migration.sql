-- Enveloppes LEX (24/09/2026) : un compte paie les générations d'autres
-- personnes, plafond mensuel par personne. Additive, sans perte.
CREATE TYPE "StatutEnveloppe" AS ENUM ('INVITEE', 'ACTIVE', 'SUSPENDUE', 'RETIREE');

ALTER TABLE "CreditLedger" ADD COLUMN IF NOT EXISTS "enveloppeId" TEXT;
CREATE INDEX IF NOT EXISTS "CreditLedger_enveloppeId_createdAt_idx" ON "CreditLedger"("enveloppeId", "createdAt");

CREATE TABLE "EnveloppeLex" (
    "id" TEXT NOT NULL,
    "payeurAccountId" TEXT NOT NULL,
    "beneficiaireId" TEXT,
    "email" TEXT NOT NULL,
    "plafondMensuel" INTEGER NOT NULL,
    "statut" "StatutEnveloppe" NOT NULL DEFAULT 'INVITEE',
    "partageTrames" BOOLEAN NOT NULL DEFAULT true,
    "jetonHash" TEXT,
    "jetonExpireLe" TIMESTAMP(3),
    "creeParId" TEXT NOT NULL,
    "accepteLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EnveloppeLex_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnveloppeLex_jetonHash_key" ON "EnveloppeLex"("jetonHash");
CREATE UNIQUE INDEX "EnveloppeLex_payeurAccountId_email_key" ON "EnveloppeLex"("payeurAccountId", "email");
CREATE INDEX "EnveloppeLex_beneficiaireId_statut_idx" ON "EnveloppeLex"("beneficiaireId", "statut");

ALTER TABLE "EnveloppeLex" ADD CONSTRAINT "EnveloppeLex_payeurAccountId_fkey" FOREIGN KEY ("payeurAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnveloppeLex" ADD CONSTRAINT "EnveloppeLex_beneficiaireId_fkey" FOREIGN KEY ("beneficiaireId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
