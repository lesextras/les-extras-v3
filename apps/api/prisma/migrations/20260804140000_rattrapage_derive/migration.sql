-- RATTRAPAGE DE DÉRIVE (reconstruit le 4/8/2026).
-- Entre add_audit_log et lex_trial, une quinzaine de tables (Quote, FileAsset,
-- TrameMaison, Question/Answer, etc.) et de nombreuses colonnes ont été posées
-- via db push sans migration. Ce fichier comble l'écart : après lui, le rejeu
-- complet de l'historique aboutit exactement au schema.prisma courant
-- (vérifié : prisma migrate diff = vide).

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('REQUESTED', 'SENT', 'ACCEPTED', 'REFUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CreditPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

-- CreateEnum
CREATE TYPE "ArticleKind" AS ENUM ('ACTUALITE', 'ARTICLE');

-- CreateEnum
CREATE TYPE "ModeAttribution" AS ENUM ('AUTOMATIQUE', 'FILE_ENGAGEMENT');

-- CreateEnum
CREATE TYPE "CibleDiffusion" AS ENUM ('RESEAU', 'CONNUS', 'UNITE', 'SELECTION');

-- CreateEnum
CREATE TYPE "EngagementStatut" AS ENUM ('EN_ATTENTE', 'PRESENTE', 'ACCEPTE', 'REFUSE', 'RETIRE', 'CADUC');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CONGE', 'RTT', 'MALADIE', 'SANS_SOLDE', 'AUTRE');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REFUSE');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('COMPLIANCE', 'MISSION', 'AVATAR', 'FORMATION', 'ARTICLE', 'TRAME');

-- CreateEnum
CREATE TYPE "AssistantTrame" AS ENUM ('NOTE_OBSERVATION', 'RAPPORT_SITUATION', 'TRANSMISSION', 'SYNTHESE_REUNION', 'COMPTE_RENDU_ATELIER', 'COURRIER_AUTORITE_PARENTALE', 'COURRIER_PARTENAIRE', 'BILAN_FIN_ACCOMPAGNEMENT');

-- CreateEnum
CREATE TYPE "PorteeTrame" AS ENUM ('PERSONNELLE', 'ETABLISSEMENT');

-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('PREMIERE_FICHE', 'PUBLICATION', 'ARTICLE', 'MISSION', 'AVIS', 'IDEE', 'REPONSE', 'REPONSE_RETENUE', 'PARRAINAGE', 'MANUEL', 'DEPENSE');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('NEW', 'PLANNED', 'DONE', 'DECLINED');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OUVERTE', 'RESOLUE', 'FERMEE');

-- AlterEnum
ALTER TYPE "ComplianceDocType" ADD VALUE 'DIPLOMA';

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'ANONYMIZED';

-- DropIndex
DROP INDEX "Article_status_idx";

-- DropIndex
DROP INDEX "Invitation_orgUnitId_idx";

-- DropIndex
DROP INDEX "Review_bookingId_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "commissionRate" DECIMAL(5,4),
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "isMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parrainAccountId" TEXT,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceCampaign" TEXT,
ADD COLUMN     "sourceLanding" TEXT,
ADD COLUMN     "sourceMedium" TEXT,
ADD COLUMN     "validationMissions" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "kind" "ArticleKind" NOT NULL DEFAULT 'ACTUALITE',
ADD COLUMN     "linkedinSharedAt" TIMESTAMP(3),
ADD COLUMN     "linkedinUrn" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ComplianceDocument" ADD COLUMN     "fileId" TEXT;

-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileId" TEXT;

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "city" TEXT,
ADD COLUMN     "evaluation" TEXT,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "methodology" TEXT,
ADD COLUMN     "requestsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "payerAccountId" TEXT;

-- AlterTable
ALTER TABLE "ReliefMission" ADD COLUMN     "alerteNonPourvueAt" TIMESTAMP(3),
ADD COLUMN     "attachmentId" TEXT,
ADD COLUMN     "attenteValidation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cibleDiffusion" "CibleDiffusion" NOT NULL DEFAULT 'RESEAU',
ADD COLUMN     "derniereVagueAt" TIMESTAMP(3),
ADD COLUMN     "destinatairesIntervenants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "destinatairesSalaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "diffusionVague" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "modeAttribution" "ModeAttribution" NOT NULL DEFAULT 'AUTOMATIQUE',
ADD COLUMN     "recurrence" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "missionId" TEXT,
ADD COLUMN     "serviceId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "evaluation" TEXT,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "material" TEXT,
ADD COLUMN     "methodology" TEXT,
ADD COLUMN     "objectives" TEXT,
ADD COLUMN     "prerequisites" TEXT,
ADD COLUMN     "priceExtras" JSONB,
ADD COLUMN     "publicTargets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "qualiopi" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "timeSlots" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarFileId" TEXT,
ADD COLUMN     "hebdoOptIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkedinAccessToken" TEXT,
ADD COLUMN     "linkedinExpiresAt" TIMESTAMP(3),
ADD COLUMN     "linkedinName" TEXT,
ADD COLUMN     "linkedinUrn" TEXT;

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "serviceId" TEXT,
    "missionId" TEXT,
    "title" TEXT NOT NULL,
    "request" TEXT,
    "message" TEXT,
    "lines" JSONB,
    "amount" DECIMAL(10,2),
    "status" "QuoteStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "refusalReason" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPurchase" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "stripeSessionId" TEXT NOT NULL,
    "status" "CreditPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionEngagement" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "rang" INTEGER NOT NULL,
    "statut" "EngagementStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "message" TEXT,
    "presenteAt" TIMESTAMP(3),
    "relanceAt" TIMESTAMP(3),
    "decideAt" TIMESTAMP(3),
    "motifRefus" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'CONGE',
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "statut" "LeaveStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "decideurId" TEXT,
    "decideLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "kind" "FileKind" NOT NULL,
    "uploaderId" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrameMaison" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "genre" "AssistantTrame",
    "portee" "PorteeTrame" NOT NULL DEFAULT 'PERSONNELLE',
    "squelette" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "extrait" TEXT,
    "sourceFileId" TEXT,
    "usages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrameMaison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantDocument" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "trame" "AssistantTrame" NOT NULL,
    "trameMaisonId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantFeedback" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trame" "AssistantTrame" NOT NULL,
    "utile" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPoint" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "PointReason" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'NEW',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaVote" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "tente" TEXT,
    "metier" TEXT NOT NULL,
    "publicVise" TEXT NOT NULL,
    "anonyme" BOOLEAN NOT NULL DEFAULT true,
    "status" "QuestionStatus" NOT NULL DEFAULT 'OUVERTE',
    "views" INTEGER NOT NULL DEFAULT 0,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "anonyme" BOOLEAN NOT NULL DEFAULT true,
    "retenue" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerVote" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "appareil" TEXT,
    "dernierOk" TIMESTAMP(3),
    "echecs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglage" (
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_reference_key" ON "Quote"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_bookingId_key" ON "Quote"("bookingId");

-- CreateIndex
CREATE INDEX "Quote_clientAccountId_idx" ON "Quote"("clientAccountId");

-- CreateIndex
CREATE INDEX "Quote_providerAccountId_idx" ON "Quote"("providerAccountId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_accountId_key" ON "Subscription"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPurchase_stripeSessionId_key" ON "CreditPurchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "CreditPurchase_accountId_idx" ON "CreditPurchase"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionEngagement_bookingId_key" ON "MissionEngagement"("bookingId");

-- CreateIndex
CREATE INDEX "MissionEngagement_missionId_statut_idx" ON "MissionEngagement"("missionId", "statut");

-- CreateIndex
CREATE INDEX "MissionEngagement_accountId_idx" ON "MissionEngagement"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionEngagement_missionId_accountId_key" ON "MissionEngagement"("missionId", "accountId");

-- CreateIndex
CREATE INDEX "LeaveRequest_accountId_statut_idx" ON "LeaveRequest"("accountId", "statut");

-- CreateIndex
CREATE INDEX "LeaveRequest_userId_debut_idx" ON "LeaveRequest"("userId", "debut");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");

-- CreateIndex
CREATE INDEX "FileAsset_uploaderId_idx" ON "FileAsset"("uploaderId");

-- CreateIndex
CREATE INDEX "FileAsset_accountId_idx" ON "FileAsset"("accountId");

-- CreateIndex
CREATE INDEX "FileAsset_kind_idx" ON "FileAsset"("kind");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_serviceId_idx" ON "Favorite"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_serviceId_key" ON "Favorite"("userId", "serviceId");

-- CreateIndex
CREATE INDEX "TrameMaison_accountId_portee_idx" ON "TrameMaison"("accountId", "portee");

-- CreateIndex
CREATE INDEX "TrameMaison_authorId_idx" ON "TrameMaison"("authorId");

-- CreateIndex
CREATE INDEX "AssistantDocument_accountId_createdAt_idx" ON "AssistantDocument"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantDocument_authorId_idx" ON "AssistantDocument"("authorId");

-- CreateIndex
CREATE INDEX "AssistantFeedback_trame_utile_idx" ON "AssistantFeedback"("trame", "utile");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_accountId_createdAt_idx" ON "LoyaltyPoint"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "Idea_status_createdAt_idx" ON "Idea"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaVote_ideaId_userId_key" ON "IdeaVote"("ideaId", "userId");

-- CreateIndex
CREATE INDEX "Question_status_createdAt_idx" ON "Question"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Question_metier_idx" ON "Question"("metier");

-- CreateIndex
CREATE INDEX "Question_publicVise_idx" ON "Question"("publicVise");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerVote_answerId_userId_key" ON "AnswerVote"("answerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Account_source_idx" ON "Account"("source");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_status_kind_publishedAt_idx" ON "Article"("status", "kind", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_accountId_idx" ON "Article"("accountId");

-- CreateIndex
CREATE INDEX "ContactRequest_source_idx" ON "ContactRequest"("source");

-- CreateIndex
CREATE INDEX "Invoice_payerAccountId_idx" ON "Invoice"("payerAccountId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_serviceId_idx" ON "Review"("serviceId");

-- CreateIndex
CREATE INDEX "Review_missionId_idx" ON "Review"("missionId");

-- CreateIndex
CREATE INDEX "Service_sourceId_idx" ON "Service"("sourceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliefMission" ADD CONSTRAINT "ReliefMission_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ReliefMission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ReliefMission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_payerAccountId_fkey" FOREIGN KEY ("payerAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEngagement" ADD CONSTRAINT "MissionEngagement_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ReliefMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEngagement" ADD CONSTRAINT "MissionEngagement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEngagement" ADD CONSTRAINT "MissionEngagement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrameMaison" ADD CONSTRAINT "TrameMaison_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrameMaison" ADD CONSTRAINT "TrameMaison_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrameMaison" ADD CONSTRAINT "TrameMaison_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantDocument" ADD CONSTRAINT "AssistantDocument_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantDocument" ADD CONSTRAINT "AssistantDocument_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantDocument" ADD CONSTRAINT "AssistantDocument_trameMaisonId_fkey" FOREIGN KEY ("trameMaisonId") REFERENCES "TrameMaison"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPoint" ADD CONSTRAINT "LoyaltyPoint_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaVote" ADD CONSTRAINT "IdeaVote_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVote" ADD CONSTRAINT "AnswerVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

