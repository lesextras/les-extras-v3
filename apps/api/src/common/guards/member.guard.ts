import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { credits: true, isMember: true },
    });
    if (!account) return false;
    if (account.isMember) return true;
    if (account.credits <= 0) {
      throw new ForbiddenException(
        'Votre solde de crédits LEX est épuisé. Rechargez des crédits ou prenez un abonnement à recharge quotidienne — le reste de la plateforme demeure gratuit.',
      );
    }
    return true;
  }
}
