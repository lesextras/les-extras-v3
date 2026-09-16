-- ============================================================================
--  ARCHIVER UN COMPTE PLUTÔT QUE LE DÉTRUIRE
--  16/09/2026
-- ============================================================================
--
--  Écrite pour être REJOUABLE, comme toutes celles de ce dossier. Les
--  migrations s'appliquent au démarrage du conteneur API : une migration qui
--  échoue empêche le conteneur de démarrer, donc coupe le site.
--
--  POURQUOI CETTE COLONNE EXISTE
--  -----------------------------
--  Il n'y avait AUCUN moyen de retirer un compte de la vue sans le détruire.
--  Vingt et un comptes de test créés pendant les audits (« MECS Audit Test 2 »,
--  « [VERIF] MECS Finale », et trois portant le mot « démo ») s'affichaient à
--  quiconque tapait le nom de son établissement à l'inscription — c'est-à-dire
--  exactement l'écran qu'on venait de réparer contre les doublons.
--
--  La seule sortie était `DELETE /admin/accounts/:id`, qui fait un
--  `account.delete` en cascade : rattachements, fiches, missions, réservations
--  ET FACTURES. Or une facture émise ne se supprime pas (art. 242 nonies A,
--  ann. II du CGI). Un bouton qui détruit une comptabilité sans le dire n'est
--  pas la bonne réponse à « je ne veux plus voir ce compte ».
--
--  ⚠ ARCHIVER N'EST PAS SUSPENDRE. La colonne retire le compte des recherches
--  et de la vitrine publique, et rien d'autre. Quelqu'un qui a le mot de passe
--  d'un compte archivé se connecte normalement. Confondre les deux ferait
--  mettre dehors l'équipe entière d'un établissement qu'on voulait seulement
--  sortir d'un annuaire.
--
--  ⚠ NULL = VISIBLE. Le défaut est donc juste pour les 100+ comptes existants,
--  et aucune donnée n'est touchée par cette migration.

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- L'index sert les listes publiques, qui filtrent toutes sur « non archivé ».
CREATE INDEX IF NOT EXISTS "Account_archivedAt_idx" ON "Account"("archivedAt");
