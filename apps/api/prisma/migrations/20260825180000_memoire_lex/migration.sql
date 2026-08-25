-- LA MÉMOIRE DE LEX — trois tables, aucune donnée existante touchée.
--
-- Idempotente, comme toutes les migrations du projet : rejouable sans dégât
-- sur une base déjà à jour.
--
-- Ce qui se stocke ici, et ce qui ne s'y stocke pas :
--   LexPreference  — des réglages de forme. Aucun nom, aucune situation.
--   LexMot         — un couple de mots. Jamais la phrase où il figurait.
--   LexPseudonyme  — une empreinte (hachage salé) et un pseudonyme. Le nom
--                    réel n'est écrit nulle part et ne peut pas être
--                    reconstitué depuis cette table.

CREATE TABLE IF NOT EXISTS "LexPreference" (
  "id"            TEXT NOT NULL,
  "accountId"     TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "trame"         "AssistantTrame" NOT NULL,
  "destinataire"  TEXT,
  "registre"      TEXT,
  "longueur"      TEXT,
  "sections"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "trameMaisonId" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LexPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LexPreference_userId_accountId_trame_key"
  ON "LexPreference" ("userId", "accountId", "trame");

CREATE TABLE IF NOT EXISTS "LexMot" (
  "id"        TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "source"    TEXT NOT NULL,
  "retenu"    TEXT NOT NULL,
  "vus"       INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LexMot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LexMot_accountId_source_key"
  ON "LexMot" ("accountId", "source");
CREATE INDEX IF NOT EXISTS "LexMot_accountId_vus_idx"
  ON "LexMot" ("accountId", "vus");

CREATE TABLE IF NOT EXISTS "LexPseudonyme" (
  "id"        TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "empreinte" TEXT NOT NULL,
  "pseudo"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LexPseudonyme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LexPseudonyme_accountId_empreinte_key"
  ON "LexPseudonyme" ("accountId", "empreinte");
CREATE UNIQUE INDEX IF NOT EXISTS "LexPseudonyme_accountId_pseudo_key"
  ON "LexPseudonyme" ("accountId", "pseudo");

-- Les clés étrangères sont posées séparément : sur une base déjà migrée, la
-- table existe et l'ajout doit être sauté sans faire échouer le déploiement.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LexPreference_accountId_fkey') THEN
    ALTER TABLE "LexPreference" ADD CONSTRAINT "LexPreference_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LexPreference_userId_fkey') THEN
    ALTER TABLE "LexPreference" ADD CONSTRAINT "LexPreference_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LexMot_accountId_fkey') THEN
    ALTER TABLE "LexMot" ADD CONSTRAINT "LexMot_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LexPseudonyme_accountId_fkey') THEN
    ALTER TABLE "LexPseudonyme" ADD CONSTRAINT "LexPseudonyme_accountId_fkey"
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
