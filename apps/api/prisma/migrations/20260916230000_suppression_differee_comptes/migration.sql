-- ============================================================================
--  SUPPRIMER UN COMPTE, C'EST L'ARCHIVER TROIS MOIS
--  16/09/2026 — décision de Siham
-- ============================================================================
--
--  Écrite pour être REJOUABLE, comme toutes celles de ce dossier. Les
--  migrations s'appliquent au démarrage du conteneur API : une migration qui
--  échoue empêche le conteneur de démarrer, donc coupe le site.
--
--  CE QUE ÇA CHANGE
--  ----------------
--  `DELETE /admin/accounts/:id` détruisait le compte à la seconde où on
--  cliquait, en cascade et sans retour possible. Il ARCHIVE désormais le compte
--  et pose ici la date de sa suppression réelle, trois mois plus tard. Pendant
--  tout ce délai, « Rétablir » annule les deux et le compte revient exactement
--  comme il était.
--
--  Trois mois, c'est le temps qu'il faut pour que quelqu'un s'aperçoive qu'un
--  compte manque — un directeur qui cherche sa MECS, un intervenant qui ne
--  retrouve plus ses fiches. Une suppression immédiate ne laisse pas ce temps.
--
--  ⚠⚠ CE QUE LE DÉLAI NE CHANGE PAS : UN COMPTE QUI A ÉMIS UNE FACTURE OU
--  SIGNÉ UN CDD NE SERA JAMAIS SUPPRIMÉ, même après trois mois. `Invoice` et
--  `ContratCDD` sont en `onDelete: Cascade` — détruire le compte détruirait les
--  documents. Une facture émise se conserve dix ans (art. 242 nonies A, ann. II
--  du CGI ; art. L123-22 du code de commerce), un contrat de travail aussi. Le
--  planificateur inscrit alors son refus en toutes lettres dans
--  `suppressionMotifBlocage`, et l'écran d'administration l'affiche : sans
--  cette phrase, le compte resterait « à supprimer » sans que personne ne sache
--  pourquoi, et quelqu'un finirait par forcer.
--
--  ⚠ DEUX COLONNES NULLES : cette migration ne touche AUCUNE donnée existante.
--  Les comptes déjà archivés restent archivés sans échéance — c'est leur état
--  voulu (comptes de test, doublons homonymes). Nul ne veut pas dire « jamais
--  supprimé », il veut dire « aucune suppression programmée ».

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "suppressionPrevueLe" TIMESTAMP(3);
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "suppressionMotifBlocage" TEXT;

-- Le planificateur balaie sur cette colonne une fois par jour, en cherchant les
-- échéances dépassées. Sans index, c'est un parcours complet de la table à
-- chaque passage.
CREATE INDEX IF NOT EXISTS "Account_suppressionPrevueLe_idx"
  ON "Account"("suppressionPrevueLe");
