-- Courriel de notification : opt-in par personne, actif par défaut.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifMailOptIn" BOOLEAN NOT NULL DEFAULT true;
