-- ============================================================================
--  L'ATTESTATION DE SUIVI : COMMANDE, PAIEMENT, DÉLIVRANCE
--  16/09/2026
-- ============================================================================
--
--  Écrite pour être REJOUABLE, comme toutes celles de ce dossier. Les
--  migrations s'appliquent au démarrage du conteneur API : une migration qui
--  échoue empêche le conteneur de démarrer, donc coupe le site.
--
--  CE QU'ELLE POSE
--  ---------------
--  1. `Formation.attestationPrixCents` — le prix ET l'interrupteur de la
--     vente. ⚠ NULL PARTOUT APRÈS CETTE MIGRATION : aucune fiche ne vend quoi
--     que ce soit tant qu'un montant n'est pas posé à la main. Le tunnel est
--     construit, il attend une décision qui n'est pas technique (le médiateur
--     de la consommation référencé CECMC, art. L612-1 c. conso).
--
--  2. `DemandeAttestation` — la commande. ⚠ SA CLÉ EST UN E-MAIL, PAS UN
--     COMPTE : les parcours gratuits se suivent sur la plateforme pédagogique
--     de l'association, sans compte Les Extras. Même choix que `VenteCours`.
--
--  ⚠ `stripeSessionId` EST UNIQUE, et c'est la clé d'idempotence du webhook :
--  une relivraison de Stripe retombe sur la même ligne et ne délivre pas deux
--  fois. Le partiel (`WHERE ... IS NOT NULL`) laisse coexister autant de
--  commandes non payées que nécessaire.
--
--  ⚠ `renonciationRetractation` EST FAUX PAR DÉFAUT. Le droit de rétractation
--  de quatorze jours ne s'éteint que sur demande expresse d'exécution immédiate
--  (art. L221-25 et L221-28, 1° c. conso) : c'est un geste de l'acheteur, pas
--  un réglage du vendeur. Sans lui, `livrableLe` porte la date de fin du délai
--  et la délivrance attend.

DO $$
BEGIN
  CREATE TYPE "StatutAttestation" AS ENUM (
    'EN_ATTENTE_PAIEMENT',
    'PAYEE',
    'DELIVREE',
    'ANNULEE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "attestationPrixCents" INTEGER;

CREATE TABLE IF NOT EXISTS "DemandeAttestation" (
  "id" TEXT NOT NULL,
  "formationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "prenom" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "montantCents" INTEGER NOT NULL,
  "statut" "StatutAttestation" NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
  "stripeSessionId" TEXT,
  "payeeLe" TIMESTAMP(3),
  "renonciationRetractation" BOOLEAN NOT NULL DEFAULT false,
  "livrableLe" TIMESTAMP(3),
  "delivreeLe" TIMESTAMP(3),
  "annuleeLe" TIMESTAMP(3),
  "motif" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- ⚠ Posé AVEC un défaut puis le défaut retiré juste après : sans lui,
  -- l'ALTER échouerait sur une table peuplée lors d'un rejeu ; en le gardant,
  -- `prisma migrate diff` signalerait une dérive contre `@updatedAt`.
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemandeAttestation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DemandeAttestation" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS "DemandeAttestation_stripeSessionId_key"
  ON "DemandeAttestation"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "DemandeAttestation_statut_idx"
  ON "DemandeAttestation"("statut");
CREATE INDEX IF NOT EXISTS "DemandeAttestation_email_idx"
  ON "DemandeAttestation"("email");
CREATE INDEX IF NOT EXISTS "DemandeAttestation_formationId_idx"
  ON "DemandeAttestation"("formationId");

DO $$
BEGIN
  ALTER TABLE "DemandeAttestation"
    ADD CONSTRAINT "DemandeAttestation_formationId_fkey"
    FOREIGN KEY ("formationId") REFERENCES "Formation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
