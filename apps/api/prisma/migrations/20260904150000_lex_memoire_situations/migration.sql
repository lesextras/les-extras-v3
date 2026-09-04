-- LA MÉMOIRE DES SITUATIONS DE LEX.
--
-- `sujets` porte les pseudonymes stables des personnes dont parle le document
-- (« M.D-1 »), jamais leur nom. C'est la clé qui permet de retrouver ce qui a
-- déjà été écrit sur quelqu'un, sans qu'un seul nom réel ne s'inscrive ici :
-- les codes viennent de `LexPseudonyme`, qui ne stocke qu'une empreinte HMAC.
--
-- Additif et sans perte : la colonne naît avec un tableau vide. Les documents
-- existants sont repris par `prisma/seed-sujets-lex.js`, qui les relit et pose
-- leurs sujets sans jamais toucher au contenu.
--
-- L'index GIN sert la recherche d'antériorité : sans lui, chaque génération
-- balaierait tous les écrits du compte.
ALTER TABLE "AssistantDocument" ADD COLUMN IF NOT EXISTS "sujets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS "AssistantDocument_sujets_idx" ON "AssistantDocument" USING GIN ("sujets");
