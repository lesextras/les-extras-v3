-- ---------------------------------------------------------------------------
-- STRUCTURE → ÉTABLISSEMENT → SERVICE, NIVEAUX DE RESPONSABILITÉ, MESSAGERIE
-- 16/09/2026
-- ---------------------------------------------------------------------------
--
-- Écrite pour être REJOUABLE. Les migrations s'appliquent au démarrage du
-- conteneur API (`docker-entrypoint.sh` → `prisma migrate deploy`) : une
-- migration qui échoue empêche le conteneur de démarrer, donc coupe le site.
-- Tout est donc en IF EXISTS / IF NOT EXISTS, et les contraintes qui n'ont pas
-- d'équivalent conditionnel passent par un bloc DO.
--
-- DEUX POINTS DÉLICATS, à lire avant d'y toucher :
--
--   1. `Message.updatedAt` est NOT NULL sans défaut dans le schéma Prisma
--      (`@updatedAt`). Ajouté tel quel sur une table qui porte déjà des lignes,
--      l'ALTER échoue. On l'ajoute AVEC un défaut, ce qui remplit l'existant,
--      puis on retire le défaut pour ne pas laisser de dérive derrière soi.
--
--   2. `OrgUnit.nomNormalise` reçoit un index UNIQUE (accountId, nomNormalise).
--      Les lignes existantes valent toutes '' : deux services d'un même
--      établissement violeraient la contrainte à la création de l'index. Le
--      remplissage se fait donc AVANT, et il désambiguïse les doublons déjà en
--      base au lieu de faire échouer la migration — on ne casse pas un
--      déploiement pour des données qui existaient avant la règle.

-- ---------------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "NiveauResponsabilite" AS ENUM ('DIRECTION', 'RESPONSABLE', 'SALARIE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PorteeService" AS ENUM ('RATTACHEMENT', 'ENCADREMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrigineVerification" AS ENUM ('INVITATION', 'RESPONSABLE', 'DIRECTION', 'LES_EXTRAS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Capacite" AS ENUM ('RESERVER_DIRECT', 'DEMANDER_DEVIS', 'DEMANDER_RENFORT_INTERNE', 'OUVRIR_RENFORT_CDD', 'GERER_PLANNING', 'VALIDER_INSCRIPTIONS', 'VOIR_FACTURES', 'SIGNER_CONVENTIONS', 'INVITER_MEMBRES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MotifDemandeService" AS ENUM ('REJOINDRE', 'SIGNALEMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TypeConversation" AS ENUM ('MISSION', 'INTERNE', 'SERVICE', 'INTERVENANT', 'SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TypeMessage" AS ENUM ('TEXTE', 'SYSTEME');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "FileKind" ADD VALUE IF NOT EXISTS 'MESSAGE';

-- ---------------------------------------------------------------------------
-- 2. Structure
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Structure" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomNormalise" TEXT NOT NULL,
    "siren" TEXT,
    "formeJuridique" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "codePostal" TEXT,
    "verifiee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Structure_nomNormalise_key" ON "Structure"("nomNormalise");
CREATE UNIQUE INDEX IF NOT EXISTS "Structure_siren_key" ON "Structure"("siren");
CREATE INDEX IF NOT EXISTS "Structure_nomNormalise_idx" ON "Structure"("nomNormalise");

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "structureId" TEXT;
CREATE INDEX IF NOT EXISTS "Account_structureId_idx" ON "Account"("structureId");

DO $$ BEGIN
  ALTER TABLE "Account" ADD CONSTRAINT "Account_structureId_fkey"
    FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. OrgUnit : nom normalisé, créateur, archivage
-- ---------------------------------------------------------------------------

ALTER TABLE "OrgUnit" ADD COLUMN IF NOT EXISTS "nomNormalise" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrgUnit" ADD COLUMN IF NOT EXISTS "creeParId" TEXT;
ALTER TABLE "OrgUnit" ADD COLUMN IF NOT EXISTS "archiveLe" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_creeParId_fkey"
    FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Remplissage AVANT l'index unique. La normalisation reproduit exactement celle
-- de `src/common/normaliser.ts` : minuscules, accents retirés, tout ce qui
-- n'est ni lettre ni chiffre supprimé. `translate` évite de dépendre de
-- l'extension `unaccent`, qui n'est pas installée en production.
UPDATE "OrgUnit" o
SET "nomNormalise" = CASE
      WHEN n."base" = '' THEN o."id"
      WHEN n."rang" = 1  THEN n."base"
      ELSE n."base" || '-' || n."rang"::text
    END
FROM (
  SELECT
    "id",
    "base",
    row_number() OVER (PARTITION BY "accountId", "base" ORDER BY "createdAt", "id") AS "rang"
  FROM (
    SELECT
      "id",
      "accountId",
      "createdAt",
      regexp_replace(
        lower(translate(
          "name",
          'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝŸýÿ',
          'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOOooooooUUUUuuuuYYyy'
        )),
        '[^a-z0-9]', '', 'g'
      ) AS "base"
    FROM "OrgUnit"
  ) AS "brut"
) AS n
WHERE o."id" = n."id" AND o."nomNormalise" = '';

CREATE UNIQUE INDEX IF NOT EXISTS "OrgUnit_accountId_nomNormalise_key" ON "OrgUnit"("accountId", "nomNormalise");

-- ---------------------------------------------------------------------------
-- 4. Membership : niveau, poste, vérification, parrainage, capacités
-- ---------------------------------------------------------------------------

ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "niveau" "NiveauResponsabilite" NOT NULL DEFAULT 'SALARIE';
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "niveauValide" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "poste" TEXT;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "cadre" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "verifie" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "origineVerification" "OrigineVerification";
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "verifieParId" TEXT;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "verifieLe" TIMESTAMP(3);
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "parrainMembershipId" TEXT;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "capacites" "Capacite"[];
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "masqueOrganigramme" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Membership_accountId_niveau_idx" ON "Membership"("accountId", "niveau");
CREATE INDEX IF NOT EXISTS "Membership_parrainMembershipId_idx" ON "Membership"("parrainMembershipId");

DO $$ BEGIN
  ALTER TABLE "Membership" ADD CONSTRAINT "Membership_verifieParId_fkey"
    FOREIGN KEY ("verifieParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Membership" ADD CONSTRAINT "Membership_parrainMembershipId_fkey"
    FOREIGN KEY ("parrainMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- REPRISE DE L'EXISTANT. Les rattachements déjà en base ont été créés par
-- invitation acceptée ou par une décision d'établissement : leur appartenance
-- au compte est acquise, ils sont donc VÉRIFIÉS. Leur NIVEAU, lui, reste à
-- déclarer — un OWNER de compte établissement n'est pas forcément un directeur,
-- et la migration n'a aucun moyen de le savoir. `niveauValide` reste à faux.
UPDATE "Membership"
SET "verifie" = true,
    "origineVerification" = 'INVITATION'
WHERE "verifie" = false AND "origineVerification" IS NULL;

-- ---------------------------------------------------------------------------
-- 5. Services d'un membre / d'une invitation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "MembershipService" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "portee" "PorteeService" NOT NULL DEFAULT 'RATTACHEMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MembershipService_orgUnitId_portee_idx" ON "MembershipService"("orgUnitId", "portee");
CREATE UNIQUE INDEX IF NOT EXISTS "MembershipService_membershipId_orgUnitId_portee_key" ON "MembershipService"("membershipId", "orgUnitId", "portee");

DO $$ BEGIN
  ALTER TABLE "MembershipService" ADD CONSTRAINT "MembershipService_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MembershipService" ADD CONSTRAINT "MembershipService_orgUnitId_fkey"
    FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "InvitationService" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "portee" "PorteeService" NOT NULL DEFAULT 'RATTACHEMENT',
    CONSTRAINT "InvitationService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InvitationService_orgUnitId_idx" ON "InvitationService"("orgUnitId");
CREATE UNIQUE INDEX IF NOT EXISTS "InvitationService_invitationId_orgUnitId_portee_key" ON "InvitationService"("invitationId", "orgUnitId", "portee");

DO $$ BEGIN
  ALTER TABLE "InvitationService" ADD CONSTRAINT "InvitationService_invitationId_fkey"
    FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "InvitationService" ADD CONSTRAINT "InvitationService_orgUnitId_fkey"
    FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Le service principal déjà renseigné devient un rattachement explicite.
INSERT INTO "MembershipService" ("id", "membershipId", "orgUnitId", "portee", "createdAt")
SELECT
  'mssvc_' || m."id",
  m."id",
  m."orgUnitId",
  'RATTACHEMENT',
  CURRENT_TIMESTAMP
FROM "Membership" m
WHERE m."orgUnitId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Invitation : niveau, capacités, mot d'accompagnement
-- ---------------------------------------------------------------------------

ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "niveau" "NiveauResponsabilite" NOT NULL DEFAULT 'SALARIE';
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "capacites" "Capacite"[];
ALTER TABLE "Invitation" ADD COLUMN IF NOT EXISTS "message" TEXT;

-- ---------------------------------------------------------------------------
-- 7. Demandes (niveau Direction, service en doublon)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "DemandeNiveau" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "niveauDemande" "NiveauResponsabilite" NOT NULL,
    "justification" TEXT,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "decideParId" TEXT,
    "decideLe" TIMESTAMP(3),
    "motifRefus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemandeNiveau_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DemandeNiveau_membershipId_key" ON "DemandeNiveau"("membershipId");
CREATE INDEX IF NOT EXISTS "DemandeNiveau_statut_idx" ON "DemandeNiveau"("statut");

DO $$ BEGIN
  ALTER TABLE "DemandeNiveau" ADD CONSTRAINT "DemandeNiveau_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DemandeNiveau" ADD CONSTRAINT "DemandeNiveau_decideParId_fkey"
    FOREIGN KEY ("decideParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "DemandeService" (
    "id" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "demandeurId" TEXT NOT NULL,
    "motif" "MotifDemandeService" NOT NULL,
    "message" TEXT,
    "statut" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "decideParId" TEXT,
    "decideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemandeService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DemandeService_orgUnitId_statut_idx" ON "DemandeService"("orgUnitId", "statut");
CREATE INDEX IF NOT EXISTS "DemandeService_accountId_statut_idx" ON "DemandeService"("accountId", "statut");
CREATE INDEX IF NOT EXISTS "DemandeService_motif_statut_idx" ON "DemandeService"("motif", "statut");

DO $$ BEGIN
  ALTER TABLE "DemandeService" ADD CONSTRAINT "DemandeService_orgUnitId_fkey"
    FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DemandeService" ADD CONSTRAINT "DemandeService_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DemandeService" ADD CONSTRAINT "DemandeService_demandeurId_fkey"
    FOREIGN KEY ("demandeurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DemandeService" ADD CONSTRAINT "DemandeService_decideParId_fkey"
    FOREIGN KEY ("decideParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 8. Messagerie
-- ---------------------------------------------------------------------------

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "type" "TypeConversation" NOT NULL DEFAULT 'MISSION';
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "sujet" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "orgUnitId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "fermee" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "dernierMessageAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE INDEX IF NOT EXISTS "Conversation_accountId_type_idx" ON "Conversation"("accountId", "type");
CREATE INDEX IF NOT EXISTS "Conversation_orgUnitId_idx" ON "Conversation"("orgUnitId");
CREATE INDEX IF NOT EXISTS "Conversation_dernierMessageAt_idx" ON "Conversation"("dernierMessageAt");

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_orgUnitId_fkey"
    FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "luJusquA" TIMESTAMP(3),
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "quitteLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userId_quitteLe_idx" ON "ConversationParticipant"("userId", "quitteLe");

DO $$ BEGIN
  ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- `updatedAt` : ajouté AVEC défaut pour remplir l'existant, puis défaut retiré
-- pour rester conforme au schéma Prisma (`@updatedAt` n'a pas de défaut SQL).
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Message" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "type" "TypeMessage" NOT NULL DEFAULT 'TEXTE';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "coordonneesMasquees" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "modifieLe" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "supprimeLe" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "signaleLe" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "signaleParId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "motifSignalement" TEXT;

CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_signaleLe_idx" ON "Message"("signaleLe");

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_signaleParId_fkey"
    FOREIGN KEY ("signaleParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "MessagePiece" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessagePiece_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessagePiece_messageId_fileAssetId_key" ON "MessagePiece"("messageId", "fileAssetId");
CREATE INDEX IF NOT EXISTS "MessagePiece_fileAssetId_idx" ON "MessagePiece"("fileAssetId");

DO $$ BEGIN
  ALTER TABLE "MessagePiece" ADD CONSTRAINT "MessagePiece_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MessagePiece" ADD CONSTRAINT "MessagePiece_fileAssetId_fkey"
    FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- REPRISE DES FILS EXISTANTS. Sans participants, un fil déjà en base
-- n'apparaîtrait dans la boîte de personne : la messagerie ouvrirait sur une
-- liste vide alors que les échanges sont là. On reconstruit la liste depuis
-- les auteurs des messages, et on renseigne la date du dernier message.
INSERT INTO "ConversationParticipant" ("id", "conversationId", "userId", "notifications", "createdAt")
SELECT DISTINCT
  'cpart_' || m."conversationId" || '_' || m."senderId",
  m."conversationId",
  m."senderId",
  true,
  CURRENT_TIMESTAMP
FROM "Message" m
ON CONFLICT DO NOTHING;

UPDATE "Conversation" c
SET "dernierMessageAt" = d."dernier"
FROM (
  SELECT "conversationId", MAX("createdAt") AS "dernier"
  FROM "Message"
  GROUP BY "conversationId"
) d
WHERE c."id" = d."conversationId" AND c."dernierMessageAt" IS NULL;
