-- L'administration de Piloter : le compte de l'association qui porte l'outil
-- reçoit le rôle global ADMIN. Le rôle vit en base et se retire de la même
-- façon : rien n'est écrit en dur dans le code.
UPDATE "User" SET "role" = 'ADMIN' WHERE lower("email") = 'assoc.adepa@gmail.com';
