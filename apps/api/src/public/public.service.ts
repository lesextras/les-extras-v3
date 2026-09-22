import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ComplianceStatus,
  MissionStatus,
  MissionVisibility,
  Prisma,
  ServiceCategory,
  ServiceStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../users/progression.service';
import { StructuresService } from '../structures/structures.service';
import { ConformiteService } from '../conformite/conformite.service';
import { MailService } from '../common/mail/mail.service';
import { DEPARTEMENTS, trouverDepartement } from '../common/territoires';
import { ACCENTS_SQL, PLATS_SQL, motifRecherche } from '../common/recherche-accents';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';
import { CreateContactDto } from './dto/create-contact.dto';

/**
 * Vitrine : une fiche publiée qui n'appartient PAS à un salarié.
 *
 * Un salarié anime pour la maison qui l'emploie ; sa fiche s'adresse aux
 * établissements auxquels il est rattaché, jamais au marché ouvert. Toutes les
 * requêtes publiques partent de là — accueil, détail, fiches liées, devis —
 * pour qu'aucune ne l'oublie au prochain ajout.
 */
const VITRINE = {
  status: ServiceStatus.PUBLISHED,
  // ⚠ `archivedAt: null` EST DANS LA VITRINE, PAS À CÔTÉ. Archiver un compte
  // doit retirer ses fiches de TOUTES les listes publiques d'un coup — c'est
  // toute la raison d'être de la colonne. Poser le filtre requête par requête
  // en oublierait une au prochain ajout, et une fiche d'un compte archivé qui
  // reste réservable est pire qu'un compte non archivé.
  account: { profilSalarie: false, archivedAt: null },
} satisfies Prisma.ServiceWhereInput;

/**
 * Champs exposés publiquement (aucune donnée sensible : pas d'ownerId, pas de
 * bookings, pas d'email). Le compte est réduit à sa vitrine (nom, ville, logo).
 */
const PUBLIC_SELECT = {
  id: true,
  /// Adresse lisible de la fiche. Null sur les fiches d'avant la bascule :
  /// l'appelant retombe alors sur l'identifiant, comme avant.
  slug: true,
  title: true,
  description: true,
  category: true,
  price: true,
  duration: true,
  durationMinutes: true,
  city: true,
  /// Le territoire couvert, en codes INSEE. La carte l'affiche à la place de
  /// `city` : « Toute l'Île-de-France » dit ce qu'un directeur veut savoir,
  /// « Île-de-France » écrit dans un champ « ville » ne le disait pas.
  departements: true,
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
  /// Le règlement immédiat, quand l'intervenant l'a ouvert sur cette fiche.
  /// La demande de devis reste affichée dans tous les cas : ce chemin s'ajoute
  /// aux autres, il ne les remplace pas.
  paiementEnLigne: true,
  /// Affiché AVANT le bouton de paiement, jamais après.
  annulationTexte: true,
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
          profile: { select: { job: true, bio: true, liens: true } },
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
  durationMinutes: true,
  // Les publics visés font la carte : sans eux, une fiche formation paraît
  // vide à côté d'une fiche atelier, qui affiche « Public : … ».
  publicTargets: true,
  type: true,
  certifying: true,
  cpfEligible: true,
  // Le mode « gratuite en ligne » se décide dans la carte, pas seulement dans
  // la fiche : sans ces deux champs ici, le catalogue afficherait
  // « Tarif sur devis » sur une formation gratuite, et le visiteur ne cliquerait
  // jamais. Voir le commentaire de `Formation.freeOnline` dans le schéma.
  freeOnline: true,
  enrollUrl: true,
  // Le prix de l'attestation, et donc l'existence du bouton d'achat. ⚠ Nul sur
  // toutes les fiches tant que la vente n'est pas ouverte à la main : l'écran
  // ne monte alors pas le bouton, et la route publique refuse de toute façon.
  attestationPrixCents: true,
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
    durationMinutes: f.durationMinutes,
    publicTargets: f.publicTargets,
    type: f.type,
    certifying: f.certifying,
    cpfEligible: f.cpfEligible,
    freeOnline: f.freeOnline,
    enrollUrl: f.enrollUrl,
    attestationPrixCents: f.attestationPrixCents,
    images: f.images,
    // Une mini-formation en ligne n'a PAS de lieu. Sans cette exception, la
    // ville du compte propriétaire remonte par la cascade ci-dessous et la
    // fiche affiche « Lieu : Melun » sur une formation qui se suit depuis
    // n'importe où — constaté en direct sur les trois premières fiches.
    city: f.freeOnline
      ? null
      : f.city ?? prochaine?.location ?? f.ownerAccount?.city ?? null,
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
    private readonly progression: ProgressionService,
    private readonly structures: StructuresService,
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
        source: (dto.source || 'direct').slice(0, 120),
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

  /**
   * Construit le filtre de type (atelier / formation / all).
   *
   * La vitrine est ouverte à tout le monde : aucune fiche de salarié n'y
   * paraît. Ce qu'un salarié anime, il l'anime pour la maison qui l'emploie —
   * l'exposer au marché serait faux, et lui vaudrait des demandes qu'il ne
   * peut pas honorer. Le filtre vaut aussi pour le sitemap, qui lit d'ici.
   */
  private typeWhere(type?: string): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = { ...VITRINE };
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
    if (query.priceMax != null) where.price = { lte: query.priceMax };

    // ⚠ LE FILTRE DE LIEU NE PASSE PLUS PAR `city`.
    //
    // Il s'appuyait sur `contains` insensible à la casse — mais pas aux accents
    // ni aux tirets. Mesuré en direct le 4/09/2026 sur les dix-sept fiches en
    // ligne : « Île-de-France » rendait 10 résultats, « Ile de France » 3,
    // « Créteil » ZÉRO. Deux graphies de la même région, et aucune requête ne
    // rendait les dix-sept. La liste déroulante du catalogue, construite à
    // partir des valeurs distinctes en base, proposait d'ailleurs les deux
    // graphies comme deux lieux différents.
    //
    // `departement` prend le relais : un code INSEE dans une liste fermée,
    // comparé à un tableau. Voir `common/territoires.ts`.
    const departement = query.departement
      ? trouverDepartement(query.departement)
      : undefined;
    if (departement) where.departements = { has: departement.code };
    // `city` reste accepté pour ne pas casser un lien déjà partagé ou indexé,
    // mais il n'est plus proposé nulle part dans l'interface.
    else if (query.city) where.city = { contains: query.city, mode: 'insensitive' };

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
      select: { publicTargets: true, city: true, departements: true },
    });
    const publics = Array.from(
      new Set(facettes.flatMap((f) => f.publicTargets)),
    ).sort((a, b) => a.localeCompare(b, 'fr'));
    const cities = Array.from(
      new Set(facettes.map((f) => f.city).filter((c): c is string => Boolean(c))),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    // LES TERRITOIRES AVEC LEUR COMPTE, dans l'ordre du référentiel.
    //
    // On ne propose qu'un département où quelque chose existe : un filtre qui
    // mène à une page vide est une déception qu'on aurait pu éviter. Et le
    // compte est affiché — « Seine-et-Marne (14) » dit au directeur ce qu'il
    // trouvera avant de cliquer, ce que la liste de villes ne disait jamais.
    const compteur = new Map<string, number>();
    for (const f of facettes) {
      for (const code of f.departements) {
        compteur.set(code, (compteur.get(code) ?? 0) + 1);
      }
    }
    const departements = DEPARTEMENTS.filter((d) => compteur.has(d.code)).map((d) => ({
      code: d.code,
      slug: d.slug,
      nom: d.nom,
      total: compteur.get(d.code) ?? 0,
    }));

    const notes = await this.noteParService(items.map((i) => i.id));
    const enrichis = items.map((i) => ({ ...i, ...(notes.get(i.id) ?? { rating: null, reviewsCount: 0 }) }));
    if (query.sort === 'rating') {
      enrichis.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }

    return { items: enrichis, total, take, skip, categories, publics, cities, departements };
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
   * Mises en avant de la page d'accueil : les dernières fiches publiées.
   *
   * ⚠ L'ORDRE A CHANGÉ LE 9/09/2026, ET C'EST VOULU. On classait par note, puis
   * par mise en avant, puis par consultations. Trois classements qui ont le même
   * défaut : ils figent la vitrine. Une fiche notée quatre étoiles il y a six
   * mois reste devant une fiche publiée hier, qui n'a par construction ni avis
   * ni consultations. Résultat, l'accueil montrait toujours les mêmes, et
   * publier une fiche ne se voyait nulle part.
   *
   * On classe donc par date, la plus récente d'abord. Une vitrine dit ce qui
   * est nouveau ; le mérite se juge sur la page du catalogue, qui garde ses
   * tris.
   *
   * (Faute de colonne « publiée le », c'est la date de création de la fiche qui
   * fait foi. Elle en est très proche : une fiche se publie peu après avoir été
   * écrite.)
   */
  async highlights() {
    // Le bloc « ateliers » de l'accueil prenait TOUTES les fiches publiées,
    // y compris celles rangées en `FORMATION`. Trois d'entre elles existent
    // aussi comme Formation : le visiteur voyait donc la même prestation deux
    // fois sur la même page, et des « ateliers » affichés de 50 € à 1 600 €.
    // Un catalogue qui se contredit ne se vend pas — on ne montre ici que ce
    // qui est réellement un atelier.
    const ateliers = await this.prisma.service.findMany({
      where: {
        ...VITRINE,
        category: { not: ServiceCategory.FORMATION },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
      select: PUBLIC_SELECT,
    });
    // Les notes servent l'affichage des étoiles, plus le classement : elles ne
    // réordonnent donc plus la liste.
    const notes = await this.noteParService(ateliers.map((a) => a.id));
    const ateliersNotes = ateliers.map((a) => ({
      ...a,
      ...(notes.get(a.id) ?? { rating: null, reviewsCount: 0 }),
    }));

    // ⚠ ON EN RENVOIE PLUS QUE DIX, ET C'EST VOULU. L'accueil partage ces
    // formations en DEUX rayons, les parcours gratuits de la maison d'un côté
    // et les formations Qualiopi de l'autre. Dix au total, c'était donc au
    // mieux dix cartes à se partager entre deux onglets, et souvent trois d'un
    // côté et sept de l'autre. On en renvoie trente : chaque rayon a de quoi
    // remplir ses dix, et la page coupe elle-même ce qu'elle affiche.
    const brutes = await this.prisma.formation.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ createdAt: 'desc' }],
      take: 60,
      select: FORMATION_CARD_SELECT,
    });
    const satisfactions = await this.prisma.inscription.groupBy({
      by: ['sessionId'],
      where: { satisfaction: { not: null } },
      _avg: { satisfaction: true },
    });
    void satisfactions; // agrégation par session : la note est portée par la fiche détail.
    const formations = brutes.map(carteFormation).slice(0, 30);

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
    /** Origine (utm_source / référent), pour l'attribution. */
    source?: string;
    /** Champ-piège : rempli = robot. */
    website?: string;
  }) {
    if (dto.website) return { ok: true };
    let objet = 'Demande de devis';
    if (dto.serviceId) {
      const s = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, ...VITRINE },
        select: { title: true },
      });
      if (s) objet = `Devis, ${s.title}`;
    } else if (dto.formationSlug) {
      const f = await this.prisma.formation.findFirst({
        where: { slug: dto.formationSlug, status: 'PUBLISHED' },
        select: { title: true },
      });
      if (f) objet = `Devis formation, ${f.title}`;
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
        source: (dto.source || 'direct').slice(0, 120),
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
   * LA CAPTURE D'ADRESSE SUR UNE FICHE DE PARCOURS — 4/09/2026.
   *
   * Idempotente sur (email, slug) : redemander la même fiche renvoie la fiche
   * et ne crée pas de doublon. Un opt-in déjà donné n'est jamais retiré par
   * une redemande sans la case ; il ne l'est que par le lien de désabonnement.
   *
   * ⚠ La réponse est identique que l'adresse existe ou non, et le champ-piège
   * répond 201 sans rien créer : on ne renseigne ni un robot ni un curieux.
   */
  async createCapture(dto: {
    email: string;
    slug: string;
    prenom?: string;
    consentTunnel?: boolean;
    source?: string;
    sourceMedium?: string;
    sourceCampaign?: string;
    sourceLanding?: string;
    website?: string;
  }) {
    if (dto.website) return { ok: true };

    const formation = await this.prisma.formation.findFirst({
      where: { slug: dto.slug, status: 'PUBLISHED', freeOnline: true },
      select: { title: true, slug: true, enrollUrl: true },
    });
    if (!formation) throw new NotFoundException('Parcours introuvable.');

    const email = dto.email.trim().toLowerCase();
    const prenom = dto.prenom?.trim().slice(0, 60) || undefined;
    const consent = dto.consentTunnel === true;

    const capture = await this.prisma.captureFiche.upsert({
      where: { email_slug: { email, slug: formation.slug } },
      create: {
        email,
        slug: formation.slug,
        prenom,
        consentTunnel: consent,
        source: (dto.source || 'direct').slice(0, 60),
        sourceMedium: dto.sourceMedium?.slice(0, 60),
        sourceCampaign: dto.sourceCampaign?.slice(0, 60),
        sourceLanding: dto.sourceLanding?.slice(0, 120),
      },
      update: {
        prenom: prenom ?? undefined,
        // Un consentement se donne, il ne se retire pas par omission.
        ...(consent ? { consentTunnel: true, consentAt: new Date(), desabonneAt: null } : {}),
      },
      select: { jeton: true, consentTunnel: true },
    });

    this.mail
      .sendFicheRecap(email, {
        prenom,
        titre: formation.title,
        slug: formation.slug,
        enrollUrl: formation.enrollUrl,
        consentTunnel: capture.consentTunnel,
        desabonnementUrl: `${this.mail.webUrl}/desinscription?j=${capture.jeton}`,
      })
      .catch(() => undefined);

    return { ok: true };
  }

  /** Retrait de la séquence d'accueil. Idempotent ; un jeton inconnu répond ok. */
  async desabonnerCapture(jeton: string) {
    await this.prisma.captureFiche
      .updateMany({
        where: { jeton, desabonneAt: null },
        data: { desabonneAt: new Date(), consentTunnel: false },
      })
      .catch(() => undefined);
    return { ok: true };
  }

  /**
   * L'AUDIENCE SANS TRACEUR : un compteur par jour × chemin × origine.
   *
   * Le chemin est normalisé pour tenir la cardinalité : les paramètres sont
   * déjà retirés côté web, les identifiants longs de missions et de fiches
   * restent (ils comptent chacun pour une page réelle), et tout est tronqué
   * à 200 caractères. Une erreur ici ne remonte jamais au navigateur.
   */
  async compterVue(dto: {
    chemin: string;
    source?: string;
    medium?: string;
    campagne?: string;
    visite?: boolean;
  }) {
    const chemin = dto.chemin.replace(/\/+$/, '').slice(0, 200) || '/';
    const source = (dto.source || 'direct').toLowerCase().slice(0, 60);
    const medium = (dto.medium || '').toLowerCase().slice(0, 60);
    const campagne = (dto.campagne || '').toLowerCase().slice(0, 60);
    const jour = new Date();
    jour.setUTCHours(0, 0, 0, 0);
    const visite = dto.visite ? 1 : 0;

    await this.prisma.vuePage
      .upsert({
        where: { jour_chemin_source_medium_campagne: { jour, chemin, source, medium, campagne } },
        create: { jour, chemin, source, medium, campagne, vues: 1, visites: visite },
        update: { vues: { increment: 1 }, visites: { increment: visite } },
      })
      .catch(() => undefined);
    return { ok: true };
  }

  /**
   * Détail PUBLIC d'un service PUBLISHED (404 sinon) — fiche vitrine complète :
   * contenu pédagogique, réputation de l'intervenant et fiches de la même
   * famille. Incrémente le compteur de consultations (preuve sociale).
   */
  /**
   * Le détail d'une fiche, par ADRESSE LISIBLE **ou** par identifiant.
   *
   * Les deux résolvent, et c'est délibéré : toutes les adresses déjà
   * partagées — mails, devis, messages LinkedIn, favoris — portent
   * l'identifiant. Elles doivent continuer de fonctionner sans condition ;
   * c'est la page publique qui redirige ensuite vers la forme lisible.
   */
  async detail(identifiant: string) {
    const service = await this.prisma.service.findFirst({
      where: { OR: [{ id: identifiant }, { slug: identifiant }], ...VITRINE },
      select: PUBLIC_DETAIL_SELECT,
    });
    if (!service) throw new NotFoundException('Service introuvable.');

    // À partir d'ici on travaille sur l'identifiant réel : la fiche a pu être
    // trouvée par son slug, et le compteur comme les avis se lisent par id.
    const id = service.id;

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

    // `slug` fait partie de la projection depuis le 16/09/2026 : sans lui, le
    // bloc « Dans la même famille » ne pouvait construire que /ateliers/<id>,
    // et chaque clic passait par une 301 vers l'adresse en slug. Dix liens du
    // catalogue faisaient ce détour — invisible à l'œil, payé à chaque visite.
    const RELATED_SELECT = {
      id: true,
      slug: true,
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
            ...VITRINE,
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
          ...VITRINE,
          category: service.category,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: RELATED_SELECT,
      });
    }

    // « Pièces contrôlées le … » sur la fiche : vrai seulement si CHAQUE pièce
    // obligatoire de l'intervenant est VALID — statut posé par une structure ou
    // par ADéPA, jamais par lui. On expose une date, aucun document.
    const piecesControleesLe = ownerId ? await this.piecesControleesLe(ownerId) : null;

    return { ...service, reviews, rating, ratingSource, related, piecesControleesLe };
  }

  /**
   * La date du dernier contrôle, si toutes les pièces obligatoires sont
   * valides et non expirées ; sinon null, et la fiche ne promet rien.
   */
  private async piecesControleesLe(userId: string): Promise<string | null> {
    const requis = ConformiteService.REQUIRED_TYPES;
    const valides = await this.prisma.complianceDocument.findMany({
      where: {
        userId,
        status: ComplianceStatus.VALID,
        type: { in: requis },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { type: true, updatedAt: true },
    });
    const types = new Set(valides.map((d) => d.type));
    if (valides.length === 0 || requis.some((t) => !types.has(t))) return null;
    const derniere = valides.reduce(
      (max, d) => (d.updatedAt > max ? d.updatedAt : max),
      valides[0].updatedAt,
    );
    return derniere.toISOString();
  }

  /**
   * Catalogue PUBLIC des formations publiées. Une formation se vend sur une
   * promesse (objectifs, durée, prix d'appel, prochaine session) — pas sur un
   * calendrier. On expose donc la fiche, et la session n'arrive qu'ensuite.
   */
  async formations(query: {
    search?: string;
    category?: string;
    /** Étiquette de public visé, telle qu'elle sort de la facette `publics`. */
    public?: string;
    /** Nom de l'organisme concepteur, tel qu'il sort de `organismes`. */
    organisme?: string;
    city?: string;
    cpf?: string;
    certifying?: string;
    priceMax?: number;
    sort?: string;
    take?: number;
    skip?: number;
  }) {
    // INTERNE exclu : une formation montée par un établissement pour ses
    // propres salariés n'a rien à faire sur le site public (même filtre que
    // FormationsService.findCatalog). C'était aussi la porte dérobée du
    // verrou de publication : créer en INTERNE, publier, repasser en
    // CERTIFIANTE — et se retrouver au catalogue sans relecture d'ADéPA.
    const where: Prisma.FormationWhereInput = { status: 'PUBLISHED', type: 'CERTIFIANTE' };
    if (query.category) where.categoryRef = { is: { title: query.category } };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    // « Pour qui » avant « quoi » : c'est l'entrée la plus utilisée du
    // catalogue des ateliers, et elle manquait ici.
    if (query.public) where.publicTargets = { has: query.public };
    if (query.organisme) where.ownerAccount = { is: { name: query.organisme } };
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

    // Les facettes se calculent sur le catalogue ENTIER, pas sur le résultat
    // filtré : une liste d'options qui rétrécit à mesure qu'on filtre empêche
    // de revenir en arrière sans vider la recherche.
    const publie: Prisma.FormationWhereInput = { status: 'PUBLISHED', type: 'CERTIFIANTE' };
    const [rows, catRows, villeRows, publicRows, organismeRows] = await this.prisma.$transaction([
      this.prisma.formation.findMany({
        where,
        orderBy: triEnBase,
        take: 200,
        select: FORMATION_CARD_SELECT,
      }),
      this.prisma.formation.findMany({
        where: publie,
        distinct: ['categoryId'],
        select: { categoryRef: { select: { title: true } } },
      }),
      this.prisma.formation.findMany({
        where: { ...publie, city: { not: null } },
        distinct: ['city'],
        select: { city: true },
      }),
      this.prisma.formation.findMany({ where: publie, select: { publicTargets: true } }),
      this.prisma.formation.findMany({
        where: publie,
        distinct: ['ownerAccountId'],
        select: { ownerAccount: { select: { name: true } } },
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
    const publics = Array.from(new Set(publicRows.flatMap((r) => r.publicTargets))).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    );
    const organismes = Array.from(
      new Set(organismeRows.map((r) => r.ownerAccount?.name).filter((n): n is string => Boolean(n))),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    return { items, total, take, skip, categories, cities, publics, organismes };
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
    // Seules les missions réellement OUVERTES sortent ici.
    //
    // Le palier de diffusion (SALARIES → RESERVED → PUBLIC) n'était pas
    // regardé : un établissement qui cochait « je réserve d'abord à mon
    // équipe » voyait quand même son annonce partir sur le web ouvert, et
    // dans le sitemap. La promesse faite à l'écran n'était pas tenue.
    const where = {
      status: MissionStatus.PUBLISHED,
      visibility: MissionVisibility.PUBLIC,
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
      // Même règle que la liste : une mission réservée à l'équipe ne se lit
      // pas non plus par son adresse directe, sinon la restriction ne vaut
      // rien dès que l'identifiant circule.
      where: { id, status: MissionStatus.PUBLISHED, visibility: MissionVisibility.PUBLIC },
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
  /**
   * Annuaire public des intervenants.
   *
   * Ne sont listés que les comptes qui ont AU MOINS une fiche publiée : un
   * annuaire rempli de profils vides dessert le réseau plus qu'il ne le sert.
   * Chaque entrée porte de quoi choisir : métier, ville, nombre d'ateliers et
   * de formations, note moyenne réelle.
   */
  async vendors(query: { search?: string; city?: string; take?: number; skip?: number }) {
    const take = Math.min(query.take ?? 24, 60);

    const comptes = await this.prisma.account.findMany({
      where: {
        type: 'FREELANCE',
        // Un salarié n'exerce pas pour son compte : ce qu'il anime, il l'anime
        // pour la maison qui l'emploie, et celle-ci le paie en salaire. Sa
        // fiche s'adresse aux établissements auxquels il est rattaché, jamais
        // au marché ouvert. Le catalogue appliquait déjà la règle (const
        // VITRINE) ; l'annuaire, lui, listait ces comptes comme des
        // indépendants — donc démarchables et « réservables » par n'importe
        // quel visiteur.
        profilSalarie: false,
        // Un compte archivé ne figure plus dans l'annuaire — même règle que la
        // vitrine, et pour la même raison : archiver retire de la vue, partout.
        archivedAt: null,
        services: { some: { status: 'PUBLISHED' } },
        ...(query.city ? { OR: [{ city: query.city }, { services: { some: { city: query.city } } }] } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { owner: { is: { profile: { is: { job: { contains: query.search, mode: 'insensitive' } } } } } },
                { services: { some: { title: { contains: query.search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      take,
      skip: query.skip ?? 0,
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
            avatarUrl: true,
            profile: { select: { job: true, bio: true, skills: true, city: true, liens: true } },
          },
        },
        services: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
            city: true,
            images: true,
            qualiopi: true,
          },
        },
      },
    });

    // Notes moyennes : une seule requête pour tous les propriétaires listés.
    const proprietaires = comptes.map((c) => c.owner?.id).filter((v): v is string => Boolean(v));
    const notes = proprietaires.length
      ? await this.prisma.review.groupBy({
          by: ['targetId'],
          where: { targetId: { in: proprietaires } },
          _avg: { rating: true },
          _count: { _all: true },
          orderBy: { targetId: 'asc' },
        })
      : [];
    const parCible = new Map(
      notes.map((n) => [n.targetId, { moyenne: n._avg.rating, nb: n._count._all }]),
    );

    // Même filtre que la liste : un total qui compterait les salariés
    // annoncerait une pagination vers des pages vides.
    const total = await this.prisma.account.count({
      where: {
        type: 'FREELANCE',
        profilSalarie: false,
        archivedAt: null,
        services: { some: { status: 'PUBLISHED' } },
      },
    });

    // Villes proposées au filtre : celles où il y a réellement quelqu'un.
    const villes = Array.from(
      new Set(
        comptes
          .flatMap((c) => [c.city, c.owner?.profile?.city, ...c.services.map((s) => s.city)])
          .filter((v): v is string => Boolean(v)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'fr'));

    return {
      items: comptes.map((c) => {
        const note = c.owner?.id ? parCible.get(c.owner.id) : undefined;
        const ateliers = c.services.filter((s) => s.category !== 'FORMATION');
        const formations = c.services.filter((s) => s.category === 'FORMATION');
        // Les fiches importées n'ont ni métier, ni bio, ni compétences saisis :
        // l'annuaire affichait donc quatre cartes vides. Plutôt que de laisser
        // des trous, on déduit ce qui est DÉDUCTIBLE des fiches réellement
        // publiées — rien n'est inventé, tout est vérifiable en un clic.
        // Dès qu'un intervenant renseigne son profil, sa saisie l'emporte.
        const villesDesFiches = c.services.map((s) => s.city).filter(Boolean) as string[];
        const villeDominante = villesDesFiches
          .map((v) => [v, villesDesFiches.filter((x) => x === v).length] as const)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        // « Compétences » = les thèmes que la personne propose vraiment. On
        // reprend l'intitulé des fiches, nettoyé et raccourci.
        const themes = Array.from(
          new Set(
            c.services
              .map((s) =>
                s.title
                  .replace(/^ATELIER\s+(DE\s+)?/i, '')
                  .replace(/\s*[-, , ].*$/, '')
                  .trim(),
              )
              .filter((t) => t.length > 2 && t.length <= 42),
          ),
        ).slice(0, 6);

        const metierSaisi = c.owner?.profile?.job ?? null;
        const bioSaisie = c.owner?.profile?.bio ?? null;
        const competencesSaisies = c.owner?.profile?.skills ?? [];

        // Le prénom suffit : l'import a collé « — Intervenant » en guise de nom
        // de famille, ce qui donnait « Christophe — Intervenant » sur la carte.
        const nomAffiche =
          [c.owner?.firstName, c.owner?.lastName]
            .filter(Boolean)
            .join(' ')
            .replace(/\s*[ : -]\s*Intervenant\s*$/i, '')
            .trim() || c.name;

        return {
          id: c.id,
          nom: nomAffiche,
          metier:
            metierSaisi ??
            (formations.length && ateliers.length
              ? 'Intervenant et formateur'
              : formations.length
                ? 'Formateur'
                : ateliers.length
                  ? 'Intervenant'
                  : null),
          bio:
            bioSaisie ??
            (themes.length
              ? `Intervient auprès des établissements médico-sociaux sur ${themes
                  .slice(0, 3)
                  .map((t) => t.toLowerCase())
                  .join(', ')}.`
              : null),
          competences: competencesSaisies.length ? competencesSaisies : themes,
          ville: c.city ?? c.owner?.profile?.city ?? villeDominante ?? null,
          logoUrl: c.logoUrl ?? c.owner?.avatarUrl ?? null,
          depuis: c.createdAt,
          rating: note?.moyenne ?? null,
          reviewsCount: note?.nb ?? 0,
          nbAteliers: ateliers.length,
          nbFormations: formations.length,
          qualiopi: c.services.some((s) => s.qualiopi),
          // Les trois premières fiches, pour donner à voir le travail réel.
          apercu: c.services.slice(0, 3).map((s) => ({
            id: s.id,
            title: s.title,
            price: s.price,
            image: s.images?.[0] ?? null,
            formation: s.category === 'FORMATION',
          })),
        };
      }),
      total,
      villes,
    };
  }

  /**
   * Fiche publique d'un intervenant.
   *
   * Le filtre vitrine s'applique DEUX FOIS, et il faut les deux : au compte
   * (la fiche d'un salarié ne se lit pas depuis l'extérieur, même par son
   * adresse directe) et à ses interventions (VITRINE, la même constante que
   * le catalogue). Une règle qui ne vivrait que dans la liste se contourne
   * avec une URL — c'est exactement ce qui se passait ici.
   */
  async vendorDetail(accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, type: 'FREELANCE', profilSalarie: false, archivedAt: null },
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
            profile: { select: { job: true, bio: true, skills: true, city: true, liens: true } },
          },
        },
      },
    });
    if (!account) throw new NotFoundException('Intervenant introuvable.');

    const [services, reviews] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where: { accountId, ...VITRINE },
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

    // Même logique que l'annuaire : on complète ce qui manque à partir des
    // fiches publiées plutôt que d'afficher des champs vides. Ce que la
    // personne a saisi elle-même prime toujours.
    const themes = Array.from(
      new Set(
        services
          .map((s) =>
            s.title
              .replace(/^ATELIER\s+(DE\s+)?/i, '')
              .replace(/\s*[-, , ].*$/, '')
              .trim(),
          )
          .filter((t) => t.length > 2 && t.length <= 42),
      ),
    ).slice(0, 8);
    const nbFormations = services.filter((s) => s.category === 'FORMATION').length;
    const villes = services.map((s) => s.city).filter(Boolean) as string[];

    const owner = account.owner
      ? {
          ...account.owner,
          // « Christophe — Intervenant » : « — Intervenant » est un reliquat
          // d'import collé dans le champ nom de famille, pas un vrai patronyme.
          lastName: (account.owner.lastName ?? '').replace(/^\s*[ : -]\s*Intervenant\s*$/i, ''),
          profile: {
            ...(account.owner.profile ?? { job: null, bio: null, skills: [], city: null }),
            job:
              account.owner.profile?.job ??
              (nbFormations && services.length > nbFormations
                ? 'Intervenant et formateur'
                : nbFormations
                  ? 'Formateur'
                  : services.length
                    ? 'Intervenant'
                    : null),
            bio:
              account.owner.profile?.bio ??
              (themes.length
                ? `Intervient auprès des établissements médico-sociaux sur ${themes
                    .slice(0, 3)
                    .map((t) => t.toLowerCase())
                    .join(', ')}.`
                : null),
            skills: account.owner.profile?.skills?.length
              ? account.owner.profile.skills
              : themes,
            city: account.owner.profile?.city ?? villes[0] ?? null,
          },
        }
      : account.owner;

    // Palier du programme de progression (Nouveau / Confirme / Super Extra),
    // calcule sur les missions reellement effectuees — jamais declaratif.
    const palier = await this.progression.palier(account.id);

    return {
      ...account,
      city: account.city ?? villes[0] ?? null,
      owner,
      services,
      reviews,
      rating,
      palier,
    };
  }

  /**
   * LES STRUCTURES : celles de la plateforme d'abord, l'annuaire public ensuite.
   *
   * L'annuaire est interrogé en second et son échec est SILENCIEUX : il est
   * lent, limité en débit, et parfois indisponible. Une structure saisie à la
   * main reste parfaitement valable — beaucoup de petites associations n'y
   * figurent pas, et les exclure reviendrait à les mettre dehors.
   */
  async rechercherStructures(q: string) {
    const texte = (q ?? '').trim();
    if (texte.length < 3) return { declarees: [], annuaire: [] };
    const [declarees, annuaire] = await Promise.all([
      this.structures.rechercherDeclarees(texte).catch(() => []),
      this.structures.rechercherEntite(texte).catch(() => []),
    ]);
    return { declarees, annuaire };
  }

  /**
   * LES ÉTABLISSEMENTS DÉJÀ DÉCLARÉS, pour le parcours d'inscription.
   *
   * ⚠ ORGANISATIONS SEULEMENT. Nom, ville, structure de rattachement : rien
   * qui désigne une personne, aucun effectif, aucune adresse de contact.
   * Ajouter un seul de ces champs changerait la nature de la route — d'un
   * annuaire d'organisations à un fichier de prospection.
   */
  async rechercherEtablissements(q: string) {
    const texte = (q ?? '').trim();
    if (texte.length < 2) return [];

    /*
      ⚠⚠ LA RECHERCHE IGNORE LES ACCENTS, ET CE N'EST PAS UN CONFORT.

      Mesuré en production le 21/09/2026 : taper « adepa » sur cet écran rendait
      ZÉRO résultat, alors que trois établissements ADéPA y sont déclarés. La
      cause est le `contains` de Prisma, qui devient un ILIKE : PostgreSQL rend
      ILIKE insensible à la CASSE, jamais aux ACCENTS. « ADéPA » ne contient
      donc pas « adepa ».

      Ce n'est pas un détail d'ergonomie : c'est l'écran dont le seul métier est
      d'empêcher le doublon d'établissement — le plus coûteux des trois, celui
      qui coupe une équipe en deux. Une collègue qui tape son établissement sans
      accent (ce que fait un clavier de téléphone) ne trouve rien, conclut qu'il
      n'existe pas, et en crée un second. Le défaut touche tout ce qui s'écrit
      avec un accent en français : Hôpital, Créteil, Sainte-Geneviève, Résidence.

      ⚠ POURQUOI PAS UNE COLONNE `nomNormalise`, comme `Structure` en a une.
      Parce que `Structure.nom` s'écrit à UN endroit (`trouverOuCreer`), alors
      que `Account.name` s'écrit dans au moins six services différents
      (inscription, administration, espace association, académie,
      administration d'établissement…). Une colonne dénormalisée qu'on oublie
      de remplir dans un seul de ces six endroits redonne exactement le défaut
      qu'on répare, en silence et sans test qui l'attrape.

      ⚠ POURQUOI `translate` ET PAS `unaccent`. `unaccent()` demande une
      extension PostgreSQL, que le déploiement (un `prisma db push` au
      démarrage) ne pose pas — la requête tomberait en production et pas en
      test. `translate` est du SQL standard, présent partout, et il est
      IMMUTABLE : le jour où le volume l'exigera, il peut porter un index
      d'expression sans rien changer ici.

      La table de correspondance et l'échappement des jokers vivent dans
      `common/recherche-accents.ts`, avec leurs tests.
    */
    const ACCENTS = ACCENTS_SQL;
    const PLATS = PLATS_SQL;
    const motif = motifRecherche(texte);

    const lignes = await this.prisma.$queryRaw<
      { id: string; name: string; city: string | null; structureId: string | null }[]
    >`
      SELECT a."id", a."name", a."city", a."structureId"
      FROM "Account" a
      WHERE a."type" = 'ESTABLISHMENT'
        -- ⚠ LES COMPTES ARCHIVÉS NE SE PROPOSENT PLUS. Vingt et un comptes de
        -- test d'audit (« MECS Audit Test 2 », « [VERIF] MECS Finale », trois
        -- portant le mot « démo ») s'affichaient ici, c'est-à-dire sur l'écran
        -- même qui sert à éviter les doublons d'établissement.
        AND a."archivedAt" IS NULL
        AND (
          translate(lower(a."name"), ${ACCENTS}, ${PLATS}) LIKE ${motif}
          OR translate(lower(coalesce(a."legalName", '')), ${ACCENTS}, ${PLATS}) LIKE ${motif}
        )
      ORDER BY a."name" ASC
      LIMIT 10
    `;

    // La structure de rattachement est lue à part : une jointure de plus dans
    // la requête brute obligerait à reconstruire l'objet imbriqué à la main, et
    // c'est exactement le genre de recopie qui diverge du `select` Prisma au
    // premier champ ajouté.
    const structureIds = [...new Set(lignes.map((l) => l.structureId).filter(Boolean))] as string[];
    const structures = structureIds.length
      ? await this.prisma.structure.findMany({
          where: { id: { in: structureIds } },
          select: { id: true, nom: true },
        })
      : [];
    const parId = new Map(structures.map((s) => [s.id, s]));

    return lignes.map((l) => ({
      id: l.id,
      name: l.name,
      city: l.city,
      structure: l.structureId ? (parId.get(l.structureId) ?? null) : null,
    }));
  }
}
