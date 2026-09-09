-- PAIEMENT EN LIGNE DES ATELIERS, encaisse directement par l'intervenant.
--
-- Ecrite idempotente : le conteneur rejoue les migrations au demarrage, et une
-- migration qui echoue sur un objet deja present bloque le demarrage entier.

-- ── L'option, sur la fiche de l'atelier ────────────────────────────────────
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "paiementEnLigne" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "annulationTexte" TEXT;

-- ── Le statut d'une reservation payee ──────────────────────────────────────
DO $$
BEGIN
  CREATE TYPE "StatutReservationAtelier" AS ENUM ('PAYEE', 'CONFIRMEE', 'REALISEE', 'ANNULEE', 'REMBOURSEE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- ── La reservation elle-meme ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReservationAtelier" (
  "id"                    TEXT NOT NULL,
  "serviceId"             TEXT NOT NULL,
  "accountId"             TEXT NOT NULL,
  "email"                 TEXT NOT NULL,
  "nom"                   TEXT,
  "telephone"             TEXT,
  "organisation"          TEXT,
  "message"               TEXT,
  "dateSouhaitee"         TIMESTAMP(3),
  "creneau"               TEXT,
  "participants"          INTEGER,
  "montantCents"          INTEGER NOT NULL,
  "partPlateformeCents"   INTEGER NOT NULL DEFAULT 0,
  "annulationTexte"       TEXT,
  "statut"                "StatutReservationAtelier" NOT NULL DEFAULT 'PAYEE',
  "stripeSessionId"       TEXT,
  "stripePaymentIntentId" TEXT,
  "payeeAt"               TIMESTAMP(3),
  "rembourseeAt"          TIMESTAMP(3),
  "montantRembourseCents" INTEGER,
  "noteInterne"           TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReservationAtelier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReservationAtelier_stripeSessionId_key" ON "ReservationAtelier"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "ReservationAtelier_accountId_statut_idx" ON "ReservationAtelier"("accountId", "statut");
CREATE INDEX IF NOT EXISTS "ReservationAtelier_serviceId_idx" ON "ReservationAtelier"("serviceId");
CREATE INDEX IF NOT EXISTS "ReservationAtelier_email_idx" ON "ReservationAtelier"("email");

ALTER TABLE "ReservationAtelier" DROP CONSTRAINT IF EXISTS "ReservationAtelier_serviceId_fkey";
ALTER TABLE "ReservationAtelier" ADD CONSTRAINT "ReservationAtelier_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReservationAtelier" DROP CONSTRAINT IF EXISTS "ReservationAtelier_accountId_fkey";
ALTER TABLE "ReservationAtelier" ADD CONSTRAINT "ReservationAtelier_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
