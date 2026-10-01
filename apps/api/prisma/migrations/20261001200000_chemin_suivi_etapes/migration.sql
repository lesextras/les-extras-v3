-- LE CHEMIN, ÉTAPES ANNUELLES ET « PAS CONCERNÉ » (Pilote, 01/10/2026) :
-- la date où chaque étape a été cochée et le drapeau « pas concerné », pour
-- l'association (Organisation) et l'académie (Academie). Additive et
-- rejouable : une colonne JSON nullable par table, aucune colonne existante
-- n'est modifiée, aucune donnée n'est supprimée.

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "etapesSuivi" JSONB;

-- AlterTable
ALTER TABLE "Academie" ADD COLUMN IF NOT EXISTS "etapesSuivi" JSONB;
