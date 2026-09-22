-- Le client dit comment il règle au moment de réserver : par carte si la
-- fiche l’accepte, par virement sur facture sinon.
--
-- Colonne nullable, sans valeur par défaut : les réservations existantes n’ont
-- rien dit, et on ne leur invente pas de réponse. Ajout pur, aucune ligne
-- réécrite, aucune donnée touchée.
CREATE TYPE "ModePaiement" AS ENUM ('CARTE', 'VIREMENT');

ALTER TABLE "Booking" ADD COLUMN "modePaiement" "ModePaiement";
