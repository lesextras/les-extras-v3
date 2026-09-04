-- Alertes de recherche.
--
-- Additive : aucune colonne existante n'est touchée, aucune donnée déplacée.
-- Le Dockerfile applique `prisma db push`, cette migration est donc
-- documentaire — elle dit ce que le schéma a gagné et quand.

CREATE TABLE "AlerteRecherche" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'all',
    "departements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categorie" TEXT,
    "publicVise" TEXT,
    "recherche" TEXT,
    "budgetMax" DECIMAL(10,2),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernierEnvoiAt" TIMESTAMP(3),
    "signalees" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlerteRecherche_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlerteRecherche_userId_idx" ON "AlerteRecherche"("userId");
CREATE INDEX "AlerteRecherche_actif_idx" ON "AlerteRecherche"("actif");

ALTER TABLE "AlerteRecherche" ADD CONSTRAINT "AlerteRecherche_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SET NULL et non CASCADE : un compte supprimé ne doit pas emporter l'alerte
-- de la personne, qui reste titulaire de son compte utilisateur.
ALTER TABLE "AlerteRecherche" ADD CONSTRAINT "AlerteRecherche_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
