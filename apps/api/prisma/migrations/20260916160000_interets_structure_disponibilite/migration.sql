-- ============================================================================
--  CENTRES D'INTÉRÊT, SIRET DE STRUCTURE, FORMAT DE FICHE, VIVIER OUVERT
--  16/09/2026
-- ============================================================================
--
--  Écrite pour être REJOUABLE, comme toutes celles de ce dossier. Les
--  migrations s'appliquent au démarrage du conteneur API
--  (`docker-entrypoint.sh` → `prisma migrate deploy`) : une migration qui
--  échoue empêche le conteneur de démarrer, donc coupe le site. Chaque
--  instruction est donc conditionnelle.
--
--  CE QU'ELLE POSE, ET POURQUOI :
--
--  1. `Interet` — ce qu'une personne vient faire ici. Deux de ses valeurs sont
--     deux MONTAGES JURIDIQUES distincts : RENFORT_CDD (remplacer quelqu'un
--     sur un poste, ce qui ne se fait qu'en CDD salarié — CE 11/02/2025,
--     n° 491128) et RENFORT_PERSONNALISE (intervenir en plus, sur un besoin
--     nommé, facturé par la structure de l'intervenant).
--
--  2. `Account.interets` — la liste déclarée. VIDE = pas encore déclaré, et
--     aucune règle ne doit refuser quoi que ce soit sur une liste vide : tous
--     les comptes existants l'ont vide.
--
--  3. `Structure.siret` — c'est le SIRET, pas le SIREN, qui s'imprime sur une
--     facture. Sans unicité : le SIREN dédoublonne déjà.
--
--  4. `Service.format` — COLLECTIF (un atelier) ou INDIVIDUEL (un renfort
--     personnalisé). ⚠ Le défaut COLLECTIF vaut pour les fiches existantes, et
--     c'est exact : les dix-sept fiches en ligne sont toutes des ateliers.
--
--  5. `DisponibiliteRenfort` — le vivier ouvert, distinct de `PoolMember`
--     (qui est, lui, le carnet d'adresses d'un établissement).
--
--  ⚠ POINT DÉLICAT, LE MÊME QU'EN AOÛT : `ALTER TYPE ... ADD VALUE` n'accepte
--  qu'une valeur par instruction, et `CREATE TYPE IF NOT EXISTS` n'existe pas
--  en PostgreSQL — d'où les blocs `DO $$ ... EXCEPTION WHEN duplicate_object`.
-- ============================================================================

-- 1. Les deux énumérations ------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "Interet" AS ENUM (
    'ATELIERS',
    'FORMATIONS',
    'RENFORT_CDD',
    'RENFORT_PERSONNALISE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FormatIntervention" AS ENUM ('COLLECTIF', 'INDIVIDUEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Les colonnes ajoutées -------------------------------------------------

-- Tableau d'enum : ni NOT NULL ni DEFAULT, comme `Membership.capacites`.
-- PostgreSQL rend alors NULL, que Prisma lit comme un tableau vide.
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "interets" "Interet"[];

ALTER TABLE "Structure" ADD COLUMN IF NOT EXISTS "siret" TEXT;

-- ⚠ AVEC défaut ET NOT NULL : la table est peuplée, et toute fiche existante
-- est un atelier collectif. Sans défaut, l'ALTER échouerait sur les lignes
-- déjà là — c'est exactement le piège rencontré sur `Message.updatedAt`.
ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "format" "FormatIntervention" NOT NULL DEFAULT 'COLLECTIF';

-- 3. Le vivier ouvert ------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DisponibiliteRenfort" (
  "id"           TEXT NOT NULL,
  "accountId"    TEXT NOT NULL,
  "actif"        BOOLEAN NOT NULL DEFAULT false,
  "montages"     "Interet"[],
  "metier"       TEXT,
  "departements" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "presentation" TEXT,
  "aPartirDu"    TIMESTAMP(3),
  "confirmeeLe"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "enVeille"     BOOLEAN NOT NULL DEFAULT false,
  "relanceeLe"   TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisponibiliteRenfort_pkey" PRIMARY KEY ("id")
);

-- ⚠ `updatedAt` EST POSÉ AVEC UN DÉFAUT PUIS LE PERD, exactement comme
-- `Message.updatedAt` en septembre. Le défaut permet à l'instruction de passer
-- si la table existe déjà et porte des lignes ; Prisma, lui, ne déclare aucun
-- défaut sur un `@updatedAt` (c'est le client qui écrit la valeur). Sans ce
-- retrait, `migrate diff` signale une dérive à chaque contrôle.
ALTER TABLE "DisponibiliteRenfort" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS "DisponibiliteRenfort_accountId_key"
  ON "DisponibiliteRenfort"("accountId");
CREATE INDEX IF NOT EXISTS "DisponibiliteRenfort_actif_enVeille_idx"
  ON "DisponibiliteRenfort"("actif", "enVeille");
CREATE INDEX IF NOT EXISTS "DisponibiliteRenfort_confirmeeLe_idx"
  ON "DisponibiliteRenfort"("confirmeeLe");

DO $$ BEGIN
  ALTER TABLE "DisponibiliteRenfort"
    ADD CONSTRAINT "DisponibiliteRenfort_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
