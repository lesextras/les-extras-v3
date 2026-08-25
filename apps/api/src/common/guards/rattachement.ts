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
/**
 * REGARDER, OUI ; AGIR, NON (25/08/2026).
 *
 * Un salarié qui attend son rattachement peut voir tout ce que voit un
 * intervenant — les missions ouvertes, le catalogue des ateliers, l'Édublog,
 * les avis — mais il ne publie rien et ne candidate à rien. C'est la
 * différence entre consulter une place de marché et y prendre place.
 *
 * D'où une seconde liste, ouverte en LECTURE SEULE : la méthode HTTP fait
 * foi. Un GET passe, tout le reste attend le rattachement.
 */
const LECTURE_SEULE_SANS_RATTACHEMENT = new Set([
  // Les missions de renfort ouvertes, et leur détail.
  'missions',
  // Le catalogue des ateliers et des formations.
  'services',
  // Les opportunités classées par correspondance de profil.
  'matching',
  // Les avis, qui s'affichent sur les fiches.
  'reviews',
  // Points, parrainage, Édublog : ce qui fait vivre la communauté.
  'community',
  'articles',
]);

/** La route est-elle ouverte à un salarié non rattaché ? */
export function routeOuverteSansRattachement(url: string, methode?: string): boolean {
  const racine = racineDuChemin(url);
  if (OUVERT_SANS_RATTACHEMENT.has(racine)) return true;
  return methode === 'GET' && LECTURE_SEULE_SANS_RATTACHEMENT.has(racine);
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
