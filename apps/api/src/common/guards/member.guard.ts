import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AccountRole, Capacite } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SELECT_MEMBRE, a as detient, versMembreCourant } from '../perimetre';
import { messageDroitManquant } from './account-roles.guard';

/**
 * Réserve une route aux comptes qui peuvent payer une génération LEX :
 * solde de crédits > 0, ou accès illimité accordé à la main (`isMember`,
 * utilisé comme interrupteur d'exonération pour les comptes partenaires).
 * Les ADMIN passent toujours.
 *
 * C'est la SEULE barrière payante de la plateforme : publier ses ateliers,
 * candidater au renfort, contractualiser, gérer son équipe — tout cela
 * demeure gratuit, pour les intervenants comme pour les établissements.
 * La consommation effective du crédit se fait dans le gestionnaire de la
 * route (CreditsService.avecCredit), pas ici : la garde vérifie seulement
 * qu'il y a de quoi payer.
 */
@Injectable()
export class MemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role === 'ADMIN') return true;
    const accountId: string | undefined = req.account?.id;
    if (!accountId) return false;

    // LE FORFAIT LEX EST PARTAGÉ — ET IL SE DÉPENSE.
    //
    // N'importe quel membre actif du compte pouvait le consommer : le solde
    // d'un établissement partait sans que personne n'ait rien accordé. Le
    // droit « Utiliser les générations LEX de l'établissement » existait
    // pourtant, déclaré dans « Mon poste » et rangé en base, et rien ne le
    // lisait. Il est lu ici, en OU avec le rôle : direction, administration
    // et chefs de service continuent de générer sans rien déclarer, et
    // l'intervenant reste propriétaire de son propre compte, donc de son
    // propre forfait.
    const ROLES_LEX: AccountRole[] = [
      AccountRole.OWNER,
      AccountRole.ADMIN,
      AccountRole.MANAGER,
    ];
    const membershipId: string | undefined = req.account?.membershipId;
    if (!ROLES_LEX.includes(req.account?.role) && membershipId) {
      const membre = await this.prisma.membership.findUnique({
        where: { id: membershipId },
        select: SELECT_MEMBRE,
      });
      if (
        !membre ||
        !detient(versMembreCourant(membre), Capacite.UTILISER_CREDITS_LEX)
      ) {
        throw new ForbiddenException(
          messageDroitManquant(Capacite.UTILISER_CREDITS_LEX),
        );
      }
    }
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { credits: true, isMember: true },
    });
    if (!account) return false;
    if (account.isMember) return true;
    if (account.credits <= 0) {
      throw new ForbiddenException(
        'Votre solde de crédits LEX est épuisé. Rechargez des crédits ou prenez un abonnement à recharge quotidienne : le reste de la plateforme demeure gratuit.',
      );
    }
    return true;
  }
}
