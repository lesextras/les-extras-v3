-- L'académie à parité avec Teachizy (24/09/2026) : compte apprenant, devoirs,
-- courriels automatiques, calendrier, communauté, salle de visio, réglages, clés d'API.
-- CreateEnum
CREATE TYPE "StatutRendu" AS ENUM ('A_CORRIGER', 'VALIDE', 'A_REPRENDRE');

-- CreateEnum
CREATE TYPE "TypeEmailEcole" AS ENUM ('BIENVENUE', 'FIN_FORMATION', 'DESINSCRIPTION', 'SUPPRESSION', 'ABANDON_1', 'ABANDON_2', 'INVITATION_NOUVEL', 'INVITATION_EXISTANT', 'LECON_ACCESSIBLE', 'RECAPITULATIF', 'MODIFICATION_ACCES', 'EXPIRATION_ACCES', 'DECROCHAGE_1', 'DECROCHAGE_2');

-- CreateTable
CREATE TABLE "CompteApprenant" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "prenom" TEXT,
    "nom" TEXT,
    "motDePasse" TEXT,
    "versionSession" INTEGER NOT NULL DEFAULT 0,
    "jetonReinit" TEXT,
    "jetonReinitExpire" TIMESTAMP(3),
    "derniereConnexion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteApprenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenduDevoir" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "leconId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "texte" TEXT,
    "fichiers" JSONB,
    "statut" "StatutRendu" NOT NULL DEFAULT 'A_CORRIGER',
    "note" INTEGER,
    "commentaire" TEXT,
    "corrigeLe" TIMESTAMP(3),
    "tentative" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenduDevoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeleEmailEcole" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "TypeEmailEcole" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "sujet" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "delaiMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeleEmailEcole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailProgramme" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "TypeEmailEcole" NOT NULL,
    "email" TEXT NOT NULL,
    "donnees" JSONB NOT NULL,
    "cle" TEXT NOT NULL,
    "du" TIMESTAMP(3) NOT NULL,
    "envoyeLe" TIMESTAMP(3),
    "echecs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvoiEmailEcole" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "TypeEmailEcole" NOT NULL,
    "cle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "envoyeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvoiEmailEcole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanierCours" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT,
    "stripeSessionId" TEXT NOT NULL,
    "payeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PanierCours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglageCours" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "dureeAccesJours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReglageCours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementEcole" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "lieu" TEXT,
    "lien" TEXT,
    "coursIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvenementEcole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalleClasse" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "salle" TEXT NOT NULL,
    "jetonAnimateur" TEXT NOT NULL,
    "ouverteLe" TIMESTAMP(3),
    "termineeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalleClasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionCommunaute" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionCommunaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EspaceCommunaute" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "collectionId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "icone" TEXT,
    "coursIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ecritureApprenants" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EspaceCommunaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationCommunaute" (
    "id" TEXT NOT NULL,
    "espaceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "compteApprenantId" TEXT,
    "auteurNom" TEXT NOT NULL,
    "parAcademie" BOOLEAN NOT NULL DEFAULT false,
    "titre" TEXT,
    "texte" TEXT NOT NULL,
    "epinglee" BOOLEAN NOT NULL DEFAULT false,
    "masquee" BOOLEAN NOT NULL DEFAULT false,
    "jaime" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationCommunaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentaireCommunaute" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "compteApprenantId" TEXT,
    "auteurNom" TEXT NOT NULL,
    "parAcademie" BOOLEAN NOT NULL DEFAULT false,
    "texte" TEXT NOT NULL,
    "masque" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentaireCommunaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglagesEcole" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "domaine" TEXT,
    "domaineVerifieLe" TIMESTAMP(3),
    "seoTitre" TEXT,
    "seoDescription" TEXT,
    "indexable" BOOLEAN NOT NULL DEFAULT true,
    "cgu" TEXT,
    "confidentialite" TEXT,
    "calendrierVisible" BOOLEAN NOT NULL DEFAULT true,
    "communauteActive" BOOLEAN NOT NULL DEFAULT false,
    "communauteDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReglagesEcole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleApiEcole" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prefixe" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "derniereUtilisation" TIMESTAMP(3),
    "revoqueeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleApiEcole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompteApprenant_jetonReinit_key" ON "CompteApprenant"("jetonReinit");

-- CreateIndex
CREATE UNIQUE INDEX "CompteApprenant_accountId_email_key" ON "CompteApprenant"("accountId", "email");

-- CreateIndex
CREATE INDEX "RenduDevoir_accountId_statut_idx" ON "RenduDevoir"("accountId", "statut");

-- CreateIndex
CREATE INDEX "RenduDevoir_coursId_idx" ON "RenduDevoir"("coursId");

-- CreateIndex
CREATE UNIQUE INDEX "RenduDevoir_inscriptionId_leconId_key" ON "RenduDevoir"("inscriptionId", "leconId");

-- CreateIndex
CREATE UNIQUE INDEX "ModeleEmailEcole_accountId_type_key" ON "ModeleEmailEcole"("accountId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EmailProgramme_cle_key" ON "EmailProgramme"("cle");

-- CreateIndex
CREATE INDEX "EmailProgramme_envoyeLe_du_idx" ON "EmailProgramme"("envoyeLe", "du");

-- CreateIndex
CREATE UNIQUE INDEX "EnvoiEmailEcole_cle_key" ON "EnvoiEmailEcole"("cle");

-- CreateIndex
CREATE INDEX "EnvoiEmailEcole_accountId_envoyeLe_idx" ON "EnvoiEmailEcole"("accountId", "envoyeLe");

-- CreateIndex
CREATE UNIQUE INDEX "PanierCours_stripeSessionId_key" ON "PanierCours"("stripeSessionId");

-- CreateIndex
CREATE INDEX "PanierCours_accountId_createdAt_idx" ON "PanierCours"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReglageCours_coursId_key" ON "ReglageCours"("coursId");

-- CreateIndex
CREATE INDEX "EvenementEcole_accountId_debut_idx" ON "EvenementEcole"("accountId", "debut");

-- CreateIndex
CREATE UNIQUE INDEX "SalleClasse_classeId_key" ON "SalleClasse"("classeId");

-- CreateIndex
CREATE UNIQUE INDEX "SalleClasse_salle_key" ON "SalleClasse"("salle");

-- CreateIndex
CREATE UNIQUE INDEX "SalleClasse_jetonAnimateur_key" ON "SalleClasse"("jetonAnimateur");

-- CreateIndex
CREATE INDEX "CollectionCommunaute_accountId_ordre_idx" ON "CollectionCommunaute"("accountId", "ordre");

-- CreateIndex
CREATE INDEX "EspaceCommunaute_accountId_ordre_idx" ON "EspaceCommunaute"("accountId", "ordre");

-- CreateIndex
CREATE INDEX "PublicationCommunaute_espaceId_createdAt_idx" ON "PublicationCommunaute"("espaceId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicationCommunaute_accountId_createdAt_idx" ON "PublicationCommunaute"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "CommentaireCommunaute_publicationId_createdAt_idx" ON "CommentaireCommunaute"("publicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReglagesEcole_accountId_key" ON "ReglagesEcole"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ReglagesEcole_domaine_key" ON "ReglagesEcole"("domaine");

-- CreateIndex
CREATE UNIQUE INDEX "CleApiEcole_empreinte_key" ON "CleApiEcole"("empreinte");

-- CreateIndex
CREATE INDEX "CleApiEcole_accountId_idx" ON "CleApiEcole"("accountId");

-- AddForeignKey
ALTER TABLE "RenduDevoir" ADD CONSTRAINT "RenduDevoir_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "InscriptionCours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenduDevoir" ADD CONSTRAINT "RenduDevoir_leconId_fkey" FOREIGN KEY ("leconId") REFERENCES "LeconCours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglageCours" ADD CONSTRAINT "ReglageCours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalleClasse" ADD CONSTRAINT "SalleClasse_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "ClasseVirtuelle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EspaceCommunaute" ADD CONSTRAINT "EspaceCommunaute_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CollectionCommunaute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationCommunaute" ADD CONSTRAINT "PublicationCommunaute_espaceId_fkey" FOREIGN KEY ("espaceId") REFERENCES "EspaceCommunaute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentaireCommunaute" ADD CONSTRAINT "CommentaireCommunaute_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "PublicationCommunaute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

