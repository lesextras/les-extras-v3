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
    // Cette garde ne protège QUE les fonctionnalités LEX (IA) : l'adhésion à
    // l'association est requise pour tous, établissements comme intervenants.
    // Tout le reste — publier ses ateliers, candidater au renfort, animer une
    // formation — demeure gratuit pour les intervenants indépendants.
    if (!account?.isMember) {
      throw new ForbiddenException(
        "LEX est réservé aux adhérents de l'association. Le reste de la plateforme demeure gratuit.",
      );
    }
    return true;
  }
}
