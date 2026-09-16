-- RATTRAPAGE DE L'HISTORIQUE — 16/09/2026.
--
-- Héritage de l'époque `prisma db push` : cinq changements sont arrivés en base
-- sans jamais être écrits dans une migration. La production les a donc, mais
-- l'historique ne les connaît pas — autrement dit, une base RECONSTRUITE À ZÉRO
-- depuis `prisma migrate deploy` serait incomplète : `FileKind` sans la valeur
-- SERVICE, `Formation` sans `enrollUrl` ni `freeOnline`, et trois `updatedAt`
-- gardant un DEFAULT que le schéma ne déclare pas.
--
-- Cette migration remet l'historique d'aplomb. Elle est écrite pour être
-- NEUTRE sur la production (tout y est déjà) et CORRECTE sur une base neuve,
-- d'où les IF NOT EXISTS : `migrate deploy` tourne au démarrage de l'API, et
-- une migration qui échoue empêcherait le conteneur de démarrer.
--
-- `DROP DEFAULT` est idempotent par nature : sans défaut à retirer, l'ordre ne
-- fait rien et ne lève pas d'erreur.

ALTER TYPE "FileKind" ADD VALUE IF NOT EXISTS 'SERVICE';

ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "enrollUrl" TEXT;
ALTER TABLE "Formation" ADD COLUMN IF NOT EXISTS "freeOnline" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "LexMot" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "LexPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "SupportTicket" ALTER COLUMN "updatedAt" DROP DEFAULT;
