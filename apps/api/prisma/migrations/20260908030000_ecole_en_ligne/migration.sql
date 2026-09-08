-- L'école en ligne d'une académie : cours, chapitres, leçons, apprenants,
-- ventes, codes promo, packs, classes virtuelles, vitrine et affiliation.

CREATE TYPE "StatutCours" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');
CREATE TYPE "NiveauCours" AS ENUM ('TOUS', 'DEBUTANT', 'INTERMEDIAIRE', 'AVANCE');
CREATE TYPE "TypeLecon" AS ENUM ('TEXTE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'QUIZ', 'DEVOIR', 'LIVE');
CREATE TYPE "StatutInscriptionCours" AS ENUM ('ACTIVE', 'SUSPENDUE', 'TERMINEE');
CREATE TYPE "TypeRemise" AS ENUM ('POURCENTAGE', 'MONTANT');
CREATE TYPE "StatutVente" AS ENUM ('EN_ATTENTE', 'PAYEE', 'REMBOURSEE', 'ANNULEE');

CREATE TABLE "Cours" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sousTitre" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "bandeAnnonceUrl" TEXT,
    "niveau" "NiveauCours" NOT NULL DEFAULT 'TOUS',
    "categorie" TEXT,
    "objectifs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prerequis" TEXT,
    "pourQui" TEXT,
    "dureeMinutes" INTEGER NOT NULL DEFAULT 0,
    "prixCents" INTEGER NOT NULL DEFAULT 0,
    "prixBarreCents" INTEGER,
    "gratuit" BOOLEAN NOT NULL DEFAULT false,
    "certificat" BOOLEAN NOT NULL DEFAULT false,
    "statut" "StatutCours" NOT NULL DEFAULT 'BROUILLON',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "publieLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cours_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cours_slug_key" ON "Cours"("slug");
CREATE INDEX "Cours_accountId_statut_idx" ON "Cours"("accountId", "statut");
CREATE INDEX "Cours_accountId_ordre_idx" ON "Cours"("accountId", "ordre");
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChapitreCours" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "resume" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapitreCours_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChapitreCours_coursId_ordre_idx" ON "ChapitreCours"("coursId", "ordre");
ALTER TABLE "ChapitreCours" ADD CONSTRAINT "ChapitreCours_coursId_fkey"
    FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LeconCours" (
    "id" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeLecon" NOT NULL DEFAULT 'TEXTE',
    "contenu" TEXT,
    "videoUrl" TEXT,
    "fichierUrl" TEXT,
    "dureeMinutes" INTEGER NOT NULL DEFAULT 0,
    "apercu" BOOLEAN NOT NULL DEFAULT false,
    "quiz" JSONB,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeconCours_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeconCours_chapitreId_ordre_idx" ON "LeconCours"("chapitreId", "ordre");
ALTER TABLE "LeconCours" ADD CONSTRAINT "LeconCours_chapitreId_fkey"
    FOREIGN KEY ("chapitreId") REFERENCES "ChapitreCours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InscriptionCours" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT,
    "prenom" TEXT,
    "jeton" TEXT NOT NULL,
    "statut" "StatutInscriptionCours" NOT NULL DEFAULT 'ACTIVE',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "termineLe" TIMESTAMP(3),
    "certificatEmisLe" TIMESTAMP(3),
    "derniereVisite" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscriptionCours_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InscriptionCours_jeton_key" ON "InscriptionCours"("jeton");
CREATE UNIQUE INDEX "InscriptionCours_coursId_email_key" ON "InscriptionCours"("coursId", "email");
CREATE INDEX "InscriptionCours_coursId_createdAt_idx" ON "InscriptionCours"("coursId", "createdAt");
ALTER TABLE "InscriptionCours" ADD CONSTRAINT "InscriptionCours_coursId_fkey"
    FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProgressionLecon" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "leconId" TEXT NOT NULL,
    "faite" BOOLEAN NOT NULL DEFAULT false,
    "faiteLe" TIMESTAMP(3),
    "score" INTEGER,

    CONSTRAINT "ProgressionLecon_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProgressionLecon_inscriptionId_leconId_key" ON "ProgressionLecon"("inscriptionId", "leconId");
CREATE INDEX "ProgressionLecon_leconId_idx" ON "ProgressionLecon"("leconId");
ALTER TABLE "ProgressionLecon" ADD CONSTRAINT "ProgressionLecon_inscriptionId_fkey"
    FOREIGN KEY ("inscriptionId") REFERENCES "InscriptionCours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressionLecon" ADD CONSTRAINT "ProgressionLecon_leconId_fkey"
    FOREIGN KEY ("leconId") REFERENCES "LeconCours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PackCours" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "prixCents" INTEGER NOT NULL DEFAULT 0,
    "coursIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "statut" "StatutCours" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackCours_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PackCours_slug_key" ON "PackCours"("slug");
CREATE INDEX "PackCours_accountId_statut_idx" ON "PackCours"("accountId", "statut");
ALTER TABLE "PackCours" ADD CONSTRAINT "PackCours_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CodePromo" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "TypeRemise" NOT NULL DEFAULT 'POURCENTAGE',
    "valeur" INTEGER NOT NULL,
    "coursIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "debuteLe" TIMESTAMP(3),
    "expireLe" TIMESTAMP(3),
    "usageMax" INTEGER,
    "usages" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodePromo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CodePromo_accountId_code_key" ON "CodePromo"("accountId", "code");
CREATE INDEX "CodePromo_accountId_actif_idx" ON "CodePromo"("accountId", "actif");
ALTER TABLE "CodePromo" ADD CONSTRAINT "CodePromo_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VenteCours" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "coursId" TEXT,
    "packId" TEXT,
    "email" TEXT NOT NULL,
    "nom" TEXT,
    "montantCents" INTEGER NOT NULL,
    "codePromo" TEXT,
    "affiliation" TEXT,
    "statut" "StatutVente" NOT NULL DEFAULT 'PAYEE',
    "moyen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenteCours_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VenteCours_accountId_createdAt_idx" ON "VenteCours"("accountId", "createdAt");
CREATE INDEX "VenteCours_accountId_statut_idx" ON "VenteCours"("accountId", "statut");
ALTER TABLE "VenteCours" ADD CONSTRAINT "VenteCours_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VenteCours" ADD CONSTRAINT "VenteCours_coursId_fkey"
    FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ClasseVirtuelle" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "coursId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "lien" TEXT,
    "placesMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClasseVirtuelle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClasseVirtuelle_accountId_debut_idx" ON "ClasseVirtuelle"("accountId", "debut");
ALTER TABLE "ClasseVirtuelle" ADD CONSTRAINT "ClasseVirtuelle_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClasseVirtuelle" ADD CONSTRAINT "ClasseVirtuelle_coursId_fkey"
    FOREIGN KEY ("coursId") REFERENCES "Cours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "EcoleEnLigne" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sousTitre" TEXT,
    "presentation" TEXT,
    "logoUrl" TEXT,
    "banniereUrl" TEXT,
    "couleur" TEXT NOT NULL DEFAULT '#0F5F3E',
    "contactEmail" TEXT,
    "cgv" TEXT,
    "mentions" TEXT,
    "publiee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcoleEnLigne_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EcoleEnLigne_accountId_key" ON "EcoleEnLigne"("accountId");
CREATE UNIQUE INDEX "EcoleEnLigne_slug_key" ON "EcoleEnLigne"("slug");
ALTER TABLE "EcoleEnLigne" ADD CONSTRAINT "EcoleEnLigne_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Affilie" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "commissionPourcent" INTEGER NOT NULL DEFAULT 20,
    "ventes" INTEGER NOT NULL DEFAULT 0,
    "gainsCents" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affilie_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Affilie_accountId_code_key" ON "Affilie"("accountId", "code");
CREATE INDEX "Affilie_accountId_actif_idx" ON "Affilie"("accountId", "actif");
ALTER TABLE "Affilie" ADD CONSTRAINT "Affilie_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
