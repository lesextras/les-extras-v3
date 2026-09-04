-- Capture d'adresse sur les fiches de parcours gratuits, et audience sans traceur.
-- Additive : aucune table existante n'est touchée.

CREATE TABLE "CaptureFiche" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "prenom" TEXT,
  "consentTunnel" BOOLEAN NOT NULL DEFAULT false,
  "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT,
  "sourceMedium" TEXT,
  "sourceCampaign" TEXT,
  "sourceLanding" TEXT,
  "tunnelEtape" INTEGER NOT NULL DEFAULT 0,
  "tunnelDernierAt" TIMESTAMP(3),
  "desabonneAt" TIMESTAMP(3),
  "jeton" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CaptureFiche_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaptureFiche_jeton_key" ON "CaptureFiche"("jeton");
CREATE UNIQUE INDEX "CaptureFiche_email_slug_key" ON "CaptureFiche"("email", "slug");
CREATE INDEX "CaptureFiche_email_idx" ON "CaptureFiche"("email");
CREATE INDEX "CaptureFiche_source_idx" ON "CaptureFiche"("source");
CREATE INDEX "CaptureFiche_consentTunnel_desabonneAt_tunnelEtape_idx" ON "CaptureFiche"("consentTunnel", "desabonneAt", "tunnelEtape");

CREATE TABLE "VuePage" (
  "id" TEXT NOT NULL,
  "jour" DATE NOT NULL,
  "chemin" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'direct',
  "medium" TEXT NOT NULL DEFAULT '',
  "campagne" TEXT NOT NULL DEFAULT '',
  "vues" INTEGER NOT NULL DEFAULT 0,
  "visites" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "VuePage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VuePage_jour_chemin_source_medium_campagne_key" ON "VuePage"("jour", "chemin", "source", "medium", "campagne");
CREATE INDEX "VuePage_jour_idx" ON "VuePage"("jour");
CREATE INDEX "VuePage_source_jour_idx" ON "VuePage"("source", "jour");
