-- STRIPE CONNECT ET LA BOUTIQUE DE L'ASSOCIATION.
--
-- Deux choses liées : un organisme relie son propre compte Stripe, et ce
-- branchement sert aussi bien à la vente d'une formation qu'à celle d'un
-- produit de boutique.

-- ── Le compte Stripe de l'organisme ────────────────────────────────────
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "stripeCompteId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "stripeComptePret" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "commissionVentePourcent" INTEGER NOT NULL DEFAULT 0;

-- ── Les natures et les états ───────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "NatureProduit" AS ENUM ('REEL', 'VIRTUEL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatutProduit" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatutCommande" AS ENUM ('PAYEE', 'PREPAREE', 'EXPEDIEE', 'REMISE', 'ANNULEE', 'REMBOURSEE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── La vitrine ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Boutique" (
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
  "livraisonTexte" TEXT,
  "publiee" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Boutique_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Boutique_accountId_key" ON "Boutique"("accountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Boutique_slug_key" ON "Boutique"("slug");

-- ── Les produits ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ProduitBoutique" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "nature" "NatureProduit" NOT NULL DEFAULT 'REEL',
  "prixCents" INTEGER NOT NULL DEFAULT 0,
  "prixBarreCents" INTEGER,
  "tvaPourcent" INTEGER NOT NULL DEFAULT 0,
  "stock" INTEGER,
  "livraisonCents" INTEGER NOT NULL DEFAULT 0,
  "fichierUrl" TEXT,
  "lienUrl" TEXT,
  "statut" "StatutProduit" NOT NULL DEFAULT 'BROUILLON',
  "ordre" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProduitBoutique_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProduitBoutique_accountId_slug_key" ON "ProduitBoutique"("accountId", "slug");
CREATE INDEX IF NOT EXISTS "ProduitBoutique_accountId_statut_idx" ON "ProduitBoutique"("accountId", "statut");
CREATE INDEX IF NOT EXISTS "ProduitBoutique_accountId_ordre_idx" ON "ProduitBoutique"("accountId", "ordre");

-- ── Les commandes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CommandeBoutique" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "nom" TEXT,
  "telephone" TEXT,
  "adresse" TEXT,
  "codePostal" TEXT,
  "ville" TEXT,
  "pays" TEXT,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "fraisPortCents" INTEGER NOT NULL DEFAULT 0,
  "statut" "StatutCommande" NOT NULL DEFAULT 'PAYEE',
  "stripeSessionId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommandeBoutique_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CommandeBoutique_stripeSessionId_key" ON "CommandeBoutique"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "CommandeBoutique_accountId_statut_idx" ON "CommandeBoutique"("accountId", "statut");
CREATE INDEX IF NOT EXISTS "CommandeBoutique_accountId_createdAt_idx" ON "CommandeBoutique"("accountId", "createdAt");

CREATE TABLE IF NOT EXISTS "LigneCommande" (
  "id" TEXT NOT NULL,
  "commandeId" TEXT NOT NULL,
  "produitId" TEXT,
  "titre" TEXT NOT NULL,
  "nature" "NatureProduit" NOT NULL DEFAULT 'REEL',
  "prixCents" INTEGER NOT NULL,
  "quantite" INTEGER NOT NULL DEFAULT 1,
  "remisUrl" TEXT,
  CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LigneCommande_commandeId_idx" ON "LigneCommande"("commandeId");

-- ── Les liens ──────────────────────────────────────────────────────────
ALTER TABLE "Boutique" DROP CONSTRAINT IF EXISTS "Boutique_accountId_fkey";
ALTER TABLE "Boutique" ADD CONSTRAINT "Boutique_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProduitBoutique" DROP CONSTRAINT IF EXISTS "ProduitBoutique_accountId_fkey";
ALTER TABLE "ProduitBoutique" ADD CONSTRAINT "ProduitBoutique_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommandeBoutique" DROP CONSTRAINT IF EXISTS "CommandeBoutique_accountId_fkey";
ALTER TABLE "CommandeBoutique" ADD CONSTRAINT "CommandeBoutique_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_commandeId_fkey";
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey"
  FOREIGN KEY ("commandeId") REFERENCES "CommandeBoutique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_produitId_fkey";
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_produitId_fkey"
  FOREIGN KEY ("produitId") REFERENCES "ProduitBoutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;
