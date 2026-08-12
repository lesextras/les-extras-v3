import { MembershipStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * LA PORTÉE D'UNE FICHE PUBLIÉE PAR UN SALARIÉ.
 *
 * Un intervenant indépendant propose ses ateliers au marché : sa fiche vit
 * dans le catalogue public, n'importe quel établissement la réserve, il
 * facture. Un salarié, non. Ce qu'il anime, il l'anime pour la maison qui
 * l'emploie — et cette maison le paie en salaire, pas sur facture. Sa fiche
 * n'a donc rien à faire dans une vitrine ouverte : elle s'adresse aux
 * établissements auxquels il est rattaché, et à eux seuls.
 *
 * Le rattachement est un `Membership` ACTIF entre le TITULAIRE du compte
 * intervenant et un compte d'établissement. Une même personne peut en avoir
 * plusieurs — le remplaçant qui tourne entre deux maisons est le cas courant,
 * pas l'exception — et sa fiche est alors visible des deux.
 *
 * Deux endroits appliquent la règle, et il faut les deux : la LISTE (ne pas
 * montrer ce qui n'est pas pour vous) et la RÉSERVATION (ne pas laisser
 * réserver ce qu'on aurait vu autrement, par un lien direct par exemple). Une
 * règle qui ne vit que dans la liste se contourne avec une URL.
 */

/**
 * Filtre de visibilité des fiches, à composer avec le reste du `where`.
 *
 * Sans lecteur identifié (vitrine publique), seules les fiches des
 * indépendants passent. Avec un lecteur, s'y ajoutent les fiches des salariés
 * qui lui sont rattachés.
 */
export function visibleParCompte(lecteurAccountId?: string): Prisma.ServiceWhereInput {
  const independants: Prisma.ServiceWhereInput = { account: { profilSalarie: false } };
  if (!lecteurAccountId) return independants;
  return {
    OR: [
      independants,
      {
        account: {
          profilSalarie: true,
          owner: {
            memberships: {
              some: { accountId: lecteurAccountId, status: MembershipStatus.ACTIVE },
            },
          },
        },
      },
    ],
  };
}

/**
 * Ce compte peut-il réserver cette fiche ?
 *
 * Répond vrai pour toute fiche d'indépendant. Pour celle d'un salarié, exige
 * que le réservant soit l'un des établissements qui l'emploient.
 */
export async function reservableParCompte(
  prisma: PrismaService,
  serviceId: string,
  reservantAccountId: string,
): Promise<boolean> {
  const trouve = await prisma.service.findFirst({
    where: { id: serviceId, ...visibleParCompte(reservantAccountId) },
    select: { id: true },
  });
  return trouve !== null;
}

/** Ce qu'on dit à un établissement qui tente de réserver la fiche d'un salarié. */
export const MESSAGE_HORS_PORTEE =
  'Cet atelier est proposé par un salarié : seuls les établissements auxquels ' +
  'il est rattaché peuvent le réserver.';
