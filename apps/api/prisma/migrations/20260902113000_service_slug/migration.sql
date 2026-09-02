-- UNE ADRESSE LISIBLE POUR CHAQUE FICHE ATELIER.
--
-- Les fiches vivaient à `/ateliers/cms3it0g70015lt1wyr4sbhqr` : le mot-clé le
-- plus fort de la fiche n'apparaissait nulle part dans son adresse, et
-- l'adresse était impartageable telle quelle — collée dans un mail ou sur
-- LinkedIn, elle ne dit rien de ce qu'elle ouvre.
--
-- Le champ est NULLABLE et l'identifiant continue de résoudre la fiche : une
-- ligne qui n'obtiendrait pas de slug (titre vide, jeu de caractères
-- inattendu) s'affiche exactement comme avant. Rien ici ne peut casser une
-- page ; au pire, elle garde son ancienne adresse.

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Service_slug_key" ON "Service"("slug");

-- Engendrement des slugs manquants, en trois temps :
--
-- 1. `translate` retire les accents. On ne dépend PAS de l'extension
--    `unaccent`, qui n'est pas installée sur cette base : une migration qui
--    exige une extension absente échoue au démarrage du conteneur, et
--    l'entrypoint s'arrête. Les deux chaînes ont exactement la même longueur
--    en caractères — c'est ce que `translate` demande.
-- 2. `regexp_replace` réduit tout le reste à des tirets, sans doublons.
-- 3. `row_number` départage les titres identiques : le premier garde le slug
--    nu, les suivants reçoivent un suffixe numérique. Sans cela, deux ateliers
--    homonymes violeraient la contrainte d'unicité et feraient échouer la
--    migration entière.
--
-- La clause `WHERE "slug" IS NULL` rend l'opération rejouable : un second
-- passage ne touche à rien, et les slugs déjà attribués ne bougent jamais —
-- une adresse publiée ne se réécrit pas.
WITH normalise AS (
  SELECT
    "id",
    trim(
      BOTH '-' FROM regexp_replace(
        lower(
          regexp_replace(
            translate(
              "title",
              'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÇçÑñŒœÆæŸÿ',
              'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNnOoAaYy'
            ),
            '[^a-zA-Z0-9]+', '-', 'g'
          )
        ),
        '-+', '-', 'g'
      )
    ) AS base
  FROM "Service"
  WHERE "slug" IS NULL
),
rangs AS (
  SELECT "id", base, row_number() OVER (PARTITION BY base ORDER BY "id") AS rang
  FROM normalise
  WHERE base <> ''
)
UPDATE "Service" s
   SET "slug" = CASE WHEN r.rang = 1 THEN r.base ELSE r.base || '-' || r.rang END
  FROM rangs r
 WHERE s."id" = r."id"
   AND s."slug" IS NULL
   -- Filet de sécurité : on n'écrase jamais un slug déjà pris par une autre
   -- fiche, même si le départage ci-dessus devait laisser passer un doublon.
   AND NOT EXISTS (
     SELECT 1 FROM "Service" x
      WHERE x."slug" = CASE WHEN r.rang = 1 THEN r.base ELSE r.base || '-' || r.rang END
   );
