import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestAccount } from '../common/types/request-context';
import { CreateUnitDto, UpdateUnitDto, AssignMemberDto } from './dto/unit.dto';

/**
 * Unités / services d'un établissement (repris de Symfony : Service/unités).
 * Toutes les opérations sont bornées au COMPTE ACTIF (isolation multi-tenant).
 */
@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste les unités du compte actif + nombre de membres rattachés. */
  async list(account: RequestAccount) {
    const units = await this.prisma.orgUnit.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { memberships: true, missions: true } } },
    });
    return units.map((u) => ({
      id: u.id,
      name: u.name,
      description: u.description,
      memberCount: u._count.memberships,
      missionCount: u._count.missions,
      createdAt: u.createdAt,
    }));
  }

  create(account: RequestAccount, dto: CreateUnitDto) {
    return this.prisma.orgUnit.create({
      data: { accountId: account.id, name: dto.name, description: dto.description },
    });
  }

  /** Charge une unité en garantissant qu'elle appartient au compte actif. */
  private async loadOwned(account: RequestAccount, id: string) {
    const unit = await this.prisma.orgUnit.findUnique({ where: { id } });
    if (!unit || unit.accountId !== account.id) {
      throw new NotFoundException('Unité introuvable.');
    }
    return unit;
  }

  async update(account: RequestAccount, id: string, dto: UpdateUnitDto) {
    await this.loadOwned(account, id);
    return this.prisma.orgUnit.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(account: RequestAccount, id: string) {
    await this.loadOwned(account, id);
    // onDelete: SetNull côté membres & missions → aucun rattachement orphelin.
    await this.prisma.orgUnit.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Rattache (ou détache si unitId absent) un membre à une unité.
   * Le membership ET l'unité doivent appartenir au compte actif.
   */
  async assignMember(account: RequestAccount, dto: AssignMemberDto) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: dto.membershipId },
    });
    if (!membership || membership.accountId !== account.id) {
      throw new NotFoundException('Membre introuvable.');
    }
    if (dto.unitId) {
      await this.loadOwned(account, dto.unitId);
    }
    return this.prisma.membership.update({
      where: { id: dto.membershipId },
      data: { orgUnitId: dto.unitId ?? null },
      select: { id: true, orgUnitId: true },
    });
  }
}
