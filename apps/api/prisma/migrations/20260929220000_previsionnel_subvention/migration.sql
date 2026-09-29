-- PRÉVU / RÉALISÉ D'UNE SUBVENTION (29/09/2026). Additive, rejouable.
CREATE TABLE IF NOT EXISTS "PrevisionnelEnveloppe" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "enveloppeId" TEXT NOT NULL,
    "fileId" TEXT,
    "nomFichier" TEXT,
    "origine" TEXT NOT NULL DEFAULT 'main',
    "intitule" TEXT,
    "periodeDebut" TIMESTAMP(3),
    "periodeFin" TIMESTAMP(3),
    "charges" JSONB NOT NULL DEFAULT '[]',
    "produits" JSONB NOT NULL DEFAULT '[]',
    "objectifs" JSONB NOT NULL DEFAULT '[]',
    "publics" JSONB NOT NULL DEFAULT '[]',
    "seuilEcart" INTEGER NOT NULL DEFAULT 15,
    "remarque" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrevisionnelEnveloppe_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PrevisionnelEnveloppe_enveloppeId_key" ON "PrevisionnelEnveloppe"("enveloppeId");
CREATE INDEX IF NOT EXISTS "PrevisionnelEnveloppe_accountId_idx" ON "PrevisionnelEnveloppe"("accountId");
DO $$ BEGIN
  ALTER TABLE "PrevisionnelEnveloppe" ADD CONSTRAINT "PrevisionnelEnveloppe_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PrevisionnelEnveloppe" ADD CONSTRAINT "PrevisionnelEnveloppe_enveloppeId_fkey" FOREIGN KEY ("enveloppeId") REFERENCES "EnveloppeFactures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
