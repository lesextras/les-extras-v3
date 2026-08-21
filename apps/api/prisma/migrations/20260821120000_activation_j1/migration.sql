-- E-mail d'activation J+1 : la date à laquelle la décision d'envoyer (ou de
-- s'abstenir) a été prise pour cet utilisateur. Idempotente, comme toutes les
-- migrations du projet : rejouable sans dégât sur une base déjà à jour.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activationMailAt" TIMESTAMP(3);
