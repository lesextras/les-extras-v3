-- COORDONNÉES BANCAIRES DE L'ÉMETTEUR : DE QUOI PAYER LA FACTURE
--
-- Écrite à la main plutôt que générée, et rendue idempotente : le conteneur
-- exécute `prisma migrate deploy` à chaque démarrage, et un redéploiement
-- rejoué sur une base déjà migrée ne doit pas tomber en erreur.
--
-- Le produit annonçait un règlement par virement « à l'IBAN qui figure sur la
-- facture », alors qu'aucune colonne ne portait cet IBAN : ni le PDF ni la
-- version imprimable ne pouvaient l'afficher, et l'établissement destinataire
-- n'avait matériellement aucun moyen de payer.
--
-- Les deux colonnes sont nullables, et le restent : la plateforme n'exige pas
-- d'IBAN de ses comptes. Aucune valeur par défaut n'est posée — des
-- coordonnées bancaires ne s'inventent pas, et une facture sans IBAN vaut
-- mieux qu'une facture portant celui de quelqu'un d'autre.

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "iban" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "bic" TEXT;
