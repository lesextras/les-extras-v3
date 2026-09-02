-- LES ACCENTS AVAIENT ÉTÉ SCINDÉS DANS LES ADRESSES.
--
-- Les slugs de ces douze articles ont été fabriqués par un découpage qui
-- décomposait « é » en « e » + accent, puis remplaçait l'accent par un tiret :
-- « théâtre » est devenu « the-a-tre », « médico-social » « me-dico-social ».
-- Google lit donc « the a tre » et le mot-clé principal de l'article est perdu
-- dans sa propre adresse ; partagée sur LinkedIn ou par mail, elle donne une
-- mauvaise impression immédiate.
--
-- On corrige la donnée ICI plutôt que par un script à lancer à la main :
-- l'entrypoint applique les migrations au démarrage, donc la correction part
-- avec le déploiement, une seule fois, et reste tracée dans l'historique.
--
-- Chaque mise à jour est IDEMPOTENTE et refuse d'écraser quoi que ce soit :
-- elle ne s'applique que si l'ancienne adresse existe encore ET que la
-- nouvelle est libre — `Article.slug` est unique, et des doublons archivés
-- de l'import WordPress vivent dans la même table.
--
-- Les anciennes adresses sont redirigées en 301 depuis `next.config.mjs` :
-- l'antériorité de référencement est conservée, et aucun lien déjà partagé
-- ne tombe en 404.

-- Atelier individuel ou collectif : comment choisir en établissement ?
UPDATE "Article" SET "slug" = 'atelier-individuel-ou-collectif-comment-choisir-en-etablissement'
 WHERE "slug" = 'atelier-individuel-ou-collectif-comment-choisir-en-e-tablissement'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'atelier-individuel-ou-collectif-comment-choisir-en-etablissement');

-- L’atelier socio-esthétique en établissement médico-social
UPDATE "Article" SET "slug" = 'l-atelier-socio-esthetique-en-etablissement-medico-social'
 WHERE "slug" = 'l-atelier-socio-esthe-tique-en-e-tablissement-me-dico-social'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'l-atelier-socio-esthetique-en-etablissement-medico-social');

-- L’atelier théâtre en établissement médico-social
UPDATE "Article" SET "slug" = 'l-atelier-theatre-en-etablissement-medico-social'
 WHERE "slug" = 'l-atelier-the-a-tre-en-e-tablissement-me-dico-social'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'l-atelier-theatre-en-etablissement-medico-social');

-- Recrutement éducateur freelance : bien cadrer un renfort d’équipe
UPDATE "Article" SET "slug" = 'recrutement-educateur-freelance-bien-cadrer-un-renfort-d-equipe'
 WHERE "slug" = 'recrutement-e-ducateur-freelance-bien-cadrer-un-renfort-d-e-quipe'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'recrutement-educateur-freelance-bien-cadrer-un-renfort-d-equipe');

-- Atelier socio-esthétique : redonner une image positive de soi
UPDATE "Article" SET "slug" = 'atelier-socio-esthetique-redonner-une-image-positive-de-soi'
 WHERE "slug" = 'atelier-socio-esthe-tique-redonner-une-image-positive-de-soi'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'atelier-socio-esthetique-redonner-une-image-positive-de-soi');

-- Bilan de compétences éducateur : pourquoi l’envisager pour votre équipe
UPDATE "Article" SET "slug" = 'bilan-de-competences-educateur-pourquoi-l-envisager-pour-votre-equipe'
 WHERE "slug" = 'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'bilan-de-competences-educateur-pourquoi-l-envisager-pour-votre-equipe');

-- La musicothérapie en établissement médico-social
UPDATE "Article" SET "slug" = 'la-musicotherapie-en-etablissement-medico-social'
 WHERE "slug" = 'la-musicothe-rapie-en-e-tablissement-me-dico-social'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'la-musicotherapie-en-etablissement-medico-social');

-- Éducateurs, Professeurs, Coachs : Donnez un Nouvel Élan à votre Carrière avec Les Extras !
UPDATE "Article" SET "slug" = 'educateurs-professeurs-coachs-donnez-un-nouvel-elan-a-votre-carriere-avec-les-extras'
 WHERE "slug" = 'e-ducateurs-professeurs-coachs-donnez-un-nouvel-e-lan-a-votre-carrie-re-avec-les'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'educateurs-professeurs-coachs-donnez-un-nouvel-elan-a-votre-carriere-avec-les-extras');

-- Échec Scolaire : Lutter Contre Le Décrochage Scolaire
UPDATE "Article" SET "slug" = 'echec-scolaire-lutter-contre-le-decrochage-scolaire'
 WHERE "slug" = 'e-chec-scolaire-lutter-contre-le-de-crochage-scolaire'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'echec-scolaire-lutter-contre-le-decrochage-scolaire');

-- Apprendre Le Dessin : Le Matériel Et Les Techniques
UPDATE "Article" SET "slug" = 'apprendre-le-dessin-le-materiel-et-les-techniques'
 WHERE "slug" = 'apprendre-le-dessin-le-mate-riel-et-les-techniques'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'apprendre-le-dessin-le-materiel-et-les-techniques');

-- Faire Des Fiches De Révision : Optimiser Son Apprentissage
UPDATE "Article" SET "slug" = 'faire-des-fiches-de-revision-optimiser-son-apprentissage'
 WHERE "slug" = 'faire-des-fiches-de-re-vision-optimiser-son-apprentissage'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'faire-des-fiches-de-revision-optimiser-son-apprentissage');

-- L’École De La Deuxième Chance
UPDATE "Article" SET "slug" = 'l-ecole-de-la-deuxieme-chance'
 WHERE "slug" = 'l-e-cole-de-la-deuxie-me-chance'
   AND NOT EXISTS (SELECT 1 FROM "Article" a WHERE a."slug" = 'l-ecole-de-la-deuxieme-chance');
