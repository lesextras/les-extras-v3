-- Essai Découverte LEX : recharge quotidienne gratuite pendant 7 jours,
-- une seule fois par compte (non nul = déjà utilisé).
ALTER TABLE "Account" ADD COLUMN "lexTrialEndsAt" TIMESTAMP(3);
