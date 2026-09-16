-- RETRAIT DU GAP — suppression des tables de l'Entraide.
--
-- Le dispositif a été retiré de l'offre le 15/09/2026 : plus aucune route ni
-- page n'accède à ces tables depuis. Le contenu qu'elles portaient était du
-- jeu d'essai, pas des dépôts de professionnels réels (confirmé le 16/09/2026).
--
-- Écrit en IF EXISTS / CASCADE à dessein : `migrate deploy` tourne au
-- démarrage de l'API (docker-entrypoint.sh) et une migration qui échoue
-- empêche le conteneur de démarrer. Celle-ci est rejouable sans erreur, que
-- les tables soient encore là ou déjà parties, et CASCADE se charge des clés
-- étrangères sans dépendre du nom exact des contraintes.
--
-- Conservé volontairement : les valeurs REPONSE et REPONSE_RETENUE de
-- l'énumération PointReason, utilisées par des points déjà crédités.

DROP TABLE IF EXISTS "AnswerVote" CASCADE;
DROP TABLE IF EXISTS "Answer" CASCADE;
DROP TABLE IF EXISTS "Question" CASCADE;

DROP TYPE IF EXISTS "QuestionStatus";
