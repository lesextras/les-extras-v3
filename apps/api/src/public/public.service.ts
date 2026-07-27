import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MissionStatus,
  Prisma,
  ServiceCategory,
  ServiceStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';
import { CreateContactDto } from './dto/create-contact.dto';

/**
 * Champs exposés publiquement (aucune donnée sensible : pas d'ownerId, pas de
 * bookings, pas d'email). Le compte est réduit à sa vitrine (nom, ville, logo).
 */
const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  price: true,
  duration: true,
  durationMinutes: true,
  city: true,
  maxParticipants: true,
  publicTarget: true,
  publicTargets: true,
  images: true,
  qualiopi: true,
  verified: true,
  featured: true,
  createdAt: true,
  categoryRef: { select: { id: true, title: true } },
  account: { select: { id: true, name: true, city: true, logoUrl: true } },
} satisfies Prisma.ServiceSelect;

/**
 * Fiche publique complète : tout ce que la fiche connectée affiche, moins les
 * actions. Objectif SEO — la page vitrine doit valoir la page interne, sinon
 * Google n'indexe qu'une coquille et l'acheteur n'a aucune raison de cliquer.
 */
const PUBLIC_DETAIL_SELECT = {
  ...PUBLIC_SELECT,
  material: true,
  prerequisites: true,
  objectives: true,
  methodology: true,
  evaluation: true,
  faq: true,
  priceExtras: true,
  timeSlots: true,
  views: true,
  requestsCount: true,
  updatedAt: true,
  account: {
    select: {
      id: true,
      name: true,
      city: true,
      logoUrl: true,
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profile: { select: { job: true, bio: true } },
        },
      },
    },
  },
} satisfies Prisma.ServiceSelect;

/** Champs d'une carte formation (liste et fiche partagent la même base). */
const FORMATION_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  objectives: true,
  durationHours: true,
  type: true,
  certifying: true,
  cpfEligible: true,
  images: true,
  city: true,
  requestsCount: true,
  categoryRef: { select: { id: true, title: true } },
  ownerAccount: { select: { id: true, name: true, city: true, logoUrl: true } },
  sessions: {
    where: { startDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    take: 1,
    select: { startDate: true, priceHt: true, location: true },
  },
} satisfies Prisma.FormationSelect;

type CarteFormationSource = Prisma.FormationGetPayload<{
  select: typeof FORMATION_CARD_SELECT;
}>;

/** Prix d'appel et prochaine date : ce que l'acheteur regarde en premier. */
function carteFormation(f: CarteFormationSource) {
  const prochaine = f.sessions[0] ?? null;
  return {
    id: f.id,
    slug: f.slug,
    title: f.title,
    summary: f.summary,
    objectives: f.objectives,
    durationHours: f.durationHours,
    type: f.type,
    certifying: f.certifying,
    cpfEligible: f.cpfEligible,
    images: f.images,
    city: f.city ?? prochaine?.location ?? f.ownerAccount?.city ?? null,
    requestsCount: f.requestsCount,
    categoryRef: f.categoryRef,
    account: f.ownerAccount,
    priceFrom: prochaine?.priceHt ?? null,
    nextSessionAt: prochaine?.startDate ?? null,
  };
}

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Enregistre une demande de contact publique et notifie l'équipe par e-mail. */
  async createContact(dto: CreateContactDto) {
    if (dto.website) return { ok: true };
    const request = await this.prisma.contactRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        type: dto.type,
        content: dto.content,
      },
    });
    // Notification best-effort : ne bloque pas la réponse à l'utilisateur.
    this.mail
      .sendContactNotification({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        type: dto.type,
        content: dto.content,
      })
      .catch(() => undefined);
    return { ok: true, id: request.id };
  }

  /** Construit le filtre de type (atelier / formation / all). */
  private typeWhere(type?: string): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = { status: ServiceStatus.PUBLISHED };
    if (type === 'formation') {
      where.category = ServiceCategory.FORMATION;
    } else if (type === 'atelier') {
      where.category = { not: ServiceCategory.FORMATION };
    }
    return where;
  }

  /** Catalogue public paginé + facettes de catégories éditables. */
  async catalog(query: QueryPublicCatalogDto) {
    const where = this.typeWhere(query.type);

    if (query.category) {
      where.categoryRef = { is: { title: query.category } };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.public) where.publicTargets = { has: query.public };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.priceMax != null) where.price = { lte: query.priceMax };

    const take = query.take ?? 24;
    const skip = query.skip ?? 0;
    const tri: Prisma.ServiceOrderByWithRelationInput[] =
      query.sort === 'price-asc'
        ? [{ price: 'asc' }]
        : query.sort === 'price-desc'
          ? [{ price: 'desc' }]
          : query.sort === 'rating'
            ? [{ featured: 'desc' }, { views: 'desc' }]
            : [{ createdAt: 'desc' }];

    const [items, total, catRows] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        orderBy: tri,
        take,
        skip,
        select: PUBLIC_SELECT,
      }),
      this.prisma.service.count({ where }),
      // Catégories disponibles pour ce type (indépendant de search/category)
      // afin d'alimenter un filtre stable.
      this.prisma.service.findMany({
        where: this.typeWhere(query.type),
        distinct: ['categoryId'],
        select: { categoryRef: { select: { title: true } } },
      }),
    ]);

    const categories = Array.from(
      new Set(
        catRows
          .map((r) => r.categoryRef?.title)
          .filter((t): t is string => Boolean(t)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    // Facettes : on ne propose que des filtres qui donnent des résultats.
    const facettes = await this.prisma.service.findMany({
      where: this.typeWhere(query.type),
      select: { publicTargets: true, city: true },
    });
    const publics = Array.from(
      new Set(facettes.flatMap((f) => f.publicTargets)),
    ).sort((a, b) => a.localeCompare(b, 'fr'));
    const cities = Array.from(
      new Set(facettes.map((f) => f.city).filter((c): c is string => Boolean(c))),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    const notes = await this.noteParService(items.map((i) => i.id));
    const enrichis = items.map((i) => ({ ...i, ...(notes.get(i.id) ?? { rating: null, reviewsCount: 0 }) }));
    if (query.sort === 'rating') {
      enrichis.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }

    return { items: enrichis, total, take, skip, categories, publics, cities };
  }

  /** Note moyenne et nombre d'avis, par fiche, en une seule requête. */
  private async noteParService(ids: string[]) {
    const carte = new Map<string, { rating: number | null; reviewsCount: number }>();
    if (ids.length === 0) return carte;
    const lignes = await this.prisma.review.groupBy({
      by: ['serviceId'],
      where: { serviceId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const l of lignes) {
      if (!l.serviceId) continue;
      carte.set(l.serviceId, {
        rating: l._avg.rating != null ? Math.round(l._avg.rating * 10) / 10 : null,
        reviewsCount: l._count._all,
      });
    }
    return carte;
  }

  /**
   * Mises en avant de la page d'accueil : les dix ateliers et les dix formations
   * les mieux notés. À défaut d'avis — cas d'un catalogue jeune — on classe par
   * mise en avant puis par consultations, jamais au hasard.
   */
  async highlights() {
    const ateliers = await this.prisma.service.findMany({
      where: { status: ServiceStatus.PUBLISHED },
      orderBy: [{ featured: 'desc' }, { views: 'desc' }, { createdAt: 'desc' }],
      take: 30,
      select: PUBLIC_SELECT,
    });
    const notes = await this.noteParService(ateliers.map((a) => a.id));
    const ateliersNotes = ateliers
      .map((a) => ({ ...a, ...(notes.get(a.id) ?? { rating: null, reviewsCount: 0 }) }))
      .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
      .slice(0, 10);

    const brutes = await this.prisma.formation.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
      take: 30,
      select: FORMATION_CARD_SELECT,
    });
    const satisfactions = await this.prisma.inscription.groupBy({
      by: ['sessionId'],
      where: { satisfaction: { not: null } },
      _avg: { satisfaction: true },
    });
    void satisfactions; // agrégation par session : la note est portée par la fiche détail.
    const formations = brutes.map(carteFormation).slice(0, 10);

    return { ateliers: ateliersNotes, formations };
  }

  /**
   * Demande de devis SANS COMPTE. On enregistre une demande de contact
   * structurée et on prévient l'équipe : le prospect n'a rien à créer pour
   * entrer en relation.
   */
  async createQuoteRequest(dto: {
    serviceId?: string;
    formationSlug?: string;
    name: string;
    email: string;
    phone?: string;
    organization?: string;
    role?: string;
    city?: string;
    desiredDate?: string;
    participants?: string;
    message: string;
    /** Champ-piège : rempli = robot. */
    website?: string;
  }) {
    if (dto.website) return { ok: true };
    let objet = 'Demande de devis';
    if (dto.serviceId) {
      const s = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, status: ServiceStatus.PUBLISHED },
        select: { title: true },
      });
      if (s) objet = `Devis — ${s.title}`;
    } else if (dto.formationSlug) {
      const f = await this.prisma.formation.findFirst({
        where: { slug: dto.formationSlug, status: 'PUBLISHED' },
        select: { title: true },
      });
      if (f) objet = `Devis formation — ${f.title}`;
    }

    const corps = [
      dto.organization ? `Structure : ${dto.organization}` : null,
      dto.role ? `Fonction : ${dto.role}` : null,
      dto.city ? `Ville : ${dto.city}` : null,
      dto.desiredDate ? `Période souhaitée : ${dto.desiredDate}` : null,
      dto.participants ? `Participants : ${dto.participants}` : null,
      '',
      dto.message,
    ]
      .filter((l) => l !== null)
      .join('\n');

    const demande = await this.prisma.contactRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        type: objet,
        content: corps,
      },
    });

    if (dto.serviceId) {
      await this.prisma.service
        .update({ where: { id: dto.serviceId }, data: { requestsCount: { increment: 1 } } })
        .catch(() => undefined);
    }

    this.mail
      .sendContactNotification({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        type: objet,
        content: corps,
      })
      .catch(() => undefined);

    return { ok: true, id: demande.id };
  }

  /**
   * Détail PUBLIC d'un service PUBLISHED (404 sinon) — fiche vitrine complète :
   * contenu pédagogique, réputation de l'intervenant et fiches de la même
   * famille. Incrémente le compteur de consultations (preuve sociale).
   */
  async detail(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, status: ServiceStatus.PUBLISHED },
      select: PUBLIC_DETAIL_SELECT,
    });
    if (!service) throw new NotFoundException('Service introuvable.');

    // Best-effort : une erreur de compteur ne doit jamais casser la page.
    this.prisma.service
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    const REVIEW_SELECT = {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      author: { select: { firstName: true, lastName: true } },
    } satisfies Prisma.ReviewSelect;
    const moyenne = (notes: { rating: number }[]) =>
      notes.length > 0
        ? Math.round(
            (notes.reduce((sum, r) => sum + r.rating, 0) / notes.length) * 10,
          ) / 10
        : null;

    // Priorité à la note de CETTE prestation. Tant qu'elle n'a pas d'avis, on
    // affiche celle de l'intervenant, explicitement étiquetée comme telle.
    const avisPrestation = await this.prisma.review.findMany({
      where: { serviceId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: REVIEW_SELECT,
    });
    const ownerId = service.account?.owner?.id ?? null;
    const avisIntervenant =
      avisPrestation.length === 0 && ownerId
        ? await this.prisma.review.findMany({
            where: { targetId: ownerId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: REVIEW_SELECT,
          })
        : [];

    const reviews = avisPrestation.length > 0 ? avisPrestation : avisIntervenant;
    const rating = moyenne(reviews);
    /** 'service' = note de l'atelier, 'provider' = note de l'intervenant. */
    const ratingSource: 'service' | 'provider' | null =
      avisPrestation.length > 0 ? 'service' : reviews.length > 0 ? 'provider' : null;

    const RELATED_SELECT = {
      id: true,
      title: true,
      price: true,
      city: true,
      duration: true,
      images: true,
    } satisfies Prisma.ServiceSelect;

    // D'abord la meme categorie editable ; si elle ne contient qu'une fiche, on
    // elargit a la famille (ATELIER, FORMATION...) pour ne jamais afficher un
    // bloc vide — le maillage interne compte autant pour le SEO que pour l'achat.
    let related = service.categoryRef?.id
      ? await this.prisma.service.findMany({
          where: {
            id: { not: id },
            status: ServiceStatus.PUBLISHED,
            categoryId: service.categoryRef.id,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: RELATED_SELECT,
        })
      : [];
    if (related.length === 0) {
      related = await this.prisma.service.findMany({
        where: {
          id: { not: id },
          status: ServiceStatus.PUBLISHED,
          category: service.category,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: RELATED_SELECT,
      });
    }

    return { ...service, reviews, rating, ratingSource, related };
  }

  /**
   * Catalogue PUBLIC des formations publiées. Une formation se vend sur une
   * promesse (objectifs, durée, prix d'appel, prochaine session) — pas sur un
   * calendrier. On expose donc la fiche, et la session n'arrive qu'ensuite.
   */
  async formations(query: {
    search?: string;
    category?: string;
    city?: string;
    cpf?: string;
    certifying?: string;
    priceMax?: number;
    sort?: string;
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.FormationWhereInput = { status: 'PUBLISHED' };
    if (query.category) where.categoryRef = { is: { title: query.category } };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.cpf === 'true') where.cpfEligible = true;
    if (query.certifying === 'true') where.certifying = true;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
        { objectives: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const take = Math.min(query.take ?? 24, 60);
    const skip = query.skip ?? 0;

    // Le prix et la prochaine date viennent des sessions : le tri sur ces deux
    // critères se fait donc après projection, sur un catalogue volontairement
    // borné à 60 fiches.
    const triEnBase: Prisma.FormationOrderByWithRelationInput =
      query.sort === 'duration-asc' ? { durationHours: 'asc' } : { createdAt: 'desc' };

    const [rows, catRows, villeRows] = await this.prisma.$transaction([
      this.prisma.formation.findMany({
        where,
        orderBy: triEnBase,
        take: 200,
        select: FORMATION_CARD_SELECT,
      }),
      this.prisma.formation.findMany({
        where: { status: 'PUBLISHED' },
        distinct: ['categoryId'],
        select: { categoryRef: { select: { title: true } } },
      }),
      this.prisma.formation.findMany({
        where: { status: 'PUBLISHED', city: { not: null } },
        distinct: ['city'],
        select: { city: true },
      }),
    ]);

    let cartes = rows.map(carteFormation);
    if (query.priceMax != null) {
      cartes = cartes.filter((c) => c.priceFrom != null && Number(c.priceFrom) <= query.priceMax!);
    }
    const prix = (c: (typeof cartes)[number]) =>
      c.priceFrom == null ? Number.POSITIVE_INFINITY : Number(c.priceFrom);
    if (query.sort === 'price-asc') cartes.sort((a, b) => prix(a) - prix(b));
    else if (query.sort === 'price-desc')
      cartes.sort((a, b) => (prix(b) === Infinity ? -1 : prix(b)) - (prix(a) === Infinity ? -1 : prix(a)));
    else if (query.sort === 'soonest')
      cartes.sort((a, b) => {
        const da = a.nextSessionAt ? new Date(a.nextSessionAt).getTime() : Number.POSITIVE_INFINITY;
        const db = b.nextSessionAt ? new Date(b.nextSessionAt).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });

    const total = cartes.length;
    const items = cartes.slice(skip, skip + take);

    const categories = Array.from(
      new Set(catRows.map((r) => r.categoryRef?.title).filter((t): t is string => Boolean(t))),
    ).sort((a, b) => a.localeCompare(b, 'fr'));
    const cities = Array.from(
      new Set(villeRows.map((r) => r.city).filter((c): c is string => Boolean(c))),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    return { items, total, take, skip, categories, cities };
  }


  /** Fiche PUBLIQUE d'une formation publiée, par slug (404 sinon). */
  async formationDetail(slug: string) {
    const formation = await this.prisma.formation.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: {
        ...FORMATION_CARD_SELECT,
        program: true,
        prerequisites: true,
        targetAudience: true,
        methodology: true,
        evaluation: true,
        faq: true,
        certificationName: true,
        views: true,
        createdAt: true,
        sessions: {
          where: { startDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
          take: 6,
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            maxSeats: true,
            priceHt: true,
            status: true,
            _count: { select: { inscriptions: true } },
          },
        },
      },
    });
    if (!formation) throw new NotFoundException('Formation introuvable.');

    this.prisma.formation
      .update({ where: { id: formation.id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    // Satisfaction stagiaires (Qualiopi, indicateur 30) : la preuve sociale.
    const agg = await this.prisma.inscription.aggregate({
      where: { session: { formationId: formation.id }, satisfaction: { not: null } },
      _avg: { satisfaction: true },
      _count: { satisfaction: true },
    });

    const autres = await this.prisma.formation.findMany({
      where: { id: { not: formation.id }, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: FORMATION_CARD_SELECT,
    });

    return {
      ...carteFormation(formation),
      program: formation.program,
      prerequisites: formation.prerequisites,
      targetAudience: formation.targetAudience,
      methodology: formation.methodology,
      evaluation: formation.evaluation,
      faq: formation.faq,
      certificationName: formation.certificationName,
      views: formation.views,
      createdAt: formation.createdAt,
      sessions: formation.sessions,
      rating:
        agg._count.satisfaction > 0 && agg._avg.satisfaction != null
          ? Math.round(agg._avg.satisfaction * 10) / 10
          : null,
      ratingCount: agg._count.satisfaction,
      related: autres.map(carteFormation),
    };
  }

  /**
   * Détail PUBLIC d'une mission de renfort PUBLIÉE (vitrine partageable).
   * Aucune donnée sensible : ni ownerId, ni candidatures.
   */
  /**
   * Liste PUBLIQUE des missions de renfort ouvertes.
   * Sert le sitemap et le maillage interne : une annonce « remplacement
   * éducateur à Melun » est exactement ce que cherchent les intervenants.
   * On exclut les missions déjà passées pour ne pas indexer d'URL périmée.
   */
  async missions(query: { take?: number; skip?: number }) {
    const take = Math.min(query.take ?? 50, 100);
    const skip = query.skip ?? 0;
    const where = {
      status: MissionStatus.PUBLISHED,
      OR: [{ endDate: { gte: new Date() } }, { endDate: null }],
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reliefMission.findMany({
        where,
        orderBy: { startDate: 'asc' },
        take,
        skip,
        select: {
          id: true,
          title: true,
          city: true,
          job: true,
          startDate: true,
          endDate: true,
          emergency: true,
          updatedAt: true,
          categoryRef: { select: { title: true } },
        },
      }),
      this.prisma.reliefMission.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async missionDetail(id: string) {
    const mission = await this.prisma.reliefMission.findFirst({
      where: { id, status: MissionStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        job: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        city: true,
        postalCode: true,
        hourlyRate: true,
        headcount: true,
        emergency: true,
        attachmentUrl: true,
        status: true,
        categoryRef: { select: { id: true, title: true } },
        account: { select: { id: true, name: true, city: true, logoUrl: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    return mission;
  }
  /**
   * Fiche publique d'un intervenant : identité, présentation, réputation et
   * toutes ses interventions publiées. Équivalent des pages « host » du site
   * actuel — c'est la preuve sociale du catalogue.
   */
  async vendorDetail(accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, type: 'FREELANCE' },
      select: {
        id: true,
        name: true,
        city: true,
        logoUrl: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { job: true, bio: true, skills: true, city: true } },
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Intervenant introuvable.');

    const [services, reviews] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where: { accountId, status: 'PUBLISHED' },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          price: true,
          city: true,
          duration: true,
          durationMinutes: true,
          maxParticipants: true,
          images: true,
          featured: true,
          verified: true,
        },
      }),
      account.owner?.id
        ? this.prisma.review.findMany({
            where: { targetId: account.owner.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              author: { select: { firstName: true, lastName: true } },
            },
          })
        : this.prisma.review.findMany({ where: { id: '' } }),
    ]);

    const rating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    return { ...account, services, reviews, rating };
  }

}
