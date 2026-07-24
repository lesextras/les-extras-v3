import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRole, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestAccount } from '../common/types/request-context';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste les membres (sous-comptes) du compte actif. */
  list(account: RequestAccount) {
    return this.prisma.membership.findMany({
      where: { accountId: account.id },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        orgUnitId: true,
        orgUnit: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Charge une adhésion en garantissant qu'elle appartient BIEN au compte actif
   * (isolation multi-tenant : on ne touche jamais un membership d'un autre compte).
   */
  private async loadInAccount(account: RequestAccount, membershipId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { account: { select: { ownerId: true } } },
    });

    if (!membership || membership.accountId !== account.id) {
      throw new NotFoundException('Membre introuvable pour ce compte.');
    }
    return membership;
  }

  async changeRole(account: RequestAccount, membershipId: string, role: AccountRole) {
    const membership = await this.loadInAccount(account, membershipId);

    if (membership.userId === membership.account.ownerId) {
      throw new BadRequestException("Le rôle du propriétaire ne peut être modifié.");
    }
    if (role === AccountRole.OWNER) {
      throw new BadRequestException(
        "Impossible d'attribuer le rôle OWNER (transfert de propriété non supporté ici).",
      );
    }
    // Un ADMIN ne peut pas modifier un autre ADMIN ; seul un OWNER le peut.
    if (
      account.role === AccountRole.ADMIN &&
      membership.role === AccountRole.ADMIN
    ) {
      throw new ForbiddenException("Un ADMIN ne peut pas modifier un autre ADMIN.");
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      select: { id: true, role: true, status: true },
    });
  }

  async setStatus(
    account: RequestAccount,
    membershipId: string,
    status: MembershipStatus,
  ) {
    const membership = await this.loadInAccount(account, membershipId);

    if (membership.userId === membership.account.ownerId) {
      throw new BadRequestException("Le propriétaire ne peut être suspendu.");
    }
    if (
      account.role === AccountRole.ADMIN &&
      membership.role === AccountRole.ADMIN
    ) {
      throw new ForbiddenException("Un ADMIN ne peut pas suspendre un autre ADMIN.");
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async remove(account: RequestAccount, membershipId: string) {
    const membership = await this.loadInAccount(account, membershipId);

    if (membership.userId === membership.account.ownerId) {
      throw new BadRequestException("Le propriétaire ne peut être retiré du compte.");
    }
    if (
      account.role === AccountRole.ADMIN &&
      membership.role === AccountRole.ADMIN
    ) {
      throw new ForbiddenException("Un ADMIN ne peut pas retirer un autre ADMIN.");
    }

    await this.prisma.membership.delete({ where: { id: membershipId } });
    return { removed: true, id: membershipId };
  }
}
