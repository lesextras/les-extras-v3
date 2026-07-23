import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEntretienDto,
  CreateJalonDto,
  UpdateJalonDto,
  UpsertTutoratDto,
} from './dto/tutorat.dto';

const TUTORAT_INCLUDE = {
  tutor: { select: { id: true, firstName: true, lastName: true } },
  entretiens: { orderBy: { date: 'desc' as const } },
  jalons: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class TutoratService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertManage(inscriptionId: string, accountId: string, userId: string) {
    const ins = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { session: { include: { formation: true } } },
    });
    if (!ins) throw new NotFoundException('Inscription introuvable.');
    const s = ins.session;
    const ok =
      s.formation.ownerAccountId === accountId ||
      s.hostAccountId === accountId ||
      s.trainerId === userId;
    if (!ok) throw new ForbiddenException('Accès au tutorat refusé.');
    return ins;
  }

  async getByInscription(inscriptionId: string, accountId: string, userId: string) {
    await this.assertManage(inscriptionId, accountId, userId);
    return this.prisma.tutorat.findUnique({
      where: { inscriptionId },
      include: TUTORAT_INCLUDE,
    });
  }

  private async getOrCreate(inscriptionId: string, accountId: string, userId: string) {
    await this.assertManage(inscriptionId, accountId, userId);
    const existing = await this.prisma.tutorat.findUnique({ where: { inscriptionId } });
    if (existing) return existing;
    return this.prisma.tutorat.create({ data: { inscriptionId, tutorId: userId } });
  }

  async upsert(inscriptionId: string, accountId: string, userId: string, dto: UpsertTutoratDto) {
    await this.assertManage(inscriptionId, accountId, userId);
    return this.prisma.tutorat.upsert({
      where: { inscriptionId },
      create: {
        inscriptionId,
        tutorId: dto.tutorId ?? userId,
        projetAvenir: dto.projetAvenir,
      },
      update: {
        tutorId: dto.tutorId ?? undefined,
        projetAvenir: dto.projetAvenir,
        status: dto.status,
      },
      include: TUTORAT_INCLUDE,
    });
  }

  async addEntretien(inscriptionId: string, accountId: string, userId: string, dto: CreateEntretienDto) {
    const t = await this.getOrCreate(inscriptionId, accountId, userId);
    return this.prisma.entretien.create({
      data: { tutoratId: t.id, date: new Date(dto.date), notes: dto.notes },
    });
  }

  async addJalon(inscriptionId: string, accountId: string, userId: string, dto: CreateJalonDto) {
    const t = await this.getOrCreate(inscriptionId, accountId, userId);
    return this.prisma.jalon.create({
      data: {
        tutoratId: t.id,
        label: dto.label,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateJalon(jalonId: string, accountId: string, userId: string, dto: UpdateJalonDto) {
    const jalon = await this.prisma.jalon.findUnique({
      where: { id: jalonId },
      include: { tutorat: true },
    });
    if (!jalon) throw new NotFoundException('Jalon introuvable.');
    await this.assertManage(jalon.tutorat.inscriptionId, accountId, userId);
    return this.prisma.jalon.update({
      where: { id: jalonId },
      data: {
        label: dto.label,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
      },
    });
  }
}
