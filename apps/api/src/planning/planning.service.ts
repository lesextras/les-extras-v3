import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { Constat, aUnBloquant, evaluerCreneau, PLAFONDS } from './conformite-horaire';

/**
 * Heure de fin d'une mission d'un seul jour, déduite de son horaire de fin.
 *
 * Le champ est saisi librement : « 17h00 », « 17:00 », « 17 h ». On accepte
 * les trois plutôt que d'imposer une forme à la personne qui remplit le
 * formulaire. Tout ce qui ne se lit pas renvoie `null`, et l'appelant reprend
 * son calcul habituel — jamais d'horaire inventé.
 */
function finDepuisHoraire(debut: Date | null, horaire: string | null): Date | null {
  if (!debut || !horaire) return null;
  const m = horaire.trim().match(/^(\d{1,2})\s*[h:]\s*(\d{2})?$/i);
  if (!m) return null;
  const heures = Number(m[1]);
  const minutes = Number(m[2] ?? 0);
  if (heures > 23 || minutes > 59) return null;

  const fin = new Date(debut);
  fin.setUTCHours(heures, minutes, 0, 0);
  // Une nuit d'internat finit le lendemain matin : 21 h → 7 h.
  if (fin <= debut) fin.setUTCDate(fin.getUTCDate() + 1);
  return fin;
}

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CONTRÔLES RÉGLEMENTAIRES sur un créneau, tous employeurs confondus.
   *
   * Ce qui a changé, et pourquoi : les garde-fous étaient calculés APRÈS la
   * création et renvoyés en simples avertissements. Le créneau illégal était
   * donc enregistré, et personne n'était couvert. Ils sont maintenant calculés
   * AVANT, et un dépassement de plafond bloque — sauf dérogation motivée, qui
   * est tracée. C'est cette trace qui protège le responsable en cas de
   * contrôle : il a été averti, il a décidé, c'est écrit.
   *
   * La fenêtre couvre 12 semaines avant et après : la moyenne glissante de
   * l'art. L. 3121-22 se calcule sur des fenêtres qui peuvent commencer bien
   * avant le créneau et se terminer bien après.
   *
   * On filtre sur `freelanceId` SANS filtrer sur `accountId` : les plafonds
   * s'apprécient en cumulant tous les employeurs (art. L. 8261-1).
   */
  private async controlesReglementaires(
    freelanceId: string | null | undefined,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<Constat[]> {
    if (!freelanceId) return [];
    const marge = PLAFONDS.fenetreSemaines * 7 * 86_400_000;
    const voisins = await this.prisma.shift.findMany({
      where: {
        freelanceId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: ['PLANNED', 'CONFIRMED', 'DONE'] },
        startAt: { gte: new Date(startAt.getTime() - marge) },
        endAt: { lte: new Date(endAt.getTime() + marge) },
      },
      select: { startAt: true, endAt: true },
    });
    return evaluerCreneau(voisins, { startAt, endAt });
  }

  /**
   * Lève une 400 lisible si un plafond est franchi sans motif de dérogation.
   * Le front n'a qu'à afficher `constats` : chaque entrée porte déjà sa phrase,
   * son article et sa jauge. Renvoie les constats pour qu'ils soient tracés.
   */
  private exigerDerogation(constats: Constat[], motif?: string): Constat[] {
    const bloquants = constats.filter((c) => c.gravite === 'BLOQUANT');
    if (bloquants.length && !motif?.trim()) {
      throw new BadRequestException({
        code: 'CONFORMITE_HORAIRE',
        message:
          bloquants.length === 1
            ? bloquants[0].message
            : `${bloquants.length} plafonds de durée du travail seraient dépassés.`,
        aide: "Vous pouvez passer outre en indiquant un motif : il sera enregistré avec votre nom et la date, et restera consultable en cas de contrôle.",
        constats: bloquants,
      });
    }
    return constats;
  }

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
  /**
   * Déduit le service d'un créneau quand on ne l'a pas précisé : celui auquel
   * l'intervenant est rattaché dans ce compte. On ne devine rien de plus —
   * si la personne n'est rattachée à aucun service, le créneau reste sans
   * service et apparaît dans le filtre « Sans service », ce qui est une
   * information utile plutôt qu'une affectation inventée.
   */
  private async serviceDeLIntervenant(
    accountId: string,
    freelanceId?: string | null,
  ): Promise<string | null> {
    if (!freelanceId) return null;
    const m = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId: freelanceId, accountId } },
      select: { orgUnitId: true },
    });
    return m?.orgUnitId ?? null;
  }

  async getPlanning(
    accountId: string,
    accountType: string,
    userId: string,
    from?: string,
    to?: string,
    orgUnitId?: string,
  ) {
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
    // Un chef de service pilote SON service. Le filtre porte sur les créneaux
    // saisis ; les réservations et les sessions de formation ne sont pas
    // rattachées à un service, on les masque donc quand un service est
    // demandé plutôt que de les faire apparaître à tort partout.
    const filtreService = !estFreelance && Boolean(orgUnitId);
    if (filtreService) {
      whereShift.orgUnitId = orgUnitId === 'sans-service' ? null : orgUnitId;
    }
    const shifts = await this.prisma.shift.findMany({
      where: whereShift,
      orderBy: { startAt: 'asc' },
      include: {
        freelance: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        mission: { select: { id: true, title: true } },
        orgUnit: { select: { id: true, name: true } },
      },
    });

    // Une réservation déjà matérialisée en créneau ne doit pas s'afficher deux
    // fois : on retient les bookings déjà représentés.
    const dejaAffiches = new Set(shifts.map((s) => s.bookingId).filter(Boolean) as string[]);

    // 2. Réservations : renforts et ateliers, dans les deux sens (le compte a
    //    réservé, ou c'est lui qui intervient).
    // Le filtre de date se fait EN BASE, pas en mémoire. La version précédente
    // chargeait tout l'historique des réservations du compte pour n'en garder
    // que le mois affiché : invisible la première année, insoutenable ensuite.
    // Une réservation entre dans la fenêtre par sa date de mission ou, à
    // défaut, par sa date programmée — on couvre les deux.
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        OR: [{ accountId }, { mission: { accountId } }, { service: { accountId } }],
        ...(debut || fin
          ? {
              AND: [
                {
                  OR: [
                    { mission: { startDate: range } },
                    { AND: [{ missionId: null }, { scheduledAt: range }] },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            accountId: true,
            startDate: true,
            endDate: true,
            // Les horaires portent la vraie durée quand la mission tient sur
            // une seule journée (`endDate` est alors laissée vide).
            startTime: true,
            endTime: true,
          },
        },
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
        // `endDate` est facultative : une mission de 9 h à 17 h sur une seule
        // journée ne la renseigne pas. Le planning tombait alors sur le défaut
        // de deux heures et affichait « 09:00 – 11:00 » pour une journée
        // entière — pendant que le contrat, lui, comptait bien huit heures.
        // Deux écrans qui se contredisent sur la même mission, c'est l'outil
        // qu'on cesse de croire.
        const finHoraire = finDepuisHoraire(debutEntree, b.mission?.endTime ?? null);
        const finEntree =
          b.mission?.endDate ??
          finHoraire ??
          new Date(debutEntree!.getTime() + minutes * 60_000);
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

    if (filtreService) {
      return manuels.sort(
        (a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
    }

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
    // Les plafonds sont vérifiés AVANT d'écrire : un créneau illégal ne doit
    // pas exister en base, même une seconde, sans décision explicite.
    const constats = await this.controlesReglementaires(dto.freelanceId, startAt, endAt);
    this.exigerDerogation(constats, dto.derogationMotif);
    const derogeA = constats.filter((c) => c.gravite === 'BLOQUANT');

    // Le service : celui qu'on précise, sinon celui de l'intervenant.
    const orgUnitId =
      dto.orgUnitId ?? (await this.serviceDeLIntervenant(accountId, dto.freelanceId));

    const shift = await this.prisma.shift.create({
      data: {
        accountId,
        title: dto.title,
        startAt, endAt,
        freelanceId: dto.freelanceId ?? null,
        missionId: dto.missionId ?? null,
        orgUnitId,
        bookingId: dto.bookingId ?? null,
        notes: dto.notes ?? null,
        recurrenceRule: dto.recurrenceRule ?? null,
        derogationMotif: derogeA.length ? (dto.derogationMotif ?? null) : null,
        derogationCodes: derogeA.map((c) => c.code),
        derogationLe: derogeA.length ? new Date() : null,
      },
    });
    return {
      shift,
      warnings:
        conflicts.length || constats.length
          ? {
              conflicts: conflicts.length ? conflicts : undefined,
              reglementaires: constats.length ? constats : undefined,
            }
          : undefined,
    };
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
    const constats = await this.controlesReglementaires(freelanceId, startAt, endAt, id);
    this.exigerDerogation(constats, dto.derogationMotif);
    const derogeA = constats.filter((c) => c.gravite === 'BLOQUANT');

    const shift = await this.prisma.shift.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        startAt, endAt,
        freelanceId: dto.freelanceId ?? existing.freelanceId,
        // Changer d'intervenant peut changer de service : on suit, sauf si le
        // service a été fixé explicitement — auquel cas on ne le défait pas.
        orgUnitId:
          dto.orgUnitId !== undefined
            ? dto.orgUnitId
            : dto.freelanceId && dto.freelanceId !== existing.freelanceId
              ? await this.serviceDeLIntervenant(accountId, dto.freelanceId)
              : existing.orgUnitId,
        notes: dto.notes ?? existing.notes,
        derogationMotif: derogeA.length ? (dto.derogationMotif ?? existing.derogationMotif) : null,
        derogationCodes: derogeA.map((c) => c.code),
        derogationLe: derogeA.length ? new Date() : null,
      },
    });
    return { shift, warnings: constats.length ? { reglementaires: constats } : undefined };
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
