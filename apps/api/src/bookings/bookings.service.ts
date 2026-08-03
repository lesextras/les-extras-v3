import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Booking, BookingStatus, Prisma, PointReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../common/mail/mail.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { AuditService } from '../common/audit/audit.service';
import { CommunityService } from '../community/community.service';
import { CreateTimeEntryDto } from './dto/time-entry.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { Constat, evaluerCreneau, PLAFONDS } from '../planning/conformite-horaire';

/** Transitions autorisées du cycle de vie d'un booking. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.REQUESTED]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
  [BookingStatus.ACCEPTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly community: CommunityService,
  ) {}

  /**
   * Liste les bookings visibles par le compte actif : ceux qu'il a créés
   * (accountId) ET ceux qui portent sur ses missions/services (offreur).
   */
  async findAllByAccount(accountId: string, query: QueryBookingsDto) {
    const where: Prisma.BookingWhereInput = {
      OR: [
        { accountId },
        { mission: { accountId } },
        { service: { accountId } },
      ],
    };
    if (query.status) where.status = query.status;

    // Borne dure : cette liste alimente des écrans, jamais un export. Sans
    // elle, le tableau de bord chargeait tout l'historique du compte pour en
    // afficher cinq lignes.
    const take = Math.min(200, Math.max(1, Math.trunc(Number(query.take) || 50)));

    return this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        mission: { select: { id: true, title: true, accountId: true, startDate: true } },
        service: { select: { id: true, title: true, accountId: true } },
        account: { select: { id: true, name: true, type: true } },
      },
    });
  }

  /** Détail d'un booking, contrôle que le compte y participe. */
  async findOne(id: string, accountId: string) {
    const booking = await this.loadForAccount(id, accountId);
    return booking;
  }

  /**
   * Contrat de mission : accessible aux DEUX parties (freelance + établissement).
   * Renvoie le détail complet (mission, établissement, freelance) + signatures.
   */
  async getContract(id: string, accountId: string) {
    await this.loadForAccount(id, accountId); // contrôle d'accès (participant)
    const PARTIE_ETABLISSEMENT = {
      select: { id: true, name: true, legalName: true, siret: true, city: true, address: true },
    };
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        mission: {
          select: {
            id: true, title: true, description: true, job: true, startDate: true, endDate: true,
            startTime: true, endTime: true, city: true, postalCode: true, hourlyRate: true, headcount: true,
            account: PARTIE_ETABLISSEMENT,
          },
        },
        // Un atelier réservé donne lieu au même contrat qu'une mission : c'est
        // le produit d'appel, il ne peut pas être le seul à ne pas être
        // contractualisable.
        service: {
          select: {
            id: true, title: true, description: true, duration: true, durationMinutes: true,
            maxParticipants: true, city: true, price: true,
            account: PARTIE_ETABLISSEMENT,
          },
        },
        account: {
          select: {
            id: true, name: true,
            owner: { select: { firstName: true, lastName: true, email: true, phone: true, profile: { select: { job: true, siret: true, city: true } } } },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Contrat introuvable.');
    if (booking.mission) return booking;
    if (!booking.service) throw new NotFoundException('Contrat introuvable.');

    // Vue unifiée : le document contractuel parle de « prestation », que
    // l'origine soit une mission de renfort ou un atelier du catalogue.
    const s = booking.service;
    const debut = booking.scheduledAt ?? new Date();
    return {
      ...booking,
      kind: 'service' as const,
      mission: {
        id: s.id,
        title: s.title,
        description: s.description,
        job: null,
        startDate: debut,
        endDate: null,
        startTime: null,
        endTime: null,
        city: s.city,
        postalCode: null,
        hourlyRate: s.price,
        headcount: s.maxParticipants ?? 1,
        account: s.account,
      },
    };
  }

  /**
   * Signature du contrat par la partie appelante (freelance OU établissement),
   * déterminée par le compte actif. Idempotent.
   */
  async signContract(id: string, accountId: string) {
    const booking = await this.loadForAccount(id, accountId);
    const offerAccountId = booking.mission?.accountId ?? booking.service?.accountId ?? null;
    const data: Prisma.BookingUpdateInput = {};
    if (accountId === booking.accountId) {
      data.signedFreelanceAt = new Date();
    } else if (accountId === offerAccountId) {
      data.signedEstablishmentAt = new Date();
    } else {
      throw new ForbiddenException('Signature non autorisée pour ce compte.');
    }
    return this.prisma.booking.update({
      where: { id },
      data,
      select: { id: true, signedFreelanceAt: true, signedEstablishmentAt: true },
    });
  }

  /** Premiere mission terminee d'un filleul : points au parrain et au filleul. */
  private async recompenserParrainage(freelanceAccountId: string) {
    const compte = await this.prisma.account.findUnique({
      where: { id: freelanceAccountId },
      select: { parrainAccountId: true, name: true },
    });
    if (!compte?.parrainAccountId) return;
    const terminees = await this.prisma.booking.count({
      where: { accountId: freelanceAccountId, status: BookingStatus.COMPLETED },
    });
    if (terminees !== 1) return; // seulement la toute premiere
    await this.community.crediter(
      compte.parrainAccountId,
      PointReason.PARRAINAGE,
      `Votre filleul ${compte.name} a terminé sa première mission`,
    );
    await this.community.crediter(
      freelanceAccountId,
      PointReason.PARRAINAGE,
      'Première mission terminée — bonus de parrainage',
    );
  }

  private async loadForAccount(id: string, accountId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        mission: { select: { id: true, title: true, accountId: true, account: { select: { ownerId: true } } } },
        service: { select: { id: true, title: true, accountId: true, account: { select: { ownerId: true } } } },
        account: { select: { id: true, name: true, ownerId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking introuvable.');

    const offerAccountId = booking.mission?.accountId ?? booking.service?.accountId ?? null;
    const isParticipant = booking.accountId === accountId || offerAccountId === accountId;
    if (!isParticipant) {
      throw new ForbiddenException('Ce booking ne concerne pas votre compte.');
    }
    return booking;
  }

  private async transition(
    id: string,
    accountId: string,
    next: BookingStatus,
    extra: Prisma.BookingUpdateInput = {},
  ): Promise<Booking> {
    const booking = await this.loadForAccount(id, accountId);
    const allowed = TRANSITIONS[booking.status];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transition invalide : ${booking.status} -> ${next}.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: next, ...extra },
    });

    // Notifie l'autre partie du changement d'état.
    const ownerIds = new Set<string>();
    if (booking.account?.ownerId) ownerIds.add(booking.account.ownerId);
    const offerOwner = booking.mission?.account?.ownerId ?? booking.service?.account?.ownerId;
    if (offerOwner) ownerIds.add(offerOwner);
    const label = booking.mission?.title ?? booking.service?.title ?? 'Réservation';
    for (const userId of ownerIds) {
      await this.notifications.create(userId, {
        type: 'BOOKING_STATUS',
        title: 'Réservation mise à jour',
        body: `« ${label} » est désormais ${next}.`,
        link: `/dashboard/reservations#${id}`,
      });
    }

    // Email de confirmation à l'établissement réservant (n'échoue jamais la requête).
    if (next === BookingStatus.CONFIRMED && booking.account?.ownerId) {
      try {
        const owner = await this.prisma.user.findUnique({
          where: { id: booking.account.ownerId },
          select: { email: true },
        });
        if (owner?.email) {
          await this.mail.sendBookingConfirmation(owner.email, {
            title: label,
            date: updated.scheduledAt,
          });
        }
      } catch (e) {
        this.logger.warn(
          `Email de confirmation de réservation non envoyé (${id}): ${(e as Error).message}`,
        );
      }
    }

    return updated;
  }

  accept(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.ACCEPTED);
  }

  confirm(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.CONFIRMED);
  }

  start(id: string, accountId: string) {
    return this.transition(id, accountId, BookingStatus.IN_PROGRESS);
  }

  async complete(id: string, accountId: string) {
    // La date de fin ouvre la fenetre d'ajustement du pointage (72 h).
    const booking = await this.transition(id, accountId, BookingStatus.COMPLETED, {
      completedAt: new Date(),
    });
    // Parrainage : quand un filleul termine sa TOUTE premiere mission, le
    // parrain et lui recoivent leurs points. Jamais bloquant.
    void this.recompenserParrainage(booking.accountId).catch(() => undefined);
    return booking;
  }

  cancel(id: string, accountId: string, dto: CancelBookingDto) {
    return this.transition(id, accountId, BookingStatus.CANCELLED, {
      cancelReason: dto.reason,
    });
  }

  // ── Pointage : temps travaillé (freelance déclare, établissement valide) ─────

  /** Minutes d'un créneau (0 si non terminé). */
  private durationMinutes(startedAt: Date, endedAt: Date | null): number {
    if (!endedAt) return 0;
    return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
  }

  /**
   * Fenetre d'ajustement : apres la fin de mission, chaque partie dispose de
   * 72 h pour declarer ou corriger les heures. Passe ce delai, les creneaux
   * en attente sont valides tels quels et tout est verrouille.
   */
  private static readonly FENETRE_AJUSTEMENT_MS = 72 * 3_600_000;

  private limiteAjustement(booking: { completedAt: Date | null }): Date | null {
    if (!booking.completedAt) return null; // mission pas encore terminee : pas de compte a rebours
    return new Date(booking.completedAt.getTime() + BookingsService.FENETRE_AJUSTEMENT_MS);
  }

  private ajustementOuvert(booking: { completedAt: Date | null }): boolean {
    const limite = this.limiteAjustement(booking);
    return limite === null || Date.now() < limite.getTime();
  }

  /** A l'echeance des 72 h, les creneaux non contestes sont valides d'office. */
  private async validerCreneauxEchus(bookingId: string, booking: { completedAt: Date | null }) {
    if (this.ajustementOuvert(booking)) return;
    const echus = await this.prisma.timeEntry.updateMany({
      where: { bookingId, status: 'PENDING' },
      data: { status: 'VALIDATED' },
    });
    if (echus.count > 0) {
      await this.audit.log({
        action: 'temps.valide.echeance',
        entityType: 'Booking',
        entityId: bookingId,
        summary: `${echus.count} creneau(x) valide(s) automatiquement a la fin de la fenetre d'ajustement de 72 h.`,
        metadata: { bookingId, count: echus.count },
      });
    }
  }

  /** Liste des créneaux d'un booking + totaux, pour les deux parties. */
  async listTimeEntries(bookingId: string, accountId: string) {
    const booking = await this.loadForAccount(bookingId, accountId);
    await this.validerCreneauxEchus(bookingId, booking);
    const offerAccountId = booking.mission?.accountId ?? booking.service?.accountId ?? null;
    const side =
      accountId === booking.accountId
        ? 'freelance'
        : accountId === offerAccountId
          ? 'establishment'
          : 'none';
    const entries = await this.prisma.timeEntry.findMany({
      where: { bookingId },
      orderBy: { startedAt: 'asc' },
    });
    let validatedMinutes = 0;
    let pendingMinutes = 0;
    for (const e of entries) {
      const mins = this.durationMinutes(e.startedAt, e.endedAt);
      if (e.status === 'VALIDATED') validatedMinutes += mins;
      else if (e.status === 'PENDING') pendingMinutes += mins;
    }
    const limite = this.limiteAjustement(booking);
    return {
      entries,
      side,
      validatedMinutes,
      pendingMinutes,
      // Garde-fous temps de travail sur les heures REELLEMENT pointees, tous
      // employeurs confondus : memes regles que le planning previsionnel
      // (module conformite-horaire), donc une seule verite dans le produit.
      alertes: await this.alertesTempsDeTravail(booking.accountId, entries),
      ajustement: {
        limite: limite ? limite.toISOString() : null,
        ouverte: this.ajustementOuvert(booking),
      },
    };
  }

  /**
   * Garde-fous sur les heures REELLEMENT pointees, tous employeurs confondus.
   *
   * Le pointage ne verifiait que deux regles (amplitude 12 h, repos 11 h) et
   * les calculait a part, avec son propre code. Il partage desormais le module
   * `conformite-horaire` du planning : memes plafonds, memes messages, meme
   * lecture du droit. Deux moteurs de regles auraient fini par se contredire,
   * et c'est le genre de contradiction qu'un controleur remarque.
   *
   * Ce que ca ajoute au pointage : le plafond de 48 h sur une semaine isolee,
   * la moyenne de 44 h sur 12 semaines consecutives, le repos hebdomadaire de
   * 35 h. Le plafond legal porte sur le travail EFFECTIF : c'est ici qu'il se
   * constate, pas dans le previsionnel.
   *
   * La fenetre couvre 12 semaines de part et d'autre, faute de quoi la moyenne
   * glissante est sous-estimee. Le filtre porte sur le compte de l'intervenant
   * et non sur l'etablissement : les plafonds se cumulent (art. L. 8261-1).
   *
   * Ces alertes restent informatives : un pointage constate un fait passe, le
   * bloquer n'y changerait rien. Le blocage a sa place a l'affectation.
   */
  private async alertesTempsDeTravail(
    freelanceAccountId: string,
    entries: { id: string; startedAt: Date; endedAt: Date | null }[],
  ): Promise<Record<string, string[]>> {
    const resultat: Record<string, string[]> = {};
    const clos = entries.filter((e) => e.endedAt);
    if (clos.length === 0) return resultat;

    const marge = PLAFONDS.fenetreSemaines * 7 * 86_400_000;
    const min = new Date(Math.min(...clos.map((e) => e.startedAt.getTime())) - marge);
    const max = new Date(Math.max(...clos.map((e) => e.endedAt!.getTime())) + marge);

    const voisins = await this.prisma.timeEntry.findMany({
      where: {
        booking: { accountId: freelanceAccountId },
        status: { not: 'REJECTED' },
        startedAt: { gte: min, lte: max },
      },
      orderBy: { startedAt: 'asc' },
      select: { id: true, startedAt: true, endedAt: true },
    });

    const creneaux = voisins
      .filter((v) => v.endedAt)
      .map((v) => ({ id: v.id, startAt: v.startedAt, endAt: v.endedAt! }));

    for (const e of clos) {
      // On evalue chaque pointage en le retirant du contexte, sinon il serait
      // compte deux fois et chaque creneau se signalerait lui-meme.
      const contexte = creneaux.filter((c) => c.id !== e.id);
      const constats: Constat[] = evaluerCreneau(contexte, {
        startAt: e.startedAt,
        endAt: e.endedAt!,
      });
      if (constats.length) {
        resultat[e.id] = constats.map((c) => c.message);
      }
    }
    return resultat;
  }

  /** Le freelance (titulaire du booking) déclare un créneau travaillé. */
  async addTimeEntry(bookingId: string, accountId: string, dto: CreateTimeEntryDto) {
    const booking = await this.loadForAccount(bookingId, accountId);
    if (accountId !== booking.accountId) {
      throw new ForbiddenException("Seul l'intervenant peut déclarer son temps de travail.");
    }
    if (!this.ajustementOuvert(booking)) {
      throw new BadRequestException(
        "La fenêtre d'ajustement de 72 h après la mission est terminée : le pointage est verrouillé.",
      );
    }
    const started = new Date(dto.startedAt);
    const ended = dto.endedAt ? new Date(dto.endedAt) : null;
    if (ended && ended.getTime() < started.getTime()) {
      throw new BadRequestException('La fin doit être postérieure au début.');
    }
    return this.prisma.timeEntry.create({
      data: { bookingId, startedAt: started, endedAt: ended, note: dto.note },
    });
  }

  /** L'établissement valide ou refuse un créneau. */
  async reviewTimeEntry(
    entryId: string,
    accountId: string,
    status: 'VALIDATED' | 'REJECTED',
    actorId?: string,
  ) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Créneau introuvable.');
    const booking = await this.loadForAccount(entry.bookingId, accountId);
    const offerAccountId = booking.mission?.accountId ?? booking.service?.accountId ?? null;
    if (accountId !== offerAccountId) {
      throw new ForbiddenException("Seul l'établissement peut valider le temps de travail.");
    }
    if (!this.ajustementOuvert(booking)) {
      throw new BadRequestException(
        "La fenêtre d'ajustement de 72 h après la mission est terminée : les créneaux restants ont été validés automatiquement.",
      );
    }
    const updated = await this.prisma.timeEntry.update({ where: { id: entryId }, data: { status } });
    const heures =
      updated.startedAt && updated.endedAt
        ? (new Date(updated.endedAt).getTime() - new Date(updated.startedAt).getTime()) / 3_600_000
        : null;
    await this.audit.log({
      actorId,
      action: status === 'VALIDATED' ? 'temps.valide' : 'temps.refuse',
      entityType: 'TimeEntry',
      entityId: entryId,
      accountId,
      summary:
        status === 'VALIDATED'
          ? `Créneau validé${heures != null ? ` (${heures.toFixed(2)} h)` : ''} sur la réservation ${entry.bookingId}.`
          : `Créneau refusé sur la réservation ${entry.bookingId}.`,
      metadata: { bookingId: entry.bookingId, heures },
    });
    return updated;
  }

  /**
   * Export CSV des heures validees du compte (les deux cotes) : une ligne par
   * creneau valide, colonnes lisibles par un tableur francais (separateur ;).
   * Base de la paie ou de la facturation interne de l'etablissement.
   */
  async exportHeuresValidees(accountId: string): Promise<string> {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        status: 'VALIDATED',
        booking: {
          OR: [
            { accountId },
            { mission: { accountId } },
            { service: { accountId } },
          ],
        },
      },
      orderBy: { startedAt: 'asc' },
      include: {
        booking: {
          select: {
            id: true,
            account: { select: { name: true } },
            mission: { select: { title: true } },
            service: { select: { title: true } },
          },
        },
      },
    });
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const lignes = [
      ['Intervenant', 'Prestation', 'Debut', 'Fin', 'Duree (h)', 'Reservation'].join(';'),
    ];
    for (const e of entries) {
      if (!e.endedAt) continue;
      const heures = (e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000;
      lignes.push(
        [
          esc(e.booking.account?.name ?? ''),
          esc(e.booking.mission?.title ?? e.booking.service?.title ?? ''),
          e.startedAt.toISOString(),
          e.endedAt.toISOString(),
          heures.toFixed(2).replace('.', ','),
          e.booking.id,
        ].join(';'),
      );
    }
    // BOM pour qu'Excel ouvre le fichier en UTF-8 sans manipulation.
    return '\ufeff' + lignes.join('\r\n');
  }

  /** Le freelance supprime un de ses créneaux tant qu'il n'est pas validé. */
  async removeTimeEntry(entryId: string, accountId: string) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Créneau introuvable.');
    const booking = await this.loadForAccount(entry.bookingId, accountId);
    if (accountId !== booking.accountId) {
      throw new ForbiddenException("Seul l'intervenant peut supprimer son créneau.");
    }
    if (entry.status === 'VALIDATED') {
      throw new BadRequestException('Un créneau validé ne peut plus être supprimé.');
    }
    if (!this.ajustementOuvert(booking)) {
      throw new BadRequestException(
        "La fenêtre d'ajustement de 72 h après la mission est terminée : le pointage est verrouillé.",
      );
    }
    await this.prisma.timeEntry.delete({ where: { id: entryId } });
    return { deleted: true };
  }
}
