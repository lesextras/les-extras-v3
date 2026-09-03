-- TUNNEL D'ACCUEIL (03/09/2026)
--
-- Deux colonnes sur "User", additives et sans perte :
--   tunnelEtape      numéro du dernier message envoyé (0 = aucun)
--   tunnelDernierAt  date de ce dernier message, c'est elle qui espace la
--                    séquence — on n'écrit jamais deux fois dans l'intervalle.
--
-- Les comptes existants démarrent à 0 : le plancher de 30 jours du
-- planificateur les exclut, ils ne recevront donc pas une séquence d'accueil
-- des mois après leur inscription.
ALTER TABLE "User" ADD COLUMN "tunnelEtape" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "tunnelDernierAt" TIMESTAMP(3);
