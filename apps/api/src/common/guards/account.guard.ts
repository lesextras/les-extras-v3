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
import {
  MESSAGE_EN_ATTENTE,
  routeOuverteSansRattachement,
  salarieEnAttente,
} from './rattachement';

/**
 * AccountGuard — cœur de l'isolation multi-tenant.
 *
 * 1. Lit le header `x-account-id`.
 * 2. Vérifie que req.user possède un Membership ACTIF sur ce compte.
 * 3. Pose `req.account = { id, role, type, membershipId }`.
 * 4. Referme le compte d'un salarié qu'aucun établissement n'a encore
 *    rattaché : il ne lui reste que LEX et sa demande (voir `rattachement.ts`).
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
      include: { account: { select: { type: true, profilSalarie: true } } },
    });

    if (!membership) {
      // Ne pas révéler l'existence du compte : accès simplement refusé.
      throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('Votre accès à ce compte est suspendu.');
    }

    // Un salarié non rattaché n'a ni fiche à publier ni facture à émettre :
    // on referme tout sauf LEX et le chemin qui le sortira de l'attente. Le
    // contrôle passe APRÈS l'appartenance au compte — être bloqué ici veut
    // dire « pas encore », pas « pas chez vous ».
    if (
      !routeOuverteSansRattachement(request.url ?? '') &&
      (await salarieEnAttente(this.prisma, user.id, membership.account))
    ) {
      throw new ForbiddenException(MESSAGE_EN_ATTENTE);
    }

    request.account = {
      id: membership.accountId,
      role: membership.role,
      type: membership.account.type,
      membershipId: membership.id,
      profilSalarie: membership.account.profilSalarie,
    };

    return true;
  }
}
