-- ============================================================================
-- NETTOYAGE DES DONNÉES DE TEST EN PRODUCTION — à exécuter À LA MAIN par Siham
-- (console Postgres de Coolify), après lecture. Rien ici n'est lancé
-- automatiquement.
--
-- Pourquoi : l'audit du 3 août 2026 a montré que la file de modération, les
-- statistiques et certaines pages publiques sont encombrées de données de
-- test (missions « TEST … », formation au titre « |||||| », demandes de
-- contact factices, facture de démo FAC-2026-0001).
--
-- Principe : chaque étape commence par un SELECT de contrôle. Vérifiez que la
-- liste affichée ne contient QUE des données de test avant d'exécuter le
-- DELETE/UPDATE qui suit. Tout est dans une transaction : en cas de doute,
-- ROLLBACK; et rien n'a bougé.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Missions de test (file « En attente de modération » du cockpit admin)
-- ---------------------------------------------------------------------------
SELECT id, title, status, "createdAt"
FROM "ReliefMission"
WHERE title IN (
  'TEST mission unité',
  'TEST mission unite',
  'bad dates',
  'QA Mission Renfort',
  'Analyse de pratiques — brouillon'
)
   OR title LIKE 'Éàçùî%';

-- Si la liste ci-dessus ne contient que des tests :
DELETE FROM "ReliefMission"
WHERE title IN (
  'TEST mission unité',
  'TEST mission unite',
  'bad dates',
  'QA Mission Renfort',
  'Analyse de pratiques — brouillon'
)
   OR title LIKE 'Éàçùî%';

-- ---------------------------------------------------------------------------
-- 2) Formation au titre illisible « |||||| » (publiée, visible côté public)
--    Option douce : archiver (réversible). Option forte : supprimer.
-- ---------------------------------------------------------------------------
SELECT id, title, status FROM "Formation" WHERE title NOT SIMILAR TO '%[[:alpha:]]{3}%';

UPDATE "Formation"
SET status = 'ARCHIVED'
WHERE title NOT SIMILAR TO '%[[:alpha:]]{3}%';
-- (le code refuse désormais ce genre de titre à la création comme à l'édition)

-- ---------------------------------------------------------------------------
-- 3) Demandes de contact de test
-- ---------------------------------------------------------------------------
SELECT id, name, type, "createdAt" FROM "ContactRequest"
WHERE name ILIKE '%TEST%' OR name ILIKE '%a supprimer%' OR content LIKE '||%'
   OR content ILIKE '%[TEST AUDIT%';

DELETE FROM "ContactRequest"
WHERE name ILIKE '%TEST%' OR name ILIKE '%a supprimer%' OR content LIKE '||%'
   OR content ILIKE '%[TEST AUDIT%';

-- ---------------------------------------------------------------------------
-- 4) Facture de démonstration (série FAC- : seule la série INV- est réelle).
--    ⚠️ Ne supprimez JAMAIS une facture réellement émise : la numérotation
--    doit rester continue. FAC-2026-0001 vient du seed de démonstration.
-- ---------------------------------------------------------------------------
SELECT id, number, amount, status FROM "Invoice" WHERE number LIKE 'FAC-%';

DELETE FROM "Invoice" WHERE number LIKE 'FAC-%';

-- ---------------------------------------------------------------------------
-- 5) Comptes de démonstration — À TRAITER AU CAS PAR CAS.
--    Le SELECT liste les candidats ; NE PAS supprimer en bloc sans vérifier :
--    supprimer un compte emporte ses missions, ateliers et réservations.
-- ---------------------------------------------------------------------------
SELECT a.id, a.name, a.type, u.email AS proprietaire
FROM "Account" a
LEFT JOIN "User" u ON u.id = a."ownerId"
WHERE a.name ILIKE '%(démo)%'
   OR a.name ILIKE '%demo%'
   OR a.name ILIKE '%QA %'
   OR a.name ILIKE '%Verif %'
   OR a.name = 'Audit ADEPA'
   OR u.email LIKE '%@example.com'
   OR u.email LIKE '%mailinator.com'
   OR u.email LIKE '%demo@les-extras.fr';

-- Suppression volontairement NON incluse : décidez compte par compte depuis
-- /admin/etablissements (bouton Supprimer, avec confirmation).

-- ---------------------------------------------------------------------------
-- Vérifiez les listes ci-dessus, puis :
COMMIT;
-- En cas de doute : ROLLBACK;
-- ============================================================================
