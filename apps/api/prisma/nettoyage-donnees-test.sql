-- ============================================================================
-- NETTOYAGE DES DONNÉES DE TEST — production Les-Extras v3
-- À exécuter À LA MAIN par Siham dans la console Postgres de Coolify.
-- Rien ici ne s'exécute automatiquement.
--
-- PRINCIPE DE PRÉCAUTION (demande du 3 août 2026) :
--   • On supprime UNIQUEMENT les artefacts de test / QA / démo, reconnus à des
--     marqueurs explicites : « TEST », « QA », « démo/demo », e-mails
--     @example.com / @mailinator.com, titres faits de barres « |||| », etc.
--   • On NE TOUCHE PAS aux données récupérées de l'ancien site les-extras.fr
--     (vrais établissements, vrais intervenants, vrais ateliers). Ces données
--     n'ont aucun de ces marqueurs, donc les clauses ci-dessous les épargnent
--     par construction.
--   • Chaque étape commence par un SELECT de contrôle : VÉRIFIEZ que la liste
--     ne contient QUE du test avant de lancer le DELETE juste en dessous.
--   • Tout est dans une transaction. En cas de doute : ROLLBACK; (rien n'a bougé).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) MISSIONS DE TEST — marqueurs de test seulement.
-- ---------------------------------------------------------------------------
SELECT id, title, status, "createdAt"
FROM "ReliefMission"
WHERE title ILIKE 'TEST %'
   OR title ILIKE '%QA %'
   OR title = 'bad dates'
   OR title = 'Analyse de pratiques — brouillon'
   OR title ~ '^[^[:alpha:]]+$';   -- titres sans aucune lettre (ex. « Éàçùî… » non concerné car il a des lettres ; vise les faux titres symboliques)

-- ⚠️ La mission « Éàçùî ñ 日本語 🎉 <>&"' » est un test de jeu de caractères.
--    Si elle apparaît dans un autre SELECT, ajoutez son id explicitement.
-- Après contrôle visuel de la liste ci-dessus :
DELETE FROM "ReliefMission"
WHERE title ILIKE 'TEST %'
   OR title ILIKE '%QA %'
   OR title = 'bad dates'
   OR title = 'Analyse de pratiques — brouillon'
   OR title ~ '^[^[:alpha:]]+$';

-- Pour la mission de test unicode, décommentez après avoir vérifié son id :
-- DELETE FROM "ReliefMission" WHERE id = '<coller_l_id_vu_dans_l_admin>';

-- ---------------------------------------------------------------------------
-- 2) FORMATION au titre illisible (« |||||| ») — aucune lettre = faux titre.
--    (Le code refuse désormais ce genre de titre ; ceci nettoie l'existant.)
-- ---------------------------------------------------------------------------
SELECT id, title, status FROM "Formation" WHERE title !~ '[[:alpha:]]{3}';

DELETE FROM "Formation" WHERE title !~ '[[:alpha:]]{3}';

-- ---------------------------------------------------------------------------
-- 3) DEMANDES DE CONTACT de test.
-- ---------------------------------------------------------------------------
SELECT id, name, type, "createdAt" FROM "ContactRequest"
WHERE name ILIKE '%TEST%'
   OR name ILIKE '%a supprimer%'
   OR content LIKE '||%'
   OR content ILIKE '%[TEST AUDIT%'
   OR content ILIKE '%[TEST CONFETTIS%';

DELETE FROM "ContactRequest"
WHERE name ILIKE '%TEST%'
   OR name ILIKE '%a supprimer%'
   OR content LIKE '||%'
   OR content ILIKE '%[TEST AUDIT%'
   OR content ILIKE '%[TEST CONFETTIS%';

-- ---------------------------------------------------------------------------
-- 4) FACTURE de démonstration issue du seed (série FAC-).
--    ⚠️ Les vraies factures sont en série INV- : on n'y touche JAMAIS
--    (numérotation légale continue). Seule FAC-2026-0001 (démo) est visée.
-- ---------------------------------------------------------------------------
SELECT id, number, amount, status FROM "Invoice" WHERE number LIKE 'FAC-%';

DELETE FROM "Invoice" WHERE number LIKE 'FAC-%';

-- ---------------------------------------------------------------------------
-- 5) COMPTES de test / démo — LE PLUS SENSIBLE.
--    Un compte supprimé emporte ses missions, ateliers, réservations (cascade).
--    On liste d'abord ; on ne supprime QUE ceux au marqueur de test évident.
--    Les établissements/intervenants RÉCUPÉRÉS n'ont pas ces marqueurs → épargnés.
-- ---------------------------------------------------------------------------
SELECT a.id, a.name, a.type, u.email AS proprietaire
FROM "Account" a
LEFT JOIN "User" u ON u.id = a."ownerId"
WHERE a.name ILIKE '%(démo)%'
   OR a.name ILIKE '%(demo)%'
   OR a.name ILIKE 'QA %'
   OR a.name ILIKE 'Verif %'
   OR a.name ILIKE 'Audit %'
   OR u.email LIKE '%@example.com'
   OR u.email LIKE '%@mailinator.com'
   OR u.email LIKE '%demo@les-extras.fr'
   OR u.email LIKE 'qa.%@les-extras.fr';

-- Après avoir VÉRIFIÉ un par un que la liste ci-dessus ne contient AUCUN vrai
-- compte récupéré, exécutez la suppression (mêmes critères) :
DELETE FROM "Account" a
USING "User" u
WHERE a."ownerId" = u.id
  AND (
       a.name ILIKE '%(démo)%'
    OR a.name ILIKE '%(demo)%'
    OR a.name ILIKE 'QA %'
    OR a.name ILIKE 'Verif %'
    OR a.name ILIKE 'Audit %'
    OR u.email LIKE '%@example.com'
    OR u.email LIKE '%@mailinator.com'
    OR u.email LIKE '%demo@les-extras.fr'
    OR u.email LIKE 'qa.%@les-extras.fr'
  );

-- Comptes de test SANS établissement rattaché (freelances de test orphelins) :
SELECT id, email, "firstName", "lastName", status FROM "User"
WHERE email LIKE '%@example.com'
   OR email LIKE '%@mailinator.com'
   OR email LIKE '%demo@les-extras.fr'
   OR email LIKE 'qa.%@les-extras.fr';

DELETE FROM "User"
WHERE (email LIKE '%@example.com'
    OR email LIKE '%@mailinator.com'
    OR email LIKE '%demo@les-extras.fr'
    OR email LIKE 'qa.%@les-extras.fr')
  AND role <> 'ADMIN';   -- garde-fou : ne jamais toucher un compte admin.

-- ---------------------------------------------------------------------------
-- Relisez toutes les listes ci-dessus. Si tout est bien du test :
COMMIT;
-- En cas du moindre doute : ROLLBACK;
-- ============================================================================
