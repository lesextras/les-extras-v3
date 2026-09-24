import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { envoyerFicheReservation } from '../bookings/fiche-reservation';
import { slugLibre } from './slug-service';
import { CommunityService } from '../community/community.service';
import { PointReason } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../common/mail/mail.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import {
  MESSAGE_HORS_PORTEE,
  reservableParCompte,
  visibleParCompte,
} from './portee-salarie';
import { BookServiceDto } from './dto/book-service.dto';
import { DEPARTEMENTS } from '../common/territoires';
import { refuserPublicationTest } from '../common/donnees-test';

/**
 * Ne garde que les codes du référentiel, sans doublon et dans un ordre stable.
 * Un formulaire peut envoyer n'importe quoi ; un code inconnu écrit en base
 * produirait une fiche invisible de tous les filtres, en silence.
 */
function codesValides(codes?: string[] | null): string[] {
  if (!codes?.length) return [];
  const connus = new Set(DEPARTEMENTS.map((d) => d.code));
  return [...new Set(codes.filter((c) => connus.has(c)))].sort();
}

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly community: CommunityService,
    private readonly mail: MailService,
  ) {}

  async create(accountId: string, dto: CreateServiceDto) {
    // L'adresse lisible se pose à la CRÉATION, pas après coup : une fiche
    // publiée à `/ateliers/cms3it0g…` puis renommée changerait d'adresse en
    // cours de route. `null` est une réponse acceptable — la fiche reste
    // alors accessible par son identifiant, comme avant.
    const slug = await slugLibre(dto.title, async (candidat) =>
      (await this.prisma.service.count({ where: { slug: candidat } })) > 0,
    );

    const fiche = await this.prisma.service.create({
      data: {
        accountId,
        slug,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        categoryId: dto.categoryId ?? undefined,
        duration: dto.duration,
        durationMinutes: dto.durationMinutes,
        // Absent, le défaut du schéma vaut COLLECTIF : c'est ce qu'étaient
        // toutes les fiches avant que le renfort personnalisé existe.
        format: dto.format ?? undefined,
        maxParticipants: dto.maxParticipants,
        publicTarget: dto.publicTarget,
        publicTargets: dto.publicTargets ?? [],
        material: dto.material,
        prerequisites: dto.prerequisites,
        objectives: dto.objectives,
        methodology: dto.methodology,
        evaluation: dto.evaluation,
        faq: (dto.faq as unknown as object) ?? undefined,
        images: dto.images ?? [],
        priceExtras: (dto.priceExtras as unknown as object) ?? undefined,
        timeSlots: dto.timeSlots ?? [],
        qualiopi: dto.qualiopi ?? false,
        price: dto.price,
        city: dto.city,
        departements: codesValides(dto.departements),
      },
    });

    // Bonus de démarrage : on compte APRÈS la création. Si le total vaut 1,
    // c'est que celle-ci était la première — la condition ne peut donc jamais
    // se déclencher deux fois, même si deux fiches partent en même temps.
    const total = await this.prisma.service.count({ where: { accountId } });
    if (total === 1) {
      await this.community
        .crediter(
          accountId,
          PointReason.PREMIERE_FICHE,
          `Première fiche créée : ${fiche.title}`,
        )
        .catch(() => undefined);
    }

    return fiche;
  }

  /** Services du compte freelance actif. */
  async findAllByAccount(accountId: string, take?: number) {
    return this.prisma.service.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, Math.trunc(Number(take) || 50))),
      include: {
        _count: { select: { bookings: true } },
        categoryRef: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Catalogue : services publiés + filtres catégorie/ville.
   *
   * `lecteurAccountId` décide de la portée : les fiches d'un salarié ne sont
   * visibles que des établissements qui l'emploient (voir `portee-salarie`).
   */
  async findCatalog(query: QueryServicesDto, lecteurAccountId?: string) {
    const where: Prisma.ServiceWhereInput = {
      status: ServiceStatus.PUBLISHED,
      AND: [visibleParCompte(lecteurAccountId)],
    };
    if (query.category) where.category = query.category;
    if (query.format) where.format = query.format;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    const recherche = query.search?.trim();
    if (recherche) {
      where.OR = [
        { title: { contains: recherche, mode: 'insensitive' } },
        { description: { contains: recherche, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.take ?? 20,
        skip: query.skip ?? 0,
        include: {
          account: { select: { id: true, name: true, city: true, logoUrl: true } },
          categoryRef: { select: { id: true, title: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);
    return { items, total, take: query.take ?? 20, skip: query.skip ?? 0 };
  }

  async findOne(id: string, accountId?: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            city: true,
            logoUrl: true,
            slug: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profile: { select: { job: true, bio: true, liens: true } },
              },
            },
          },
        },
        categoryRef: { select: { id: true, title: true } },
      },
    });
    if (!service) throw new NotFoundException('Service introuvable.');
    const estProprietaire = Boolean(accountId && service.accountId === accountId);
    if (!estProprietaire && service.status !== 'PUBLISHED') {
      throw new NotFoundException('Service introuvable.');
    }
    // Portée d'un salarié : sa fiche n'existe que pour les établissements qui
    // l'emploient. « Introuvable » et non « interdit » — l'existence même de
    // la fiche ne regarde pas les autres.
    if (!estProprietaire && !(await reservableParCompte(this.prisma, id, accountId ?? ''))) {
      throw new NotFoundException('Service introuvable.');
    }

    // Consultation comptabilisée pour les visiteurs (jamais pour le propriétaire).
    if (!estProprietaire) {
      this.prisma.service
        .update({ where: { id }, data: { views: { increment: 1 } } })
        .catch(() => undefined);
    }

    // Réputation : d'abord celle de CET atelier, sinon celle de l'intervenant.
    const ownerId = service.account?.owner?.id;
    const REVIEW_SELECT = {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      author: { select: { firstName: true, lastName: true } },
    };
    const avisPrestation = await this.prisma.review.findMany({
      where: { serviceId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: REVIEW_SELECT,
    });
    const [notesIntervenant, similaires] = await this.prisma.$transaction([
      ownerId && avisPrestation.length === 0
        ? this.prisma.review.findMany({
            where: { targetId: ownerId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: REVIEW_SELECT,
          })
        : this.prisma.review.findMany({ where: { id: '' } }),
      this.prisma.service.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: id },
          OR: [{ category: service.category }, { categoryId: service.categoryId ?? undefined }],
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        select: {
          id: true,
          title: true,
          price: true,
          city: true,
          duration: true,
          images: true,
          category: true,
        },
      }),
    ]);

    const notes = avisPrestation.length > 0 ? avisPrestation : notesIntervenant;
    const moyenne =
      notes.length > 0
        ? Math.round((notes.reduce((sum, r) => sum + r.rating, 0) / notes.length) * 10) / 10
        : null;
    const ratingSource: 'service' | 'provider' | null =
      avisPrestation.length > 0 ? 'service' : notes.length > 0 ? 'provider' : null;

    return { ...service, reviews: notes, rating: moyenne, ratingSource, related: similaires };
  }

  private async assertOwned(id: string, accountId: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    if (service.accountId !== accountId) {
      throw new ForbiddenException('Service hors de votre compte.');
    }
    return service;
  }

  async update(id: string, accountId: string, dto: UpdateServiceDto) {
    const avant = await this.assertOwned(id, accountId);
    if (dto.status === 'PUBLISHED') refuserPublicationTest(dto.title ?? avant.title);
    const { faq, priceExtras, departements, ...rest } = dto;
    // Première mise en ligne de cette fiche : elle enrichit le catalogue
    // commun, elle est créditée en points. Les republications suivantes ne
    // rapportent rien (sinon il suffirait de dépublier/republier en boucle).
    if (dto.status === 'PUBLISHED' && avant?.status !== 'PUBLISHED') {
      await this.community
        .crediter(accountId, PointReason.PUBLICATION, `Fiche publiée : ${avant?.title ?? id}`)
        .catch(() => undefined);
    }
    return this.prisma.service.update({
      where: { id },
      data: {
        ...rest,
        ...(faq !== undefined ? { faq: faq as unknown as object } : {}),
        ...(priceExtras !== undefined
          ? { priceExtras: priceExtras as unknown as object }
          : {}),
        // ⚠ LES CODES SONT FILTRÉS, PAS FAIT CONFIANCE. Le champ arrive d'un
        // formulaire ; un code inconnu enregistré tel quel ferait une fiche
        // introuvable par tous les filtres, sans que rien ne le signale.
        ...(departements !== undefined
          ? { departements: codesValides(departements) }
          : {}),
      },
    });
  }

  /**
   * ON NE SUPPRIME PAS CE QUI A DÉJÀ ÉTÉ VENDU.
   *
   * Supprimer un atelier effaçait la fiche mais laissait derrière elle le
   * devis accepté et la réservation confirmée : un engagement financier sans
   * objet, un montant de facture qui ne renvoie plus à rien, et un
   * établissement qui a payé une prestation devenue introuvable.
   *
   * Une fiche déjà réservée ou déjà devisée s'ARCHIVE : elle quitte le
   * catalogue et ne peut plus être réservée, mais tout ce qui a été engagé
   * garde son objet. La suppression pure reste possible tant que rien n'a
   * été vendu.
   */
  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    const [reservations, devis] = await Promise.all([
      this.prisma.booking.count({ where: { serviceId: id } }),
      this.prisma.quote.count({ where: { serviceId: id } }),
    ]);
    if (reservations > 0 || devis > 0) {
      await this.prisma.service.update({
        where: { id },
        data: { status: ServiceStatus.ARCHIVED },
      });
      return {
        deleted: false,
        archived: true,
        message:
          'Cette fiche a déjà donné lieu à une réservation ou à un devis : elle a été archivée plutôt que supprimée. Elle n’apparaît plus au catalogue et ne peut plus être réservée, mais les engagements en cours gardent leur objet.',
      };
    }
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Réservation d'un atelier par un ESTABLISHMENT : crée un Booking REQUESTED
   * rattaché au compte réservant, notifie le freelance propriétaire.
   */
  async book(serviceId: string, bookingAccountId: string, dto: BookServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { account: { select: { ownerId: true } } },
    });
    if (!service) throw new NotFoundException('Service introuvable.');
    if (service.status !== ServiceStatus.PUBLISHED) {
      throw new BadRequestException('Ce service n’est pas réservable.');
    }
    if (service.accountId === bookingAccountId) {
      throw new BadRequestException('Vous ne pouvez pas réserver votre propre service.');
    }

    // LE MODE DE PAIEMENT SE VÉRIFIE ICI, PAS DANS L’ÉCRAN. Une fiche qui
    // n’accepte pas la carte ne doit pas recevoir une réservation « par carte »
    // — sinon l’intervenant attend un paiement qui ne peut pas venir, et le
    // client croit avoir payé. Le virement sur facture, lui, marche toujours.
    if (dto.modePaiement === 'CARTE' && !service.paiementEnLigne) {
      throw new BadRequestException(
        'Cette fiche n’accepte pas le paiement par carte : choisissez le virement sur facture.',
      );
    }
    // On rejoue la portée à la réservation. Une règle qui ne vit que dans la
    // liste se contourne avec une URL — et c'est l'engagement, pas l'affichage,
    // qui compte ici.
    if (!(await reservableParCompte(this.prisma, serviceId, bookingAccountId))) {
      throw new ForbiddenException(MESSAGE_HORS_PORTEE);
    }

    // Paiement à la prestation : aucune monnaie interne. La réservation est
    // créée telle quelle, puis facturée au tarif de la prestation (majoré des
    // frais de gestion) une fois l'intervention confirmée. Un seul prix, une
    // seule facture — rien à recharger à l'avance.
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          accountId: bookingAccountId,
          serviceId,
          status: BookingStatus.REQUESTED,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
          participants: dto.participants ?? undefined,
          requestNote: dto.message?.trim() || undefined,
          modePaiement: dto.modePaiement ?? undefined,
          totalAmount: service.price ?? undefined,
        },
      });

      return created;
    });

    // La notification dit ce qu'il faut pour décider sans ouvrir l'écran : le
    // nombre de participants, et s'il dépasse ce que la fiche annonce. Un
    // atelier prévu pour huit et demandé pour vingt, c'est un refus ou une
    // renégociation — pas une surprise le jour même.
    const effectif = dto.participants ?? null;
    const depasse =
      effectif !== null && service.maxParticipants !== null && effectif > service.maxParticipants;
    const precision = effectif === null ? '' : ` pour ${effectif} participant${effectif > 1 ? 's' : ''}`;
    const alerte = depasse ? `, au-delà des ${service.maxParticipants} annoncés sur votre fiche` : '';

    await this.notifications.create(service.account.ownerId, {
      type: 'SERVICE_BOOKING',
      title: 'Nouvelle réservation',
      body: `Votre atelier « ${service.title} » a été réservé${precision}${alerte}. Les coordonnées du client sont dans la fiche envoyée par courriel : c’est vous qui organisez la suite avec lui.`,
      link: `/dashboard/reservations`,
    });

    // ⚠ ET UN COURRIEL, PAS SEULEMENT UNE CLOCHE (3/09/2026).
    //
    // Cette réservation n'écrivait qu'une notification dans l'application.
    // Personne n'ouvre une plateforme qu'il n'utilise pas encore tous les
    // jours : l'intervenant ne l'apprenait donc que s'il repassait par hasard.
    // L'écran de l'établissement, lui, promet « L'intervenant vous répondra
    // rapidement ».
    //
    // Le `.catch()` est indispensable : quatre comptes du catalogue portent une
    // adresse sur un domaine sans MX. Un courriel qui ne part pas ne doit jamais
    // faire échouer la réservation de quelqu'un d'autre.
    const proprietaire = await this.prisma.user
      .findUnique({ where: { id: service.account.ownerId }, select: { email: true } })
      .catch(() => null);
    const demandeur = await this.prisma.account
      .findUnique({ where: { id: bookingAccountId }, select: { name: true } })
      .catch(() => null);
    if (proprietaire?.email) {
      await this.mail
        .sendReservationRecue(proprietaire.email, {
          atelier: service.title,
          etablissement: demandeur?.name,
          quand: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          participants: effectif,
          note: dto.message?.trim() || null,
          depassement: depasse ? service.maxParticipants : null,
        })
        .catch(() => undefined);
    }

    // ⚠ LA FICHE DE RÉSERVATION, AUX DEUX PARTIES (9/09/2026).
    //
    // Jusqu'ici seul l'intervenant recevait un courriel, et il n'y trouvait ni
    // les coordonnées de celui qui réservait, ni la règle des 48 heures. Les
    // deux se retrouvaient donc engagés sans savoir comment se joindre.
    await envoyerFicheReservation(this.prisma, this.mail, booking.id);

    return booking;
  }
}
