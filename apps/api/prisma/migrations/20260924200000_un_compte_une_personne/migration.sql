-- UN COMPTE = UNE PERSONNE (24/09/2026, décision de Siham).
--
-- Plus de sous-comptes sur Les Extras : l'équipe interne, ses niveaux, ses
-- services et ses droits déclarés sont retirés du code. Cette migration ne
-- SUPPRIME rien, ni table, ni colonne, ni valeur d'énumération, ni ligne :
-- elle ne fait que ramener trois réglages de mission sur des valeurs que le
-- code sait encore servir. Elle est rejouable (chaque UPDATE ne touche que ce
-- qui n'est pas encore converti) et ne dépend d'aucune donnée préalable.
--
-- Le code applique déjà la même lecture à l'exécution
-- (`missions/ciblage.service.ts` : `palierEffectif`, `cibleEffective`) : cette
-- migration ne fait qu'aligner la base pour les écrans et les statistiques.

-- 1. Le palier « salariés d'abord » de la cascade n'existe plus. Une mission
--    qui y est encore passe au palier du réseau connu (RESERVED), jamais au
--    public : la restriction voulue par l'établissement est tenue, elle
--    s'élargira ensuite normalement si la mission reste non pourvue.
UPDATE "ReliefMission"
SET "visibility" = 'RESERVED'
WHERE "visibility" = 'SALARIES';

-- 2. La cible « unité » (les salariés d'un service) n'a plus de destinataire.
--    Elle retombe sur la diffusion normale (RESEAU), comme le fait le code.
UPDATE "ReliefMission"
SET "cibleDiffusion" = 'RESEAU'
WHERE "cibleDiffusion" = 'UNITE';

-- 3. Une sélection nominative qui ne désignait QUE des salariés n'a plus
--    personne : même traitement. `destinatairesSalaries` est conservé tel quel
--    (plus rien ne le lit, mais rien ne se perd).
UPDATE "ReliefMission"
SET "cibleDiffusion" = 'RESEAU'
WHERE "cibleDiffusion" = 'SELECTION'
  AND COALESCE(cardinality("destinatairesIntervenants"), 0) = 0;

-- 4. La validation hiérarchique (un chef de service demande, la direction
--    approuve) est retirée, avec la route POST /missions/:id/approve. Une
--    mission restée « en attente de validation » est un BROUILLON (le statut
--    n'avait jamais changé) : on lève le drapeau, et la personne du compte la
--    publie elle-même, comme n'importe quel brouillon. Rien n'est publié à sa
--    place.
UPDATE "ReliefMission"
SET "attenteValidation" = false
WHERE "attenteValidation" = true;
