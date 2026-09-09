-- Messagerie interne : fils d'assistance entre une personne inscrite et l'équipe.
DO $$ BEGIN
  CREATE TYPE "SupportStatut" AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportCategorie" AS ENUM ('PROBLEME_TECHNIQUE', 'QUESTION_COMPTE', 'RESERVATION', 'FACTURATION', 'FICHE_ATELIER', 'AUTRE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"              TEXT NOT NULL,
  "accountId"       TEXT,
  "userId"          TEXT NOT NULL,
  "sujet"           TEXT NOT NULL,
  "categorie"       "SupportCategorie" NOT NULL DEFAULT 'AUTRE',
  "statut"          "SupportStatut" NOT NULL DEFAULT 'OUVERT',
  "dernierAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "luParPersonneAt" TIMESTAMP(3),
  "luParEquipeAt"   TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id"        TEXT NOT NULL,
  "ticketId"  TEXT NOT NULL,
  "auteurId"  TEXT,
  "parEquipe" BOOLEAN NOT NULL DEFAULT false,
  "corps"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SupportTicket_statut_dernierAt_idx" ON "SupportTicket"("statut", "dernierAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_dernierAt_idx" ON "SupportTicket"("userId", "dernierAt");
CREATE INDEX IF NOT EXISTS "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_auteurId_fkey"
    FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
