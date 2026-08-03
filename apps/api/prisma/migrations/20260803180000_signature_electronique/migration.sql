-- Signature electronique avec faisceau de preuves.
--
-- Ce qui est mis en place est une signature electronique SIMPLE au sens du
-- reglement eIDAS. Elle est valable — l'article 1367 du code civil reconnait
-- la signature electronique des lors que le procede identifie son auteur et
-- garantit son lien avec l'acte — mais elle n'est ni avancee ni qualifiee.
-- La difference ne porte pas sur la validite : elle porte sur la charge de la
-- preuve. D'ou le faisceau que l'on constitue ici : empreinte du document,
-- code a usage unique verifie, horodatage, adresse IP, navigateur, et un
-- journal d'evenements append-only.
CREATE TYPE "TypeDocumentSigne" AS ENUM ('CONTRAT_CDD', 'PROPOSITION', 'DEVIS');
CREATE TYPE "StatutSignature" AS ENUM ('EN_ATTENTE', 'SIGNEE', 'REFUSEE', 'EXPIREE', 'ANNULEE');

CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "documentType" "TypeDocumentSigne" NOT NULL,
    "documentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT,
    "signataireNom" TEXT NOT NULL,
    "signataireEmail" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "codeHache" TEXT,
    "codeExpireLe" TIMESTAMP(3),
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutSignature" NOT NULL DEFAULT 'EN_ATTENTE',
    "signeLe" TIMESTAMP(3),
    "refuseLe" TIMESTAMP(3),
    "motifRefus" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "prestataire" TEXT,
    "prestataireRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Signature_documentType_documentId_idx" ON "Signature"("documentType", "documentId");
CREATE INDEX "Signature_accountId_statut_idx" ON "Signature"("accountId", "statut");
CREATE INDEX "Signature_signataireEmail_idx" ON "Signature"("signataireEmail");

ALTER TABLE "Signature" ADD CONSTRAINT "Signature_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Le journal : append-only. On n'y touche jamais apres ecriture, c'est ce qui
-- lui donne sa valeur probante.
CREATE TABLE "SignatureEvenement" (
    "id" TEXT NOT NULL,
    "signatureId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignatureEvenement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SignatureEvenement_signatureId_createdAt_idx" ON "SignatureEvenement"("signatureId", "createdAt");

ALTER TABLE "SignatureEvenement" ADD CONSTRAINT "SignatureEvenement_signatureId_fkey"
    FOREIGN KEY ("signatureId") REFERENCES "Signature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
