-- Reservation d'atelier : l'effectif et les precisions du demandeur.
--
-- Le formulaire les demandait depuis toujours, le DTO les refusait, et la
-- validation stricte transformait le refus en erreur 400. Autrement dit, le
-- bouton « Reserver cet atelier » ne fonctionnait qu'a condition de laisser le
-- formulaire a moitie vide. Les deux colonnes manquaient simplement en base.
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "participants" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "requestNote" TEXT;
