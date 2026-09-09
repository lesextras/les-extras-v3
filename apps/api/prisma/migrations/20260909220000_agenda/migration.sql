-- L'AGENDA DE PILOTE.
--
-- Une seule table : les rendez-vous saisis à la main. Tout le reste de
-- l'agenda (sessions, échéances de dossiers, clôtures de formulaires,
-- péremptions de pièces, classes virtuelles) est LU dans les tables qui
-- portent déjà ces dates ; rien n'est recopié ici.
--
-- Migration écrite pour pouvoir être rejouée sans erreur.

DO $$
BEGIN
  CREATE TYPE "CategorieRendezVous" AS ENUM ('RENDEZ_VOUS', 'REUNION', 'APPEL', 'VISITE', 'ECHEANCE', 'AUTRE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "RendezVous" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT,
  "lieu" TEXT,
  "lien" TEXT,
  "debut" TIMESTAMP(3) NOT NULL,
  "fin" TIMESTAMP(3),
  "journeeEntiere" BOOLEAN NOT NULL DEFAULT false,
  "categorie" "CategorieRendezVous" NOT NULL DEFAULT 'RENDEZ_VOUS',
  "participants" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "rappelMinutes" INTEGER,
  "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
  "creeParId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RendezVous_accountId_debut_idx" ON "RendezVous"("accountId", "debut");

DO $$
BEGIN
  ALTER TABLE "RendezVous"
    ADD CONSTRAINT "RendezVous_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "RendezVous"
    ADD CONSTRAINT "RendezVous_creeParId_fkey"
    FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
