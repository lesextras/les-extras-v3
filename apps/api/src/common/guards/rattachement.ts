import { MembershipStatus, AccountType } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * LE COMPTE SALARIÉ EN ATTENTE DE RATTACHEMENT.
 *
 * Un salarié n'exerce pas pour son compte : il travaille pour une maison.
 * Tant qu'aucun établissement ne l'a accepté, son compte n'a rien à publier,
 * rien à facturer, personne à qui répondre — mais il peut déjà écrire, et
 * c'est précisément ce que LEX lui apporte. On lui ouvre donc LEX, sa demande
 * de rattachement, et son propre dossier. Le reste attend.
 *
 * Le contrôle vit dans `AccountGuard`, c'est-à-dire au seul endroit que TOUTE
 * route rattachée à un compte traverse. Le poser dans les contrôleurs un par
 * un revenait à en oublier un — et un garde-fou oublié quelque part n'est pas
 * un garde-fou, c'est une opinion.
 */

/**
 * Racines ouvertes à un salarié non encore rattaché. Comparées au premier
 * segment du chemin, jamais par simple préfixe de chaîne : `/servicesXYZ` ne
 * doit pas passer parce que `services` est absent de la liste.
 */
const OUVERT_SANS_RATTACHEMENT = new Set([
  // LEX — la raison d'être du compte en attendant.
  'assistant',
  // Ses crédits LEX : solde, dotation, journal.
  'billing',
  // Demander son rattachement, suivre sa demande, l'annuler.
  'attachment-requests',
  // Son identité et son propre compte.
  'auth',
  'users',
  'accounts',
  'memberships',
  // Être prévenu quand un établissement l'accepte.
  'notifications',
  'push',
  // Répondre à une invitation reçue par e-mail.
  'invitations',
  // Déposer ses pièces (carte d'identité, diplôme) pendant l'attente.
  'files',
  'documents',
  // Vitrine et santé : jamais rattachées à un compte de toute façon.
  'public',
  'health',
]);

/** Message affiché à la personne — il part à l'écran, pas dans un journal. */
export const MESSAGE_EN_ATTENTE =
  "Votre compte salarié attend d'être rattaché à un établissement. " +
  "En attendant, LEX reste à votre disposition pour vos écrits. " +
  'Envoyez votre demande de rattachement depuis votre tableau de bord : ' +
  "dès qu'un établissement l'accepte, tout s'ouvre.";

/** Premier segment du chemin, sans le préfixe global `/api`. */
export function racineDuChemin(url: string): string {
  const sansQuery = url.split('?')[0] ?? '';
  const segments = sansQuery.split('/').filter(Boolean);
  if (segments[0] === 'api') segments.shift();
  return segments[0] ?? '';
}

/** Cette route est-elle ouverte à un salarié qui attend son rattachement ? */
export function routeOuverteSansRattachement(url: string): boolean {
  return OUVERT_SANS_RATTACHEMENT.has(racineDuChemin(url));
}

/**
 * Le compte est-il celui d'un salarié qu'aucun établissement n'a encore
 * accepté ?
 *
 * Un seul rattachement actif suffit à ouvrir le compte, et une même adresse
 * peut en porter plusieurs : on cherche donc l'existence d'au moins un
 * Membership ACTIF sur un compte d'établissement, pas le compte actif.
 */
export async function salarieEnAttente(
  prisma: PrismaService,
  userId: string,
  compte: { type: AccountType; profilSalarie: boolean },
): Promise<boolean> {
  if (compte.type !== AccountType.FREELANCE || !compte.profilSalarie) return false;
  const rattachement = await prisma.membership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      account: { type: AccountType.ESTABLISHMENT },
    },
    select: { id: true },
  });
  return rattachement === null;
}
