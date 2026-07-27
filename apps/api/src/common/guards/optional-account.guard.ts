import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Variante tolérante d'AccountGuard.
 *
 * Même exigence de sécurité — on n'active un compte que si l'utilisateur en
 * est membre actif — mais l'absence d'en-tête `x-account-id` n'est pas une
 * erreur : `req.account` reste simplement vide.
 *
 * Utile pour le dépôt de documents : un intervenant indépendant dépose son
 * casier judiciaire sans avoir de compte d'établissement actif.
 */
@Injectable()
export class OptionalAccountGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('Authentification requise.');
    }

    const raw = request.headers['x-account-id'];
    const accountId = Array.isArray(raw) ? raw[0] : raw;
    if (!accountId) return true; // pas de compte actif : c'est permis ici.

    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId: user.id, accountId } },
      include: { account: { select: { type: true } } },
    });

    // Un en-tête fourni mais invalide reste une tentative d'accès hors
    // périmètre : on refuse, on ne l'ignore pas silencieusement.
    if (!membership) {
      throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    }
    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('Votre accès à ce compte est suspendu.');
    }

    request.account = {
      id: membership.accountId,
      role: membership.role,
      type: membership.account.type,
      membershipId: membership.id,
    };
    return true;
  }
}
