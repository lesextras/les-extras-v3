import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  /** Détecte les chevauchements de créneaux pour un même intervenant. */
  async detectConflicts(freelanceId: string, startAt: Date, endAt: Date, excludeId?: string) {
    if (!freelanceId) return [];
    return this.prisma.shift.findMany({
      where: {
        freelanceId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: ['PLANNED', 'CONFIRMED'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, title: true, startAt: true, endAt: true },
    });
  }

  /** Planning d'un compte (établissement) OU shifts assignés (freelance). */
  async getPlanning(accountId: string, accountType: string, userId: string, from?: string, to?: string) {
    if ((from && Number.isNaN(Date.parse(from))) || (to && Number.isNaN(Date.parse(to)))) {
      throw new BadRequestException('Dates de période invalides.');
    }
    const range: any = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    const where: any = accountType === 'FREELANCE'
      ? { freelanceId: userId }
      : { accountId };
    if (from || to) where.startAt = range;
    return this.prisma.shift.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        freelance: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        mission: { select: { id: true, title: true } },
      },
    });
  }

  async createShift(accountId: string, dto: CreateShiftDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new BadRequestException('La fin doit être après le début.');

    let conflicts: any[] = [];
    if (dto.freelanceId) {
      conflicts = await this.detectConflicts(dto.freelanceId, startAt, endAt);
      if (conflicts.length && !dto.force) {
        throw new BadRequestException({
          message: "Conflit de planning : l'intervenant a déjà un créneau sur cette période.",
          conflicts,
        });
      }
    }
    const shift = await this.prisma.shift.create({
      data: {
        accountId,
        title: dto.title,
        startAt, endAt,
        freelanceId: dto.freelanceId ?? null,
        missionId: dto.missionId ?? null,
        bookingId: dto.bookingId ?? null,
        notes: dto.notes ?? null,
        recurrenceRule: dto.recurrenceRule ?? null,
      },
    });
    return { shift, warnings: conflicts.length ? { conflicts } : undefined };
  }

  async updateShift(accountId: string, id: string, dto: UpdateShiftDto) {
    const existing = await this.prisma.shift.findFirst({ where: { id, accountId } });
    if (!existing) throw new NotFoundException('Créneau introuvable.');
    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    if (endAt <= startAt) throw new BadRequestException('La fin doit être après le début.');
    const freelanceId = dto.freelanceId ?? existing.freelanceId ?? undefined;
    if (freelanceId) {
      const conflicts = await this.detectConflicts(freelanceId, startAt, endAt, id);
      if (conflicts.length && !dto.force) {
        throw new BadRequestException({ message: 'Conflit de planning.', conflicts });
      }
    }
    return this.prisma.shift.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        startAt, endAt,
        freelanceId: dto.freelanceId ?? existing.freelanceId,
        notes: dto.notes ?? existing.notes,
      },
    });
  }

  async setStatus(accountId: string, id: string, status: string) {
    const existing = await this.prisma.shift.findFirst({ where: { id, accountId } });
    if (!existing) throw new NotFoundException('Créneau introuvable.');
    return this.prisma.shift.update({ where: { id }, data: { status: status as any } });
  }

  async deleteShift(accountId: string, id: string) {
    const existing = await this.prisma.shift.findFirst({ where: { id, accountId } });
    if (!existing) throw new NotFoundException('Créneau introuvable.');
    await this.prisma.shift.delete({ where: { id } });
    return { ok: true };
  }

  /** Matérialise un shift à partir d'un booking confirmé (mission planifiée). */
  async shiftFromBooking(accountId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId },
      include: { mission: true, shift: true },
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.mission && booking.mission.accountId !== accountId) {
      throw new ForbiddenException('Réservation hors de votre compte.');
    }
    if (booking.shift) return booking.shift as any;
    const m = booking.mission;
    const startAt = m?.startDate ?? booking.scheduledAt ?? new Date();
    const endAt = m?.endDate ?? new Date(startAt.getTime() + 8 * 3600000);
    return this.prisma.shift.create({
      data: {
        accountId,
        title: m?.title ?? 'Mission',
        startAt, endAt,
        missionId: m?.id ?? null,
        bookingId: booking.id,
        status: 'CONFIRMED',
      },
    });
  }

  // --- Disponibilités (freelance) ----------------------------------------
  listAvailability(userId: string) {
    return this.prisma.availability.findMany({ where: { userId }, orderBy: [{ weekday: 'asc' }, { date: 'asc' }] });
  }

  addAvailability(userId: string, dto: any) {
    return this.prisma.availability.create({
      data: {
        userId,
        weekday: dto.weekday ?? null,
        date: dto.date ? new Date(dto.date) : null,
        startTime: dto.startTime ?? '09:00',
        endTime: dto.endTime ?? '17:00',
        type: (dto.type ?? 'AVAILABLE') as any,
      },
    });
  }

  async removeAvailability(userId: string, id: string) {
    const a = await this.prisma.availability.findFirst({ where: { id, userId } });
    if (!a) throw new NotFoundException('Disponibilité introuvable.');
    await this.prisma.availability.delete({ where: { id } });
    return { ok: true };
  }
}
