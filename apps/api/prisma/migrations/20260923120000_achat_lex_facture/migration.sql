-- Migration vidée le 23/09/2026 : son contenu initial reprenait par erreur la migration
-- du devis signé (enum QUOTE déjà présent) et faisait échouer le déploiement.
-- Les colonnes de facture de CreditPurchase sont dans 20260923121000_achat_lex_facture_colonnes.
SELECT 1;
