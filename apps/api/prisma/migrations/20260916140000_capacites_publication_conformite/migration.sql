-- Cinq droits de plus dans l'énumération des capacités.
--
-- Trois viennent d'une demande : publier un article, publier une actualité,
-- publier un atelier. Deux d'une revue de ce que le produit sait déjà faire et
-- que personne n'avait jamais eu à déclarer :
--
--   VOIR_CONFORMITE      le coffre-fort porte des pièces d'identité, des
--                        casiers judiciaires et des diplômes. Il était ouvert
--                        sur le seul rôle applicatif, sans droit déclaré.
--   UTILISER_CREDITS_LEX les générations LEX sont la seule chose qui coûte de
--                        l'argent : savoir qui peut les dépenser compte.
--
-- ⚠ ADD VALUE IF NOT EXISTS, et une instruction par valeur : PostgreSQL
-- n'accepte pas plusieurs ajouts dans un même ALTER TYPE.
ALTER TYPE "Capacite" ADD VALUE IF NOT EXISTS 'PUBLIER_ARTICLE';
ALTER TYPE "Capacite" ADD VALUE IF NOT EXISTS 'PUBLIER_ACTUALITE';
ALTER TYPE "Capacite" ADD VALUE IF NOT EXISTS 'PUBLIER_ATELIER';
ALTER TYPE "Capacite" ADD VALUE IF NOT EXISTS 'VOIR_CONFORMITE';
ALTER TYPE "Capacite" ADD VALUE IF NOT EXISTS 'UTILISER_CREDITS_LEX';
