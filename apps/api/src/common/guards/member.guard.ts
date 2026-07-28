import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Réserve une route aux comptes ADHÉRENTS (abonnement actif) — modèle
 * freemium : l'usage interne de la plateforme est gratuit, les
 * fonctionnalités LEX demandent l'adhésion. Les ADMIN passent toujours.
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
      select: { isMember: true, type: true },
    });
    // Les intervenants indépendants ont TOUT gratuitement : ils sont le côté
    // rare de la marketplace, on ne facture jamais l'offre. Seuls les
    // établissements passent à l'adhésion pour le niveau 2.
    if (account?.type === 'FREELANCE') return true;
    if (!account?.isMember) {
      throw new ForbiddenException(
        "Fonctionnalité LEX réservée aux adhérents. Activez l'adhésion depuis Abonnement & crédits.",
      );
    }
    return true;
  }
}
