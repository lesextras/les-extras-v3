import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  BookingStatus,
  CibleDiffusion,
  MissionStatus,
  MissionVisibility,
  ModeAttribution,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityService } from '../community/community.service';
import { PointReason } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchingService } from '../matching/matching.service';
import { ProgressionService } from '../users/progression.service';
import { geocoderCodePostal, distanceKm } from './geo';
import { MailService } from '../common/mail/mail.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';
import { CiblageService, SELECT_CIBLAGE } from './ciblage.service';
import { EngagementsService } from './engagements.service';

/**
 * DIFFUSION CIBLÉE — les trois vagues de sollicitation.
 *
 * Ce réglage est le cœur du dispositif de couverture. Le principe, vérifié
 * sur les places de marché de remplacement qui ont décollé : mieux vaut
 * solliciter huit personnes qui se sentent attendues que cent qui se sentent
 * noyées. On n'élargit que si le besoin reste non pourvu — la portée totale
 * est identique, mais la probabilité qu'un intervenant réponde est bien plus
 * élevée sur la première vague.
 *
 * `apresMinutes` = délai d'attente avant de déclencher cette vague, compté
 * depuis la précédente. Une mission urgente divise ces délais par trois :
 * quand le renfort est pour demain, on ne peut pas attendre huit heures.
 */
export const VAGUES = [
  { taille: 8, seuil: 60, apresMinutes: 0 },
  { taille: 15, seuil: 50, apresMinutes: 180 },
  { taille: 100, seuil: 45, apresMinutes: 480 },
] as const;

/**
 * MATCHING ÉLARGI — réservé au mode « file d'engagement ».
 *
 * Le dosage ci-dessus vient d'un arbitrage imposé par l'attribution
 * automatique : comme le premier qui accepte a la mission, solliciter très
 * largement revient à confier sa structure au plus rapide. On restreignait
 * donc, et on couvrait moins.
 *
 * Quand l'établissement valide chaque profil, cet arbitrage disparaît. On peut
 * alors ouvrir en grand — vagues plus larges, seuils de correspondance plus
 * bas, délais plus courts — sans lui faire courir le moindre risque : la file
 * se remplit, et il choisit. C'est le vrai gain du mode, et c'est ce qui
 * transforme un vivier étroit en couverture réelle.
 */
export const VAGUES_LARGES = [
  { taille: 25, seuil: 40, apresMinutes: 0 },
  { taille: 60, seuil: 30, apresMinutes: 120 },
  { taille: 300, seuil: 20, apresMinutes: 360 },
] as const;

/** Le jeu de vagues applicable à une mission, selon son mode d'attribution. */
export function vaguesPour(mode: ModeAttribution): ReadonlyArray<{
  taille: number;
  seuil: number;
  apresMinutes: number;
}> {
  return mode === ModeAttribution.FILE_ENGAGEMENT ? VAGUES_LARGES : VAGUES;
}

/**
 * « Mission garantie » — délai après la dernière vague au terme duquel une
 * mission toujours non pourvue déclenche une relance HUMAINE : l'association
 * est alertée et l'établissement prévenu que quelqu'un reprend la main.
 * C'est l'engagement qui transforme une annonce incertaine en promesse.
 */
export const DELAI_ALERTE_NON_POURVUE_MIN = 720;

/** Ordre de la diffusion en cascade : SALARIES -> RESERVED -> PUBLIC. */
const CASCADE: MissionVisibility[] = [
  MissionVisibility.SALARIES,
  MissionVisibility.RESERVED,
  MissionVisibility.PUBLIC,
];

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly matching: MatchingService,
    private readonly mail: MailService,
    private readonly community: CommunityService,
    private readonly progression: ProgressionService,
    private readonly ciblage: CiblageService,
    private readonly engagements: EngagementsService,
  ) {}

  /** Crée une mission (statut DRAFT) rattachée au compte établissement actif. */
  async create(accountId: string, accountType: string, dto: CreateMissionDto) {
    // Un renfort est un BESOIN de remplacement : il n'est émis que par une
    // structure qui a un poste à couvrir. Un intervenant se propose, il ne
    // publie pas de besoin — sinon le marketplace se remplit d'offres qui
    // n'engagent personne et les deux côtés du métier se confondent.
    if (accountType !== 'ESTABLISHMENT') {
      throw new ForbiddenException(
        'Seul un compte établissement publie un besoin de renfort. Depuis un compte intervenant, répondez aux missions ouvertes.',
      );
    }
    if (dto.endDate && new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }
    return this.prisma.reliefMission.create({
      data: {
        accountId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        categoryId: dto.categoryId ?? undefined,
        job: dto.job,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        city: dto.city,
        postalCode: dto.postalCode,
        hourlyRate: dto.hourlyRate,
        headcount: dto.headcount ?? 1,
        emergency: dto.emergency ?? false,
        recurrence: dto.recurrence ?? null,
        ...(await geocoderCodePostal(dto.postalCode)),
        attachmentUrl: dto.attachmentUrl,
        attachmentId: dto.attachmentId ?? null,
        orgUnitId: dto.orgUnitId,
        modeAttribution: dto.modeAttribution ?? ModeAttribution.AUTOMATIQUE,
        ...this.normaliserCiblage(dto),
      },
    });
  }

  /**
   * Nettoie le ciblage demandé pour qu'il soit cohérent tout seul, sans que
   * l'écran ait à y veiller. Une cible « unité » sans unité désignée, ou une
   * cible « sélection » sans personne cochée, ne restreindrait rien du tout :
   * on retombe alors sur la diffusion normale plutôt que de publier une
   * mission que personne ne recevrait.
   */
  private normaliserCiblage(dto: {
    cibleDiffusion?: CibleDiffusion;
    orgUnitId?: string | null;
    destinatairesSalaries?: string[];
    destinatairesIntervenants?: string[];
  }) {
    const salaries = [...new Set(dto.destinatairesSalaries ?? [])];
    const intervenants = [...new Set(dto.destinatairesIntervenants ?? [])];
    let cible = dto.cibleDiffusion ?? CibleDiffusion.RESEAU;
    if (cible === CibleDiffusion.UNITE && !dto.orgUnitId) cible = CibleDiffusion.RESEAU;
    if (cible === CibleDiffusion.SELECTION && salaries.length + intervenants.length === 0) {
      cible = CibleDiffusion.RESEAU;
    }
    return {
      cibleDiffusion: cible,
      destinatairesSalaries: cible === CibleDiffusion.SELECTION ? salaries : [],
      destinatairesIntervenants: cible === CibleDiffusion.SELECTION ? intervenants : [],
    };
  }

  /** Missions appartenant au compte actif (back-office établissement). */
  /**
   * `take` borne la liste. Le tableau de bord demandait déjà `?take=4`, mais
   * le paramètre n'était lu nulle part : après quelques mois d'activité, le
   * widget « Mes renforts » chargeait tout l'historique du compte pour en
   * afficher quatre lignes. Plafond dur à 200 : au-delà, on pagine ailleurs.
   */
  async findAllByAccount(accountId: string, take?: number) {
    const missions = await this.prisma.reliefMission.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, Math.trunc(Number(take) || 50))),
      include: {
        _count: { select: { bookings: true } },
        categoryRef: { select: { id: true, title: true } },
        // Les candidatures, AVEC la personne derriere chacune. Sans cette
        // jointure, le board SOS Renfort affichait « Candidatures recues (0) »
        // a vie : l'ecran attendait mission.bookings, l'API ne l'envoyait
        // jamais. Le coeur du produit etait muet.
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    profile: { select: { job: true, city: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // L'ecran parle d'un « candidat », pas d'un compte : on aplati la relation
    // compte -> proprietaire en un champ applicant que le front sait afficher.
    return missions.map((m) => ({
      ...m,
      bookings: m.bookings.map((b) => ({ ...b, applicant: b.account?.owner ?? null })),
    }));
  }

  /** Marketplace : missions publiées filtrées (statut/visibilité/ville/dates). */
  async findMarketplace(query: QueryMissionsDto) {
    const where: Prisma.ReliefMissionWhereInput = {
      status: query.status ?? MissionStatus.PUBLISHED,
    };
    // La cascade de diffusion s'applique aussi a la LECTURE. Une mission au
    // palier « salaries » ou « reseau reserve » ne doit pas apparaitre sur la
    // marketplace publique : la promesse de confidentialite faite a
    // l'etablissement ne vaut que si on la tient ici. Une requete ne peut pas
    // elargir ce perimetre, seulement le restreindre.
    where.visibility =
      query.visibility && query.visibility === MissionVisibility.PUBLIC
        ? query.visibility
        : MissionVisibility.PUBLIC;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    // Sans rayon : filtre departemental historique. Avec rayon : on ne
    // restreint pas ici, la distance est calculee apres coup (volumes faibles).
    if (query.postalCode && !query.rayonKm) {
      where.postalCode = { startsWith: query.postalCode.slice(0, 2) };
    }
    if (query.job) where.job = { contains: query.job, mode: 'insensitive' };
    if (query.category) where.category = query.category;
    if (query.minRate !== undefined || query.maxRate !== undefined) {
      where.hourlyRate = {};
      if (query.minRate !== undefined) (where.hourlyRate as any).gte = query.minRate;
      if (query.maxRate !== undefined) (where.hourlyRate as any).lte = query.maxRate;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.from || query.to) {
      where.startDate = {};
      if (query.from) where.startDate.gte = new Date(query.from);
      if (query.to) where.startDate.lte = new Date(query.to);
    }

    // Pagination : page/limit ont priorité sur take/skip s'ils sont fournis.
    const take = query.limit ?? query.take ?? 20;
    const skip = query.page ? (query.page - 1) * take : (query.skip ?? 0);

    // Filtre « a moins de X km » : centre geocode du code postal demande,
    // puis tri des missions geocodees par distance a vol d'oiseau.
    if (query.postalCode && query.rayonKm) {
      const centre = await geocoderCodePostal(query.postalCode);
      if (centre) {
        const candidates = await this.prisma.reliefMission.findMany({
          where: { ...where, latitude: { not: null }, longitude: { not: null } },
          orderBy: { startDate: 'asc' },
          take: 500,
          include: {
            account: { select: { id: true, name: true, city: true, logoUrl: true } },
            categoryRef: { select: { id: true, title: true } },
          },
        });
        const dansLeRayon = candidates
          .map((m) => ({
            ...m,
            distanceKm: Math.round(
              distanceKm(centre, { latitude: m.latitude!, longitude: m.longitude! }) * 10,
            ) / 10,
          }))
          .filter((m) => m.distanceKm <= query.rayonKm!)
          .sort((a, b) => a.distanceKm - b.distanceKm);
        return {
          items: dansLeRayon.slice(skip, skip + take),
          total: dansLeRayon.length,
          take,
          skip,
          page: query.page ?? Math.floor(skip / take) + 1,
        };
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reliefMission.findMany({
        where,
        orderBy: { startDate: 'asc' },
        take,
        skip,
        include: {
          account: { select: { id: true, name: true, city: true, logoUrl: true } },
          categoryRef: { select: { id: true, title: true } },
        },
      }),
      this.prisma.reliefMission.count({ where }),
    ]);
    return { items, total, take, skip, page: query.page ?? Math.floor(skip / take) + 1 };
  }

  /** Détail d'une mission. Vérifie l'appartenance si accountId fourni. */
  async findOne(id: string, accountId?: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, city: true, logoUrl: true } },
        categoryRef: { select: { id: true, title: true } },
        bookings: true,
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    // Propriétaire : détail complet (avec candidatures).
    if (accountId && mission.accountId === accountId) return mission;
    // Non-propriétaire : uniquement les missions publiées ET réellement
    // ouvertes, SANS le pipeline de candidatures.
    //
    // Une mission encore réservée à l'équipe interne (palier SALARIES) se
    // lisait intégralement par son adresse directe — description, taux
    // horaire, nom de l'établissement — alors que l'écran promet le contraire
    // à celui qui la publie. Seule la candidature était bloquée ; la lecture,
    // non. On traite désormais ce cas comme un brouillon : introuvable.
    if (
      mission.status === MissionStatus.PUBLISHED &&
      mission.visibility !== MissionVisibility.SALARIES
    ) {
      const { bookings: _bookings, ...publicView } = mission as any;
      return publicView;
    }
    // Brouillon, fermée, ou réservée à l'équipe : on ne révèle pas son existence.
    throw new NotFoundException('Mission introuvable.');
  }

  private async assertOwned(id: string, accountId: string) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.accountId !== accountId) {
      throw new ForbiddenException('Mission hors de votre compte.');
    }
    return mission;
  }

  async update(id: string, accountId: string, dto: UpdateMissionDto) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status === MissionStatus.CLOSED || mission.status === MissionStatus.CANCELLED) {
      throw new BadRequestException('Mission clôturée : édition impossible.');
    }
    // Le ciblage n'est retouché que s'il est explicitement demandé : sinon une
    // simple correction de titre remettrait la mission en diffusion ouverte.
    const ciblageDemande =
      dto.cibleDiffusion !== undefined ||
      dto.destinatairesSalaries !== undefined ||
      dto.destinatairesIntervenants !== undefined;
    const {
      cibleDiffusion: _c,
      destinatairesSalaries: _s,
      destinatairesIntervenants: _i,
      ...reste
    } = dto;
    return this.prisma.reliefMission.update({
      where: { id },
      data: {
        ...reste,
        ...(ciblageDemande
          ? this.normaliserCiblage({
              cibleDiffusion: dto.cibleDiffusion ?? mission.cibleDiffusion,
              orgUnitId: dto.orgUnitId ?? mission.orgUnitId,
              destinatairesSalaries: dto.destinatairesSalaries ?? mission.destinatairesSalaries,
              destinatairesIntervenants:
                dto.destinatairesIntervenants ?? mission.destinatairesIntervenants,
            })
          : {}),
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  /**
   * ON NE SUPPRIME PAS CE À QUOI QUELQU'UN S'EST DÉJÀ ENGAGÉ.
   *
   * Supprimer une mission effaçait la mission, mais laissait les candidatures
   * derrière elle : l'intervenant gardait « 1 candidature en cours » sur son
   * tableau de bord, pour une annonce qui n'existait plus, et sans aucun
   * moyen de s'en défaire. Du travail engagé de son côté disparaissait sans
   * un mot.
   *
   * Une mission qui a reçu des candidatures se CLÔTURE (les candidats sont
   * prévenus, l'historique reste). La suppression pure reste possible tant
   * que personne ne s'est positionné.
   */
  async remove(id: string, accountId: string) {
    await this.assertOwned(id, accountId);
    const candidatures = await this.prisma.booking.count({ where: { missionId: id } });
    if (candidatures > 0) {
      throw new BadRequestException(
        candidatures === 1
          ? 'Une personne a déjà candidaté à ce renfort : il ne peut plus être supprimé. Clôturez-le — elle en sera informée, et l’historique restera consultable.'
          : `${candidatures} personnes ont déjà candidaté à ce renfort : il ne peut plus être supprimé. Clôturez-le — elles en seront informées, et l’historique restera consultable.`,
      );
    }
    await this.prisma.reliefMission.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Publie une mission : DRAFT -> PUBLISHED et démarre la cascade au palier
   * le plus restreint utile (SALARIES si vivier interne, sinon PUBLIC).
   * L'établissement peut forcer un palier ; /broaden élargit ensuite, et le
   * planificateur élargit tout seul si la mission reste non pourvue.
   */
  async publish(
    id: string,
    accountId: string,
    visibiliteDemandee?: MissionVisibility,
    roleUtilisateur?: string,
  ) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status !== MissionStatus.DRAFT) {
      throw new BadRequestException('Seule une mission en brouillon peut être publiée.');
    }
    // Validation hierarchique (option du compte) : un MANAGER demande, un
    // OWNER/ADMIN approuve avant toute diffusion.
    if (roleUtilisateur === 'MANAGER') {
      const compte = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { validationMissions: true },
      });
      if (compte?.validationMissions) {
        const enAttente = await this.prisma.reliefMission.update({
          where: { id },
          data: { attenteValidation: true },
        });
        await this.notifierApprobateurs(accountId, enAttente.id, enAttente.title);
        return enAttente;
      }
    }
    if (mission.attenteValidation) {
      // Un OWNER/ADMIN qui publie vaut approbation.
      await this.prisma.reliefMission.update({ where: { id }, data: { attenteValidation: false } });
    }
    // Un ciblage nominatif IMPOSE le palier : une mission adressée au seul
    // SESSAD, ou aux trois intervenants qu'on connaît, ne doit jamais se
    // retrouver sur la marketplace publique. La restriction demandée est une
    // promesse faite à l'établissement — elle prime sur tout le reste, y
    // compris sur une visibilité explicitement demandée par l'écran.
    const impose = CiblageService.palierImpose(mission);
    // Palier de départ : « mon équipe d'abord » si le compte a effectivement
    // un vivier interne (salariés ou intervenants déjà venus), sinon on
    // publierait dans le vide → diffusion publique immédiate.
    const demande = visibiliteDemandee ?? null;
    const palierDepart =
      impose ??
      demande ??
      ((await this.aUnViverInterne(accountId)) ? MissionVisibility.SALARIES : MissionVisibility.PUBLIC);

    const published = await this.prisma.reliefMission.update({
      where: { id },
      data: {
        status: MissionStatus.PUBLISHED,
        visibility: palierDepart,
        publishedAt: new Date(),
      },
    });
    // Diffusion ciblée selon le palier. N'échoue jamais la publication.
    this.broadcastToMatched(id, accountId).catch(() => undefined);
    return published;
  }

  /** Previent les OWNER/ADMIN du compte qu'une mission attend leur approbation. */
  private async notifierApprobateurs(accountId: string, missionId: string, titre: string) {
    const approbateurs = await this.prisma.membership.findMany({
      where: { accountId, role: { in: ['OWNER', 'ADMIN'] }, status: 'ACTIVE' },
      select: { userId: true },
    });
    await Promise.allSettled(
      approbateurs.map((m) =>
        this.notifications.create(m.userId, {
          type: 'MISSION_APPROVAL',
          title: 'Mission à approuver',
          body: `« ${titre} » attend votre validation avant diffusion.`,
          link: '/dashboard/renforts',
        }),
      ),
    );
  }

  /** Approbation par un OWNER/ADMIN : la mission part en diffusion normale. */
  async approve(id: string, accountId: string, visibiliteDemandee?: MissionVisibility) {
    const mission = await this.assertOwned(id, accountId);
    if (!mission.attenteValidation) {
      throw new BadRequestException("Cette mission n'attend pas d'approbation.");
    }
    await this.prisma.reliefMission.update({ where: { id }, data: { attenteValidation: false } });
    return this.publish(id, accountId, visibiliteDemandee);
  }

  /**
   * Republier : duplique une mission en brouillon, datee une semaine plus
   * tard (ou a la date demandee). L'etablissement ajuste puis publie —
   * fini la ressaisie des missions qui reviennent chaque semaine.
   */
  async dupliquer(id: string, accountId: string, dateDebut?: string) {
    const source = await this.assertOwned(id, accountId);
    const debut = dateDebut
      ? new Date(dateDebut)
      : new Date(new Date(source.startDate).getTime() + 7 * 86_400_000);
    const decalage = debut.getTime() - new Date(source.startDate).getTime();
    return this.prisma.reliefMission.create({
      data: {
        accountId,
        title: source.title,
        description: source.description,
        category: source.category,
        categoryId: source.categoryId,
        job: source.job,
        startDate: debut,
        endDate: source.endDate ? new Date(new Date(source.endDate).getTime() + decalage) : null,
        startTime: source.startTime,
        endTime: source.endTime,
        city: source.city,
        postalCode: source.postalCode,
        hourlyRate: source.hourlyRate,
        headcount: source.headcount,
        emergency: source.emergency,
        orgUnitId: source.orgUnitId,
        status: 'DRAFT',
      },
    });
  }

  /**
   * Envoie l'offre par e-mail aux freelances dont le score de correspondance
   * est suffisant et qui sont disponibles (premier arrivé, premier servi).
   * `options.excludeAccountIds` permet d'écarter certains comptes lors d'une
   * relance automatique (ex. : les intervenants ayant déjà candidaté).
   * Retourne le nombre d'intervenants effectivement ciblés.
   */
  /**
   * Comptes d'intervenants déjà venus travailler pour cet établissement :
   * ils ont soit accepté une de ses missions, soit animé un de ses ateliers.
   * C'est le « vivier réservé » du palier RESERVED.
   */
  private intervenantsConnus(accountId: string): Promise<string[]> {
    // Le calcul vit désormais dans CiblageService : il sert au palier RESERVED
    // comme à la cible « personnes déjà connues », et une seule définition du
    // vivier évite que les deux divergent.
    return this.ciblage.intervenantsConnus(accountId);
  }

  /** Le compte a-t-il de quoi alimenter un palier interne (équipe ou habitués) ? */
  private async aUnViverInterne(accountId: string): Promise<boolean> {
    const membres = await this.prisma.membership.count({
      where: { accountId, status: 'ACTIVE' },
    });
    if (membres > 1) return true;
    const connus = await this.intervenantsConnus(accountId);
    return connus.length > 0;
  }

  /**
   * Palier SALARIES : on ne sort pas de la structure. L'offre est poussée aux
   * salariés DESTINATAIRES — toute l'équipe en diffusion normale, les seuls
   * membres de l'unité désignée quand l'établissement a ciblé un service, les
   * seules personnes cochées quand il a fait une sélection nominative.
   *
   * Jusqu'ici, ce calcul ignorait l'unité : le champ existait sur la mission,
   * l'écran le proposait, et l'internat recevait les créneaux du SESSAD.
   */
  private async notifierEquipeInterne(mission: {
    id: string;
    title: string;
    accountId: string;
    startDate: Date;
    orgUnitId: string | null;
    visibility: MissionVisibility;
    cibleDiffusion: CibleDiffusion;
    destinatairesSalaries: string[];
    destinatairesIntervenants: string[];
  }): Promise<number> {
    const destinataires = await this.ciblage.salariesDestinataires(mission);
    const cible = mission.cibleDiffusion !== CibleDiffusion.RESEAU;
    // Les salariés doivent atterrir là où l'on accepte : la fiche mission de la
    // marketplace porte le bouton. Le board /dashboard/renforts, lui, sert à
    // celui qui publie, pas à celui qui se propose.
    const lien = `/marketplace/missions/${mission.id}`;
    const quand = mission.startDate.toLocaleDateString('fr-FR');
    await Promise.allSettled(
      destinataires.map((userId) =>
        this.notifications.create(userId, {
          type: 'MISSION_INTERNE',
          title: cible ? 'Un créneau vous est proposé' : 'Créneau à couvrir en interne',
          body: cible
            ? `« ${mission.title} » du ${quand} vous est proposé directement par votre établissement.`
            : `« ${mission.title} » du ${quand} est proposé à l'équipe avant d'être ouvert aux intervenants extérieurs.`,
          link: lien,
        }),
      ),
    );
    return destinataires.length;
  }

  private async broadcastToMatched(
    missionId: string,
    accountId: string,
    options?: { excludeAccountIds?: string[] },
  ): Promise<number> {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id: missionId } });
    if (!mission) return 0;

    // ── Cascade : le palier décide QUI est sollicité ───────────────────────
    if (mission.visibility === MissionVisibility.SALARIES) {
      // Rien ne sort de la structure à ce stade.
      return this.notifierEquipeInterne(mission);
    }

    const { candidates } = await this.matching.candidatesForMission(missionId, accountId);
    const exclus = new Set(options?.excludeAccountIds ?? []);

    // ── Ciblage nominatif : il prime sur la cascade ─────────────────────────
    // « Uniquement les gens que je connais » ou « uniquement ces personnes-là »
    // ne se négocie pas : on envoie à cette liste, une seule fois, et on
    // n'élargit jamais tout seul.
    const nominatif = await this.ciblage.intervenantsAutorises(mission);
    if (nominatif) {
      const destinataires = candidates.filter(
        (c: any) => c.email && nominatif.has(c.accountId) && !exclus.has(c.accountId),
      );
      // La cible « unité » et une sélection de seuls salariés n'ont personne à
      // l'extérieur : la diffusion est purement interne.
      const internes = await this.notifierEquipeInterne(mission);
      await Promise.allSettled(
        destinataires.map((c: any) =>
          this.mail.sendMissionMatch(c.email, {
            title: mission.title,
            city: mission.city,
            date: mission.startDate,
            job: mission.job,
            rate: mission.hourlyRate ? String(mission.hourlyRate) : null,
            emergency: mission.emergency,
            missionId,
            retenus: destinataires.length,
            vague: 1,
          }),
        ),
      );
      await this.prisma.reliefMission.update({
        where: { id: missionId },
        data: { diffusionVague: 1, derniereVagueAt: new Date() },
      });
      this.logger.log(
        `Mission ${missionId} — diffusion ciblée (${mission.cibleDiffusion}) : ${destinataires.length} intervenant(s) + ${internes} salarié(s).`,
      );
      return destinataires.length + internes;
    }

    // Palier RESERVED : uniquement les intervenants déjà venus dans la structure.
    let autorises: Set<string> | null = null;
    if (mission.visibility === MissionVisibility.RESERVED) {
      autorises = new Set(await this.intervenantsConnus(accountId));
      // Programme de progression : les « Super Extra » (10 missions terminees,
      // note >= 4,5, annulations <= 5 %) sont sollicites des ce palier, avant
      // l'ouverture au reseau complet — c'est leur avantage d'acces prioritaire.
      const superExtras = await this.progression.superExtrasParmi(
        candidates.map((c: any) => c.accountId).filter((id: string) => !autorises!.has(id)),
      );
      for (const id of superExtras) autorises.add(id);
      if (autorises.size === 0) return 0; // pas de vivier : le planificateur élargira.
    }

    const eligibles = candidates.filter(
      (c: any) =>
        c.available &&
        !c.hasConflict &&
        c.email &&
        !exclus.has(c.accountId) &&
        (!autorises || autorises.has(c.accountId)),
    );

    // ── Diffusion CIBLÉE, par vagues ────────────────────────────────────────
    // Auparavant : un envoi unique aux 100 premiers profils au-dessus de 45.
    // Le défaut n'était pas la portée mais la dilution — sollicité en même
    // temps que quatre-vingt-dix-neuf autres, chacun suppose qu'un collègue
    // prendra la mission, et le taux d'acceptation s'effondre. On sollicite
    // désormais peu de monde à la fois, en élargissant seulement si le besoin
    // reste non pourvu (voir VAGUES et le planificateur `avancerLesVagues`).
    // Le mode d'attribution décide de l'ampleur : quand l'établissement valide
    // chaque profil, on peut ouvrir en grand sans lui faire courir de risque.
    const vagues = vaguesPour(mission.modeAttribution);
    const vague = Math.min(Math.max(mission.diffusionVague + 1, 1), vagues.length);
    const { taille, seuil } = vagues[vague - 1];
    const dejaSollicites = vagues.slice(0, vague - 1).reduce((n, v) => n + v.taille, 0);

    const targets = eligibles
      .filter((c: any) => c.total >= seuil)
      .slice(dejaSollicites, dejaSollicites + taille);

    if (targets.length === 0) {
      // Personne de nouveau à ce palier : on note quand même la vague pour
      // que le planificateur passe au suivant plutôt que de boucler.
      await this.prisma.reliefMission.update({
        where: { id: missionId },
        data: { diffusionVague: vague, derniereVagueAt: new Date() },
      });
      return 0;
    }

    await Promise.allSettled(
      targets.map((c: any) =>
        this.mail.sendMissionMatch(c.email, {
          title: mission.title,
          city: mission.city,
          date: mission.startDate,
          job: mission.job,
          rate: mission.hourlyRate ? String(mission.hourlyRate) : null,
          emergency: mission.emergency,
          missionId,
          retenus: targets.length,
          vague,
        }),
      ),
    );

    await this.prisma.reliefMission.update({
      where: { id: missionId },
      data: { diffusionVague: vague, derniereVagueAt: new Date() },
    });
    this.logger.log(
      `Mission ${missionId} — vague ${vague}/${vagues.length} : ${targets.length} intervenant(s) sollicité(s) (seuil ${seuil}).`,
    );
    return targets.length;
  }

  /**
   * SOS Renfort — un FREELANCE accepte la mission (premier arrivé, premier servi).
   * Verrou atomique : la mission ne peut être remportée que par un seul intervenant.
   *
   * En mode « file d'engagement », l'attribution n'appartient plus à
   * l'intervenant : on redirige vers `sengager()` plutôt que de renvoyer une
   * erreur. Un bouton qui échoue sur une règle métier légitime se lit comme
   * une panne, et les anciens clients (e-mails déjà partis, pages ouvertes)
   * continuent d'appeler cette route.
   */
  async accept(missionId: string, freelanceAccountId: string, accountType?: string) {
    if (accountType === 'ESTABLISHMENT') {
      throw new BadRequestException('Seuls les freelances peuvent accepter une mission de renfort.');
    }
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      include: { account: { select: { id: true, name: true, ownerId: true, city: true } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.accountId === freelanceAccountId) {
      throw new BadRequestException('Vous ne pouvez pas accepter votre propre mission.');
    }
    if (mission.modeAttribution === ModeAttribution.FILE_ENGAGEMENT) {
      return this.engagements.sengager(missionId, freelanceAccountId, accountType);
    }
    // Un ciblage nominatif s'applique à la RÉPONSE autant qu'à l'envoi : sans
    // ce contrôle, n'importe qui muni du lien contournerait la restriction et
    // la promesse faite à l'établissement ne vaudrait rien.
    await this.ciblage.assertCiblageRespecte(mission, freelanceAccountId);

    // Verrou : passe PUBLISHED -> FILLED uniquement si personne ne l'a déjà prise.
    const claim = await this.prisma.reliefMission.updateMany({
      where: { id: missionId, status: MissionStatus.PUBLISHED },
      data: { status: MissionStatus.FILLED },
    });
    if (claim.count === 0) {
      throw new ConflictException('Cette mission vient d’être pourvue par un autre intervenant.');
    }

    // Booking confirmé pour le freelance + fermeture des autres candidatures.
    const booking = await this.prisma.booking.create({
      data: {
        accountId: freelanceAccountId,
        missionId,
        status: BookingStatus.CONFIRMED,
        scheduledAt: mission.startDate,
        totalAmount: mission.hourlyRate ?? undefined,
      },
    });
    await this.prisma.booking.updateMany({
      where: { missionId, status: BookingStatus.REQUESTED, id: { not: booking.id } },
      data: { status: BookingStatus.CANCELLED, cancelReason: 'Mission pourvue par un autre intervenant.' },
    });

    // La mission est pourvue : l'intervenant qui prend le relais est crédité.
    // C'est l'action la plus utile au réseau, c'est la mieux récompensée.
    await this.community
      .crediter(freelanceAccountId, PointReason.MISSION, `Mission acceptée : ${mission.title}`)
      .catch(() => undefined);

    // Profil du freelance (pour l'établissement).
    const freelance = await this.prisma.account.findUnique({
      where: { id: freelanceAccountId },
      select: { name: true, owner: { select: { id: true, email: true, firstName: true, lastName: true, profile: { select: { job: true } } } } },
    });
    const flName = [freelance?.owner?.firstName, freelance?.owner?.lastName].filter(Boolean).join(' ') || freelance?.name || 'Un intervenant';
    const contractUrl = `/documents/contrat/${booking.id}`;

    // Notifications établissement.
    if (mission.account?.ownerId) {
      await this.notifications.create(mission.account.ownerId, {
        type: 'MISSION_FILLED',
        title: 'Mission pourvue',
        body: `« ${mission.title} » a été acceptée par ${flName}. Contrat à signer.`,
        link: contractUrl,
      });
      const estOwner = await this.prisma.user.findUnique({ where: { id: mission.account.ownerId }, select: { email: true } });
      if (estOwner?.email) {
        await this.mail.sendMissionFilledEstablishment(estOwner.email, {
          title: mission.title,
          freelanceName: flName,
          freelanceJob: freelance?.owner?.profile?.job ?? null,
          city: mission.city,
          date: mission.startDate,
          contractUrl,
        }).catch(() => undefined);
      }
    }

    // Notifications freelance.
    if (freelance?.owner?.id) {
      await this.notifications.create(freelance.owner.id, {
        type: 'MISSION_ACCEPTED',
        title: 'Mission confirmée',
        body: `Vous avez décroché « ${mission.title} ». Signez le contrat de mission.`,
        link: contractUrl,
      });
      if (freelance.owner.email) {
        await this.mail.sendMissionAcceptedFreelance(freelance.owner.email, {
          title: mission.title,
          city: mission.city,
          address: null,
          date: mission.startDate,
          time: mission.startTime && mission.endTime ? `${mission.startTime} – ${mission.endTime}` : mission.startTime ?? null,
          contractUrl,
        }).catch(() => undefined);
      }
    }

    return { booking, contractUrl };
  }

  /**
   * PLANIFICATEUR DE DIFFUSION — toutes les 15 minutes.
   *
   * Fait vivre le dispositif ciblé : il déclenche la vague suivante des
   * missions publiées qui n'ont pas encore trouvé preneur, puis, une fois
   * les vagues épuisées, honore l'engagement « mission garantie » en
   * alertant l'association et en prévenant l'établissement.
   *
   * Une mission urgente avance trois fois plus vite : quand le renfort est
   * pour le lendemain, attendre huit heures avant d'élargir n'a pas de sens.
   */
  @Cron('*/15 * * * *', { name: 'missions-diffusion-ciblee' })
  async avancerLesVagues() {
    const enCours = await this.prisma.reliefMission.findMany({
      where: {
        status: MissionStatus.PUBLISHED,
        visibility: { not: MissionVisibility.SALARIES },
        derniereVagueAt: { not: null },
      },
      select: {
        id: true,
        accountId: true,
        title: true,
        city: true,
        startDate: true,
        emergency: true,
        diffusionVague: true,
        derniereVagueAt: true,
        alerteNonPourvueAt: true,
        modeAttribution: true,
        cibleDiffusion: true,
        account: { select: { name: true, owner: { select: { email: true } } } },
      },
      take: 200,
    });

    // Les établissements qui laissent un profil sans réponse bloquent toute la
    // file : on les relance avant d'examiner les vagues.
    const relances = await this.engagements.relancerDecisionsEnAttente().catch(() => 0);

    const maintenant = Date.now();
    let vaguesLancees = 0;
    let alertes = 0;

    for (const m of enCours) {
      const facteur = m.emergency ? 3 : 1; // l'urgence comprime les délais
      const ecouleMin = (maintenant - m.derniereVagueAt!.getTime()) / 60_000;

      const vagues = vaguesPour(m.modeAttribution);
      // Une mission adressée nominativement n'a QU'UNE vague, par définition :
      // élargir reviendrait à trahir la restriction demandée. Elle passe donc
      // directement à l'engagement « mission garantie » si personne ne répond.
      const verrouillee = CiblageService.estVerrouillee(m.cibleDiffusion);

      try {
        // ── Vague suivante, s'il en reste une ────────────────────────────
        if (!verrouillee && m.diffusionVague < vagues.length) {
          const attendu = vagues[m.diffusionVague].apresMinutes / facteur;
          if (ecouleMin >= attendu) {
            const n = await this.broadcastToMatched(m.id, m.accountId);
            if (n > 0) vaguesLancees += 1;
          }
          continue;
        }

        // ── Vagues épuisées : l'engagement « mission garantie » ──────────
        if (m.alerteNonPourvueAt) continue;
        if (ecouleMin < DELAI_ALERTE_NON_POURVUE_MIN / facteur) continue;

        const sollicites = verrouillee
          ? m.diffusionVague
          : vagues.reduce((n, v) => n + v.taille, 0);
        const destinataires: Promise<unknown>[] = [];
        const adminEmail = process.env.MAIL_ADMIN ?? process.env.MAIL_FROM_ADDRESS;
        if (adminEmail) {
          destinataires.push(
            this.mail.sendMissionNonPourvue(adminEmail, {
              title: m.title,
              city: m.city,
              date: m.startDate,
              missionId: m.id,
              sollicites,
              pourAdmin: true,
            }),
          );
        }
        if (m.account?.owner?.email) {
          destinataires.push(
            this.mail.sendMissionNonPourvue(m.account.owner.email, {
              title: m.title,
              city: m.city,
              date: m.startDate,
              missionId: m.id,
              sollicites,
            }),
          );
        }
        await Promise.allSettled(destinataires);
        await this.prisma.reliefMission.update({
          where: { id: m.id },
          data: { alerteNonPourvueAt: new Date() },
        });
        alertes += 1;
      } catch (err) {
        // Une mission en erreur ne doit pas bloquer la tournée des autres.
        this.logger.error(`Diffusion impossible pour la mission ${m.id}: ${err}`);
      }
    }

    if (vaguesLancees || alertes || relances) {
      this.logger.log(
        `Diffusion ciblée : ${vaguesLancees} vague(s) lancée(s), ${alertes} alerte(s) « mission garantie », ${relances} relance(s) de décision.`,
      );
    }
  }

  /** Élargit la diffusion d'un cran : SALARIES -> RESERVED -> PUBLIC. */
  async broaden(id: string, accountId: string) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException('La mission doit être publiée pour élargir sa diffusion.');
    }
    if (CiblageService.estVerrouillee(mission.cibleDiffusion)) {
      throw new BadRequestException(
        "Cette mission a été adressée à des destinataires précis : sa diffusion ne s'élargit pas. Modifiez la mission pour l'ouvrir au réseau.",
      );
    }
    const idx = CASCADE.indexOf(mission.visibility);
    if (idx >= CASCADE.length - 1) {
      throw new BadRequestException('Diffusion déjà au niveau maximal (PUBLIC).');
    }
    return this.prisma.reliefMission.update({
      where: { id },
      data: { visibility: CASCADE[idx + 1] },
    });
  }

  /**
   * Candidature d'un FREELANCE : crée un Booking REQUESTED rattaché au compte
   * freelance actif, et notifie l'établissement propriétaire de la mission.
   */
  async candidate(missionId: string, freelanceAccountId: string, accountType?: string) {
    if (accountType === 'ESTABLISHMENT') {
      throw new BadRequestException('Seuls les freelances peuvent candidater à une mission.');
    }
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      include: { account: { select: { ownerId: true, name: true } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException('Cette mission n’accepte pas de candidatures.');
    }
    if (mission.accountId === freelanceAccountId) {
      throw new BadRequestException('Vous ne pouvez pas candidater à votre propre mission.');
    }
    // Le ciblage nominatif vaut aussi pour la candidature.
    await this.ciblage.assertCiblageRespecte(mission, freelanceAccountId);
    if (mission.modeAttribution === ModeAttribution.FILE_ENGAGEMENT) {
      throw new BadRequestException(
        'Sur cette mission, on ne candidate pas : cliquez sur « Je prends la mission ». Votre profil sera présenté à l’établissement pour validation.',
      );
    }

    // La cascade s'applique aussi a la candidature. Une mission encore
    // reservee aux salaries n'est pas candidatable de l'exterieur ; une
    // mission au palier « reseau reserve » n'est ouverte qu'aux intervenants
    // deja connus de l'etablissement (vivier ou historique).
    if (mission.visibility === MissionVisibility.SALARIES) {
      throw new BadRequestException(
        "Cette mission est encore réservée aux salariés de l'établissement.",
      );
    }
    if (mission.visibility === MissionVisibility.RESERVED) {
      const connus = await this.intervenantsConnus(mission.accountId);
      if (!connus.includes(freelanceAccountId)) {
        throw new BadRequestException(
          "Cette mission est réservée au réseau de l'établissement pour l'instant. Elle s'ouvrira plus largement si elle n'est pas pourvue.",
        );
      }
    }

    // Garde-fou juridique : un salarié de l'établissement ne peut pas s'y
    // facturer en indépendant (requalification / travail dissimulé). Il reste
    // libre d'intervenir dans tous les autres établissements.
    const compteFreelance = await this.prisma.account.findUnique({
      where: { id: freelanceAccountId },
      select: { ownerId: true },
    });
    if (compteFreelance?.ownerId) {
      const salarie = await this.prisma.membership.findFirst({
        where: { accountId: mission.accountId, userId: compteFreelance.ownerId },
        select: { id: true },
      });
      if (salarie) {
        throw new BadRequestException(
          "Vous êtes rattaché à cet établissement : vous ne pouvez pas y candidater en tant qu'indépendant.",
        );
      }
    }

    const existing = await this.prisma.booking.findFirst({
      where: { missionId, accountId: freelanceAccountId },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà candidaté à cette mission.');
    }

    const booking = await this.prisma.booking.create({
      data: {
        accountId: freelanceAccountId,
        missionId,
        status: BookingStatus.REQUESTED,
        scheduledAt: mission.startDate,
        totalAmount: mission.hourlyRate ?? undefined,
      },
    });

    await this.notifications.create(mission.account.ownerId, {
      type: 'MISSION_CANDIDATE',
      title: 'Nouvelle candidature',
      body: `Une candidature a été reçue pour « ${mission.title} ».`,
      link: `/dashboard/renforts#${missionId}`,
    });

    return booking;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Relance automatique des missions non pourvues
  // (consommé par MissionsScheduler — aucune de ces méthodes ne modifie le
  //  comportement des endpoints existants)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Palier de diffusion suivant dans la cascade SALARIES -> RESERVED -> PUBLIC,
   * ou `null` si la mission est déjà diffusée au niveau maximal.
   * Méthode statique : permet au scheduler de savoir s'il est utile d'appeler
   * `broaden()` sans avoir à dupliquer l'ordre de la cascade.
   */
  static visibiliteSuivante(visibilite: MissionVisibility): MissionVisibility | null {
    const idx = CASCADE.indexOf(visibilite);
    if (idx < 0 || idx >= CASCADE.length - 1) return null;
    return CASCADE[idx + 1];
  }

  /**
   * Missions encore « ouvertes » au sens de la relance automatique :
   * publiées (donc ni brouillon, ni pourvues, ni clôturées, ni annulées) et
   * dont la date de début n'est pas dépassée. Le résultat est borné par
   * `limite` pour ne jamais saturer un passage du scheduler.
   */
  async listerMissionsOuvertes(params: { limite?: number; maintenant?: Date } = {}) {
    const maintenant = params.maintenant ?? new Date();
    const limite = Math.max(1, Math.min(params.limite ?? 50, 500));
    return this.prisma.reliefMission.findMany({
      where: {
        status: MissionStatus.PUBLISHED,
        startDate: { gt: maintenant },
      },
      // Les missions les plus imminentes d'abord : ce sont les plus critiques.
      orderBy: { startDate: 'asc' },
      take: limite,
      select: {
        id: true,
        accountId: true,
        title: true,
        job: true,
        city: true,
        startDate: true,
        startTime: true,
        visibility: true,
        cibleDiffusion: true,
        modeAttribution: true,
        emergency: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        account: { select: { id: true, name: true, ownerId: true } },
      },
    });
  }

  /**
   * Relance : renvoie l'offre par e-mail aux intervenants correspondants.
   * Les comptes ayant déjà candidaté (ou déjà réservés) sur cette mission sont
   * exclus pour ne pas les re-solliciter inutilement — en pratique, seuls les
   * intervenants « nouvellement concernés » reçoivent l'e-mail.
   * Retourne le nombre d'intervenants notifiés.
   */
  async rediffuserAuxIntervenants(missionId: string, accountId: string): Promise<number> {
    const dejaEnLice = await this.prisma.booking.findMany({
      where: { missionId },
      select: { accountId: true },
    });
    return this.broadcastToMatched(missionId, accountId, {
      excludeAccountIds: dejaEnLice.map((b) => b.accountId),
    });
  }
}
