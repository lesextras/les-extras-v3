import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountRole,
  AccountType,
  MembershipStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, randomSuffix } from '../common/utils/slug.util';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie que l'utilisateur est membre ACTIF du compte et, si des rôles
   * sont exigés, qu'il détient l'un d'eux. Base de l'isolation multi-tenant
   * pour toutes les routes /accounts/:id.
   */
  private async requireMembership(
    userId: string,
    accountId: string,
    roles?: AccountRole[],
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      // Ne pas divulguer l'existence du compte.
      throw new ForbiddenException("Accès refusé à ce compte.");
    }

    if (roles && roles.length > 0 && !roles.includes(membership.role)) {
      throw new ForbiddenException(
        `Rôle insuffisant (requis : ${roles.join(' | ')}).`,
      );
    }

    return membership;
  }

  /** Comptes accessibles par l'utilisateur (memberships actifs). */
  async findMine(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        account: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            logoUrl: true,
            credits: true,
            city: true,
          },
        },
      },
    });
    return memberships.map((m) => ({ ...m.account, membershipRole: m.role }));
  }

  async findOne(userId: string, accountId: string) {
    await this.requireMembership(userId, accountId);
    return this.prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  }

  /** Crée un nouveau compte ; le créateur en devient OWNER. */
  async create(userId: string, dto: CreateAccountDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: dto.name,
          type: dto.type,
          slug,
          legalName: dto.legalName,
          siret: dto.siret,
          address: dto.address,
          city: dto.city,
          postalCode: dto.postalCode,
          phone: dto.phone,
          logoUrl: dto.logoUrl,
          ownerId: userId,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          accountId: account.id,
          role: AccountRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return account;
    });
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    await this.requireMembership(userId, accountId, [
      AccountRole.OWNER,
      AccountRole.ADMIN,
    ]);

    return this.prisma.account.update({
      where: { id: accountId },
      data: { ...dto } as Prisma.AccountUpdateInput,
    });
  }

  /** Suppression : réservée au OWNER (propriétaire du tenant). */
  async remove(userId: string, accountId: string) {
    const membership = await this.requireMembership(userId, accountId, [
      AccountRole.OWNER,
    ]);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Compte introuvable.');
    if (account.ownerId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer ce compte.');
    }

    await this.prisma.account.delete({ where: { id: accountId } });
    return { deleted: true, id: accountId, membershipId: membership.id };
  }

  /**
   * "Switch" de compte actif : valide l'appartenance et renvoie le contexte
   * de compte. Le front pose ensuite le header x-account-id / cookie.
   */
  async switchAccount(userId: string, accountId: string) {
    const membership = await this.requireMembership(userId, accountId);
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { id: true, name: true, slug: true, type: true, logoUrl: true },
    });
    return { account, role: membership.role, membershipId: membership.id };
  }

  /**
   * Ajuste les crédits d'un compte ESTABLISHMENT (packs de renfort).
   * OWNER/ADMIN uniquement. Refuse un solde négatif.
   */
  /**
   * Ajuste les crédits d'un compte établissement.
   * Réservé à l'administration plateforme (contrôlé par AdminGuard côté route) :
   * un établissement ne peut PAS s'auto-créditer sans contrepartie (paiement).
   * Le paramètre `platformAdmin` court-circuite le contrôle d'appartenance.
   */
  async adjustCredits(
    userId: string,
    accountId: string,
    delta: number,
    platformAdmin = false,
  ) {
    if (!platformAdmin) {
      await this.requireMembership(userId, accountId, [
        AccountRole.OWNER,
        AccountRole.ADMIN,
      ]);
    }

    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { type: true, credits: true },
    });

    if (account.type !== AccountType.ESTABLISHMENT) {
      throw new BadRequestException(
        'Les crédits ne concernent que les comptes ESTABLISHMENT.',
      );
    }

    const next = account.credits + delta;
    if (next < 0) {
      throw new BadRequestException('Crédits insuffisants.');
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { credits: next },
      select: { id: true, credits: true },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'compte';
    let candidate = base;
    for (let i = 0; i < 5; i++) {
      const clash = await this.prisma.account.findUnique({ where: { slug: candidate } });
      if (!clash) return candidate;
      candidate = `${base}-${randomSuffix(4)}`;
    }
    return `${base}-${randomSuffix(8)}`;
  }
}
