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

  /**
   * PLANNING UNIFIÉ.
   *
   * Le planning ne montrait que les créneaux saisis à la main : un renfort
   * pourvu, un atelier réservé ou une session de formation n'y apparaissaient
   * jamais. Il fallait tout ressaisir en double.
   *
   * On ne duplique rien en base : on ASSEMBLE à la lecture les réservations et
   * les sessions déjà enregistrées. Conséquence directe : si une date de
   * réservation change, le planning suit tout seul — il n'y a pas deux vérités
   * à tenir synchronisées, donc pas de planning qui ment.
   *
   * Les entrées déduites portent `modifiable: false` : on ne déplace pas une
   * intervention depuis le planning, on change sa date là où elle engage les
   * deux parties.
   */
  async getPlanning(accountId: string, accountType: string, userId: string, from?: string, to?: string) {
    if ((from && Number.isNaN(Date.parse(from))) || (to && Number.isNaN(Date.parse(to)))) {
      throw new BadRequestException('Dates de période invalides.');
    }
    const debut = from ? new Date(from) : undefined;
    const fin = to ? new Date(to) : undefined;
    const dansLaPeriode = (d: Date | null | undefined) =>
      Boolean(d) && (!debut || d! >= debut) && (!fin || d! <= fin);

    const range: any = {};
    if (debut) range.gte = debut;
    if (fin) range.lte = fin;
    const estFreelance = accountType === 'FREELANCE';

    // 1. Créneaux saisis à la main (réunions, astreintes, affectations).
    const whereShift: any = estFreelance ? { freelanceId: userId } : { accountId };
    if (debut || fin) whereShift.startAt = range;
    const shifts = await this.prisma.shift.findMany({
      where: whereShift,
      orderBy: { startAt: 'asc' },
      include: {
        freelance: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        mission: { select: { id: true, title: true } },
      },
    });

    // Une réservation déjà matérialisée en créneau ne doit pas s'afficher deux
    // fois : on retient les bookings déjà représentés.
    const dejaAffiches = new Set(shifts.map((s) => s.bookingId).filter(Boolean) as string[]);

    // 2. Réservations : renforts et ateliers, dans les deux sens (le compte a
    //    réservé, ou c'est lui qui intervient).
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        OR: [{ accountId }, { mission: { accountId } }, { service: { accountId } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        mission: { select: { id: true, title: true, accountId: true, startDate: true, endDate: true } },
        service: { select: { id: true, title: true, accountId: true, durationMinutes: true } },
        account: { select: { id: true, name: true } },
      },
    });

    const DUREE_DEFAUT_MIN = 120;
    const entreesReservations = bookings
      .filter((b) => !dejaAffiches.has(b.id))
      .map((b) => {
        const debutEntree = b.mission?.startDate ?? b.scheduledAt ?? null;
        if (!dansLaPeriode(debutEntree)) return null;
        const minutes = b.service?.durationMinutes ?? DUREE_DEFAUT_MIN;
        const finEntree =
          b.mission?.endDate ?? new Date(debutEntree!.getTime() + minutes * 60_000);
        return {
          id: `booking:${b.id}`,
          title: b.mission?.title ?? b.service?.title ?? 'Intervention',
          startAt: debutEntree!,
          endAt: finEntree,
          status: b.status === 'COMPLETED' ? 'DONE' : 'CONFIRMED',
          notes: b.account?.name ? `Avec ${b.account.name}` : null,
          freelance: null,
          mission: b.mission ? { id: b.mission.id, title: b.mission.title } : null,
          origine: b.mission ? 'RENFORT' : 'ATELIER',
          modifiable: false,
          lien: `/documents/contrat/${b.id}`,
        };
      })
      .filter(Boolean);

    // 3. Sessions de formation : celles que le compte accueille, et celles où
    //    il a inscrit quelqu'un.
    const sessions = await this.prisma.formationSession.findMany({
      where: {
        ...(debut || fin ? { startDate: range } : {}),
        OR: [
          { hostAccountId: accountId },
          { formation: { ownerAccountId: accountId } },
          { inscriptions: { some: { payerAccountId: accountId } } },
          ...(estFreelance ? [{ trainerId: userId }] : []),
        ],
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        location: true,
        formation: { select: { id: true, title: true, slug: true } },
        _count: { select: { inscriptions: true } },
      },
    });

    const entreesFormations = sessions.map((se) => ({
      id: `session:${se.id}`,
      title: se.title ?? se.formation?.title ?? 'Session de formation',
      startAt: se.startDate,
      endAt: se.endDate ?? new Date(se.startDate.getTime() + 7 * 3600_000),
      status: 'CONFIRMED',
      notes: [se.location, se._count.inscriptions ? `${se._count.inscriptions} inscrit(s)` : null]
        .filter(Boolean)
        .join(' · ') || null,
      freelance: null,
      mission: null,
      origine: 'FORMATION',
      modifiable: false,
      lien: se.formation?.slug ? `/formations/${se.formation.slug}` : null,
    }));

    const manuels = shifts.map((s) => ({
      ...s,
      origine: s.missionId ? 'RENFORT' : 'MANUEL',
      modifiable: true,
      lien: null as string | null,
    }));

    return [...manuels, ...entreesReservations, ...entreesFormations].sort(
      (a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
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
