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
import { numeroSuivant, prefixeAnnee } from '../invoices/numerotation';
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
    // kind=service : uniquement les reservations d'ateliers ; kind=mission :
    // uniquement les renforts. C'est ce qu'attendait « Mes ateliers ».
    if (query.kind === 'service') where.serviceId = { not: null };
    if (query.kind === 'mission') where.missionId = { not: null };

    // Borne dure : cette liste alimente des écrans, jamais un export. Sans
    // elle, le tableau de bord chargeait tout l'historique du compte pour en
    // afficher cinq lignes.
    const take = Math.min(200, Math.max(1, Math.trunc(Number(query.take) || 50)));

    return this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        // Le nom des DEUX parties : sans celui du proprietaire de la mission
        // ou de l'atelier, l'ecran affichait le nom du lecteur comme
        // « contrepartie » — on se voyait soi-meme en face.
        mission: {
          select: {
            id: true,
            title: true,
            accountId: true,
            startDate: true,
            account: { select: { id: true, name: true } },
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            accountId: true,
            account: { select: { id: true, name: true } },
          },
        },
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
    // L'établissement figure au document par sa personne morale : raison
    // sociale, SIRET, adresse. C'est ce que le bloc « Établissement » attend.
    const PARTIE_ETABLISSEMENT = {
      select: { id: true, name: true, legalName: true, siret: true, city: true, address: true },
    };
    // L'intervenant, lui, y figure comme personne physique : c'est le
    // propriétaire du compte qui serait embauché ou qui anime l'atelier.
    const PERSONNE = {
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profile: { select: { job: true, siret: true, city: true } },
      },
    };
    const PARTIE_INTERVENANT = { select: { id: true, name: true, owner: PERSONNE } };
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
        // contractualisable. Mais la fiche appartient à l'INTERVENANT : son
        // compte se lit comme une personne, pas comme un établissement.
        service: {
          select: {
            id: true, title: true, description: true, duration: true, durationMinutes: true,
            maxParticipants: true, city: true, price: true,
            account: PARTIE_INTERVENANT,
          },
        },
        // Le compte à l'origine de la réservation change de rôle selon le flux
        // (intervenant qui candidate à un renfort / établissement qui réserve
        // un atelier) : on charge donc ce qu'il faut pour l'un ET pour l'autre,
        // et c'est la nature de la réservation qui décide de sa place au
        // document, plus bas.
        account: {
          select: {
            id: true, name: true, legalName: true, siret: true, city: true, address: true,
            owner: PERSONNE,
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Contrat introuvable.');
    if (booking.mission) return booking;
    if (!booking.service) throw new NotFoundException('Contrat introuvable.');

    // Vue unifiée : le document contractuel parle de « prestation », que
    // l'origine soit une mission de renfort ou un atelier du catalogue.
    //
    // LES DEUX PARTIES ÉTAIENT INTERVERTIES ICI. La pseudo-mission reprenait
    // `account: s.account`, c'est-à-dire le compte PROPRIÉTAIRE DE LA FICHE.
    // Sur un atelier, ce compte est l'intervenant : il se retrouvait au bloc
    // « Établissement », et le directeur qui avait réservé au bloc « Personne
    // proposée » — chacun signant à la place de l'autre.
    //
    // Le rôle ne se lit pas sur `booking.accountId`, qui désigne seulement le
    // DEMANDEUR, et le demandeur change de camp d'un flux à l'autre : sur un
    // renfort c'est l'intervenant qui candidate, sur un atelier c'est
    // l'établissement qui réserve. Il se lit sur la NATURE de la réservation.
    // Atelier : la fiche est à l'intervenant, la demande vient de
    // l'établissement — donc `booking.account` est l'établissement et
    // `service.account` est l'intervenant.
    const s = booking.service;
    const debut = booking.scheduledAt ?? new Date();
    return {
      ...booking,
      kind: 'service' as const,
      // Bloc « Personne proposée » : le titulaire de la fiche atelier.
      account: { id: s.account.id, name: s.account.name, owner: s.account.owner },
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
        // Bloc « Établissement » : le compte qui a réservé l'atelier.
        account: {
          id: booking.account.id,
          name: booking.account.name,
          legalName: booking.account.legalName,
          siret: booking.account.siret,
          city: booking.account.city,
          address: booking.account.address,
        },
      },
    };
  }

  /**
   * Signature du contrat par la partie appelante (freelance OU établissement),
   * déterminée par le compte actif. Idempotent.
   */
  async signContract(id: string, accountId: string) {
    const booking = await this.loadForAccount(id, accountId);
    // LA SIGNATURE ATTERRISSAIT DU MAUVAIS CÔTÉ SUR LES ATELIERS. Le code
    // assimilait `booking.accountId` au freelance et l'offreur à
    // l'établissement : vrai sur un renfort, faux sur un atelier, où le
    // demandeur EST l'établissement. L'accord du directeur se rangeait donc
    // dans `signedFreelanceAt`, et celui de l'intervenant dans
    // `signedEstablishmentAt`. Les deux champs disent un RÔLE, pas un rang
    // dans la réservation : on les remplit donc d'après le rôle réel du
    // signataire, déduit de la nature de la réservation.
    const { etablissementId, intervenantId } = BookingsService.partiesDe(booking);
    const data: Prisma.BookingUpdateInput = {};
    if (accountId === intervenantId) {
      data.signedFreelanceAt = new Date();
    } else if (accountId === etablissementId) {
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

    const offerAccountId = BookingsService.offreurDe(booking);
    const isParticipant = booking.accountId === accountId || offerAccountId === accountId;
    if (!isParticipant) {
      throw new ForbiddenException('Ce booking ne concerne pas votre compte.');
    }
    return booking;
  }

  /**
   * Le compte qui PROPOSE la prestation. Les deux flux sont inversés, et c'est
   * normal : sur un renfort, la mission appartient à l'établissement et c'est
   * l'intervenant qui candidate ; sur un atelier, la fiche appartient à
   * l'intervenant et c'est l'établissement qui réserve. Dans les deux cas,
   * `booking.accountId` est le DEMANDEUR et cette valeur est le SOLLICITÉ.
   */
  private static offreurDe(booking: {
    mission?: { accountId: string } | null;
    service?: { accountId: string } | null;
  }): string | null {
    return booking.mission?.accountId ?? booking.service?.accountId ?? null;
  }

  /**
   * QUI EST L'ÉTABLISSEMENT, QUI EST L'INTERVENANT — d'après la NATURE de la
   * réservation.
   *
   * `offreurDe` répond à « qui a été sollicité » ; ce n'est pas la même
   * question que « qui est l'employeur ». Confondre les deux marchait par
   * accident sur les renforts et se trompait systématiquement sur les
   * ateliers, car les deux flux sont inversés :
   *
   *  - RENFORT : la mission appartient à l'établissement, l'intervenant
   *    candidate. `booking.accountId` = intervenant, offreur = établissement.
   *  - ATELIER : la fiche appartient à l'intervenant, l'établissement
   *    réserve. `booking.accountId` = établissement, offreur = intervenant.
   *
   * Un booking orphelin (mission ou atelier supprimé, `onDelete: SetNull`)
   * n'a plus de contrepartie identifiable : on ne devine pas de rôle pour lui,
   * et `getContract` le déclare déjà introuvable.
   */
  private static partiesDe(booking: {
    accountId: string;
    mission?: { accountId: string } | null;
    service?: { accountId: string } | null;
  }): { etablissementId: string | null; intervenantId: string | null } {
    if (booking.mission) {
      return {
        etablissementId: booking.mission.accountId,
        intervenantId: booking.accountId,
      };
    }
    if (booking.service) {
      return {
        etablissementId: booking.accountId,
        intervenantId: booking.service.accountId,
      };
    }
    return { etablissementId: null, intervenantId: null };
  }

  /**
   * Faire avancer une réservation revient à celui qui a été sollicité, jamais
   * à celui qui sollicite.
   *
   * Sans ce contrôle, `loadForAccount` se contentait de vérifier que l'appelant
   * est PARTIE au contrat — pas de quel côté il se trouve. Un établissement
   * pouvait donc mener seul sa propre demande d'atelier jusqu'à « terminée »,
   * et déclencher le brouillon de facture émis au nom d'un intervenant qui
   * n'avait jamais dit oui. Symétriquement, un intervenant pouvait faire
   * aboutir seul sa candidature à un renfort. Les écrans ne proposent ces
   * gestes qu'au bon côté (`BookingActions` n'est monté que sur les écrans de
   * l'offreur) : le trou n'était visible qu'en appelant l'API directement, ce
   * qui est précisément le cas contre lequel un garde-fou existe.
   *
   * L'annulation, elle, reste ouverte aux deux : retirer sa candidature ou
   * renoncer à une demande est un droit du demandeur.
   */
  private assertOffreur(
    booking: {
      mission?: { accountId: string } | null;
      service?: { accountId: string } | null;
    },
    accountId: string,
  ): void {
    if (BookingsService.offreurDe(booking) === accountId) return;
    throw new ForbiddenException(
      booking.service
        ? "Seul l'intervenant qui propose cet atelier peut faire avancer la réservation. En tant que demandeur, vous pouvez l'annuler."
        : "Seul l'établissement qui a publié cette mission peut faire avancer la réservation. En tant que candidat, vous pouvez retirer votre candidature.",
    );
  }

  private async transition(
    id: string,
    accountId: string,
    next: BookingStatus,
    extra: Prisma.BookingUpdateInput = {},
    /** `offreur` : réservé au sollicité. `les-deux` : ouvert aux deux parties. */
    cote: 'offreur' | 'les-deux' = 'offreur',
  ): Promise<Booking> {
    const booking = await this.loadForAccount(id, accountId);
    if (cote === 'offreur') this.assertOffreur(booking, accountId);
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

    // Aide a la contractualisation, version atelier : quand une intervention
    // facturable se termine, un BROUILLON de facture est prepare pour
    // l'intervenant — de lui vers l'etablissement, sans commission de la
    // plateforme. L'ecran Devis & factures promettait cette automatisation
    // depuis toujours ; aucun code ne la faisait. Jamais bloquant.
    void this.preparerFactureAtelier(id).catch(() => undefined);
    return booking;
  }

  /**
   * Brouillon de facture pour un atelier termine (idempotent, jamais bloquant).
   *
   * Deux details qui ne sont pas des details :
   *
   *  1. LE PAYEUR. Sans `payerAccountId`, la facture sortait avec un bloc
   *     « Facture a » vide — non conforme a l'article 242 nonies A du CGI —
   *     et l'etablissement ne la voyait jamais dans son espace : la liste des
   *     factures qui lui sont adressees se lit sur ce champ, et le bouton de
   *     reglement en depend. On le renseigne comme le fait `InvoicesService`.
   *
   *  2. LE NUMERO, PAR EMETTEUR. Le meme article impose une sequence continue
   *     PROPRE A CHAQUE EMETTEUR. Ce brouillon tirait son numero de la plus
   *     grande valeur toutes structures confondues : les factures de personnes
   *     morales distinctes se retrouvaient melangees dans une suite unique, et
   *     chaque emetteur avait une sequence trouee. On se scope sur le compte
   *     emetteur, exactement comme `InvoicesService.nextNumber`.
   */
  private async preparerFactureAtelier(bookingId: string) {
    const b = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        accountId: true,
        totalAmount: true,
        service: { select: { accountId: true, title: true } },
      },
    });
    // Seuls les ateliers avec un montant connu se facturent ; les renforts
    // relevent du CDD conclu par l'etablissement, pas d'une facture.
    if (!b?.service || b.totalAmount === null) return;
    const existante = await this.prisma.invoice.findUnique({ where: { bookingId } });
    if (existante) return;

    const emetteur = b.service.accountId;
    // Atelier : la reservation est celle de l'etablissement, c'est donc lui
    // qui paie. Si les deux comptes coincident (une structure qui reserve sa
    // propre fiche), il n'y a pas de tiers payeur a designer.
    const payerAccountId = b.accountId !== emetteur ? b.accountId : undefined;

    const annee = new Date().getFullYear();
    const derniere = await this.prisma.invoice.findFirst({
      where: { accountId: emetteur, number: { startsWith: prefixeAnnee(annee) } },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    await this.prisma.invoice.create({
      data: {
        accountId: emetteur,
        bookingId,
        payerAccountId,
        number: numeroSuivant(annee, derniere?.number ?? null),
        amount: b.totalAmount,
        status: 'DRAFT',
      },
    });
  }

  /** Annulation : ouverte aux DEUX parties, jusqu'au bout. */
  cancel(id: string, accountId: string, dto: CancelBookingDto) {
    return this.transition(
      id,
      accountId,
      BookingStatus.CANCELLED,
      { cancelReason: dto.reason },
      'les-deux',
    );
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
    // LE CÔTÉ ÉTAIT INVERSÉ SUR LES ATELIERS. `side` dit un RÔLE (« celui qui
    // déclare ses heures » / « celui qui les valide »), et le rôle ne se lit
    // pas sur `booking.accountId` : sur un renfort le demandeur est
    // l'intervenant qui candidate, sur un atelier c'est l'établissement qui
    // réserve. L'écran de pointage (`TimeSheet`) montre le formulaire de
    // déclaration au côté `freelance` et les boutons Valider/Refuser au côté
    // `establishment` : mal orienté, il faisait déclarer les heures au
    // directeur et les valider à l'intervenant.
    const { etablissementId, intervenantId } = BookingsService.partiesDe(booking);
    const side =
      accountId === intervenantId
        ? 'freelance'
        : accountId === etablissementId
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
      // Ces plafonds sont ceux d'une PERSONNE QUI TRAVAILLE : on les calcule
      // pour l'intervenant, jamais pour l'etablissement (`booking.accountId`
      // n'est l'intervenant que sur un renfort).
      alertes: await this.alertesTempsDeTravail(intervenantId, entries),
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
   * Et « le compte de l'intervenant » ne se lit pas sur `booking.accountId` :
   * ce compte est l'intervenant sur un RENFORT (il candidate), mais
   * l'etablissement sur un ATELIER (il reserve la fiche de l'intervenant).
   * Filtrer sur ce seul champ cumulait les heures de tous les intervenants
   * venus animer chez un meme etablissement — et ignorait, pour un
   * intervenant, ses propres ateliers. On selectionne donc les deux flux :
   * renfort ou l'intervenant est le demandeur, atelier dont il est le
   * proprietaire de la fiche.
   *
   * Ces alertes restent informatives : un pointage constate un fait passe, le
   * bloquer n'y changerait rien. Le blocage a sa place a l'affectation.
   */
  private async alertesTempsDeTravail(
    intervenantAccountId: string | null,
    entries: { id: string; startedAt: Date; endedAt: Date | null }[],
  ): Promise<Record<string, string[]>> {
    const resultat: Record<string, string[]> = {};
    // Reservation orpheline (mission ou atelier supprime) : plus d'intervenant
    // identifiable, donc aucun cumul a constater sur un compte precis.
    if (!intervenantAccountId) return resultat;
    const clos = entries.filter((e) => e.endedAt);
    if (clos.length === 0) return resultat;

    const marge = PLAFONDS.fenetreSemaines * 7 * 86_400_000;
    const min = new Date(Math.min(...clos.map((e) => e.startedAt.getTime())) - marge);
    const max = new Date(Math.max(...clos.map((e) => e.endedAt!.getTime())) + marge);

    const voisins = await this.prisma.timeEntry.findMany({
      where: {
        booking: {
          OR: [
            // Renfort : l'intervenant est le compte qui a candidate.
            { missionId: { not: null }, accountId: intervenantAccountId },
            // Atelier : l'intervenant est le proprietaire de la fiche.
            { service: { accountId: intervenantAccountId } },
          ],
        },
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

  /** L'intervenant — celui qui a travaillé — déclare un créneau. */
  async addTimeEntry(bookingId: string, accountId: string, dto: CreateTimeEntryDto) {
    const booking = await this.loadForAccount(bookingId, accountId);
    // Déclarer ses heures revient à celui qui les a faites. « Titulaire du
    // booking » n'est pas un synonyme d'intervenant : sur un renfort oui, le
    // demandeur est l'intervenant qui candidate ; sur un atelier le demandeur
    // est l'établissement, et l'intervenant est le propriétaire de la fiche.
    // Le contrôle se fait donc sur le rôle réel, pas sur `booking.accountId`.
    const { intervenantId } = BookingsService.partiesDe(booking);
    if (accountId !== intervenantId) {
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
    // Valider les heures revient à celui pour qui elles ont été faites, donc à
    // l'établissement. `offreurDe` répond à « qui a été sollicité » : c'est
    // l'établissement sur un renfort, mais l'INTERVENANT sur un atelier — d'où
    // l'inversion, où l'intervenant validait les heures que l'établissement
    // avait déclarées à sa place. Le rôle se lit sur la nature de la
    // réservation.
    const { etablissementId } = BookingsService.partiesDe(booking);
    if (accountId !== etablissementId) {
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
            // Sur un atelier, l'intervenant n'est pas le compte de la
            // reservation (c'est l'etablissement qui reserve) mais le
            // proprietaire de la fiche : il faut son nom pour la colonne.
            service: { select: { title: true, account: { select: { name: true } } } },
          },
        },
      },
    });
    // Colonne « Intervenant » : la personne qui a travaille, pas le compte a
    // l'origine de la reservation. Renfort : c'est le candidat retenu, donc
    // `booking.account`. Atelier : c'est le titulaire de la fiche, donc
    // `service.account` — sinon l'export sortait le nom de l'etablissement
    // sous un intitule « Intervenant », et une paie ou une facturation faite
    // sur cette base attribuait les heures a la mauvaise personne.
    const nomIntervenant = (b: {
      account: { name: string } | null;
      mission: { title: string } | null;
      service: { account: { name: string } | null } | null;
    }) => (b.mission ? (b.account?.name ?? '') : (b.service?.account?.name ?? ''));
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const lignes = [
      ['Intervenant', 'Prestation', 'Debut', 'Fin', 'Duree (h)', 'Reservation'].join(';'),
    ];
    for (const e of entries) {
      if (!e.endedAt) continue;
      const heures = (e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000;
      lignes.push(
        [
          esc(nomIntervenant(e.booking)),
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

  /** L'intervenant supprime un de ses créneaux tant qu'il n'est pas validé. */
  async removeTimeEntry(entryId: string, accountId: string) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Créneau introuvable.');
    const booking = await this.loadForAccount(entry.bookingId, accountId);
    // Pendant de `addTimeEntry` : on ne retire que ses propres heures. Même
    // inversion que partout ailleurs si l'on s'en remet à `booking.accountId`,
    // qui désigne l'établissement sur un atelier.
    const { intervenantId } = BookingsService.partiesDe(booking);
    if (accountId !== intervenantId) {
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
