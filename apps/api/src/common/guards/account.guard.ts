import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AccountGuard — cœur de l'isolation multi-tenant.
 *
 * 1. Lit le header `x-account-id`.
 * 2. Vérifie que req.user possède un Membership ACTIF sur ce compte.
 * 3. Pose `req.account = { id, role, type, membershipId }`.
 *
 * À utiliser APRÈS JwtAuthGuard : `@UseGuards(JwtAuthGuard, AccountGuard)`.
 * Un utilisateur ne peut JAMAIS activer un compte dont il n'est pas membre.
 */
@Injectable()
export class AccountGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException('Authentification requise.');
    }

    const raw = request.headers['x-account-id'];
    const accountId = Array.isArray(raw) ? raw[0] : raw;

    if (!accountId) {
      throw new BadRequestException('Header x-account-id requis pour ce compte actif.');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId: user.id, accountId } },
      include: { account: { select: { type: true } } },
    });

    if (!membership) {
      // Ne pas révéler l'existence du compte : accès simplement refusé.
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
