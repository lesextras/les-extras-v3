import { SetMetadata } from '@nestjs/common';
import { Capacite } from '@prisma/client';

export const CAPACITE_KEY = 'ouCapacite';

/**
 * LE DROIT DÉCLARÉ, EN RENFORT DU RÔLE — jamais à sa place.
 *
 * Posé sur une route à côté de `@AccountRoles(...)`, il ouvre un SECOND
 * chemin : on passe si le rôle suffit, OU si le rattachement porte la
 * capacité. C'est un OU, jamais un ET. La raison est concrète : les droits
 * déclarés sont vides par défaut sur les comptes déjà créés, et les exiger
 * fermerait la porte à des directions sur leur propre établissement.
 *
 * ⚠ La valeur doit exister dans l'énumération `Capacite` du schéma Prisma.
 * Voir `apps/web/src/lib/droits.ts` pour le libellé lu par la personne.
 */
export const OuCapacite = (capacite: Capacite) => SetMetadata(CAPACITE_KEY, capacite);
