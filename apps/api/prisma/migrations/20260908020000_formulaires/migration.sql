-- Les formulaires libres, dans les deux espaces (association et académie).

CREATE TYPE "StatutFormulaire" AS ENUM ('BROUILLON', 'PUBLIE', 'FERME');

CREATE TABLE "Formulaire" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "introduction" TEXT,
    "slug" TEXT NOT NULL,
    "statut" "StatutFormulaire" NOT NULL DEFAULT 'BROUILLON',
    "champs" JSONB NOT NULL DEFAULT '[]',
    "remerciement" TEXT,
    "reponseUnique" BOOLEAN NOT NULL DEFAULT false,
    "demanderEmail" BOOLEAN NOT NULL DEFAULT false,
    "fermeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formulaire_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Formulaire_slug_key" ON "Formulaire"("slug");
CREATE INDEX "Formulaire_accountId_statut_idx" ON "Formulaire"("accountId", "statut");
CREATE INDEX "Formulaire_accountId_createdAt_idx" ON "Formulaire"("accountId", "createdAt");

ALTER TABLE "Formulaire"
    ADD CONSTRAINT "Formulaire_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ReponseFormulaire" (
    "id" TEXT NOT NULL,
    "formulaireId" TEXT NOT NULL,
    "email" TEXT,
    "valeurs" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReponseFormulaire_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReponseFormulaire_formulaireId_createdAt_idx" ON "ReponseFormulaire"("formulaireId", "createdAt");
CREATE INDEX "ReponseFormulaire_formulaireId_email_idx" ON "ReponseFormulaire"("formulaireId", "email");

ALTER TABLE "ReponseFormulaire"
    ADD CONSTRAINT "ReponseFormulaire_formulaireId_fkey"
    FOREIGN KEY ("formulaireId") REFERENCES "Formulaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
