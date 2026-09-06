-- L'ÉCRIT LIBRE.
--
-- Les huit genres d'écrits proposés par LEX faisaient choisir avant de
-- comprendre. Trois suffisent à couvrir l'essentiel du travail d'une équipe :
-- la note d'observation, la transmission et le rapport de situation. Tout le
-- reste passe désormais par un écrit que le professionnel nomme lui-même, et
-- c'est ce nom qui décide de la forme du document.
--
-- On AJOUTE une valeur, on n'en retire aucune : des documents déjà enregistrés
-- portent les anciens genres, et une valeur d'enum PostgreSQL ne se retire pas
-- sans réécrire la colonne. Ce qui se réduit, c'est le choix offert à l'écran.
--
-- Précédent : 20260804140000_rattrapage_derive, même forme, appliquée en prod.

-- AlterEnum
ALTER TYPE "AssistantTrame" ADD VALUE IF NOT EXISTS 'ECRIT_LIBRE';
