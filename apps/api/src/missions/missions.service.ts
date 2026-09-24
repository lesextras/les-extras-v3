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
import { CiblageService, palierEffectif } from './ciblage.service';
import { EngagementsService } from './engagements.service';
import { AuditService } from '../common/audit/audit.service';
import type { CandidatMissionInterne } from '../matching/matching.service';
import { envoyerFicheReservation } from '../bookings/fiche-reservation';
import { refuserPublicationTest } from '../common/donnees-test';

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

/**
 * Ordre de la diffusion en cascade : RESERVED -> PUBLIC.
 *
 * Le palier SALARIES (l'équipe interne d'abord) est retiré depuis le
 * 24/09/2026, « 1 compte = 1 personne » : il n'y a plus d'équipe interne. Une
 * mission ancienne qui le porterait encore est lue comme RESERVED
 * (`palierEffectif`).
 */
const CASCADE: MissionVisibility[] = [MissionVisibility.RESERVED, MissionVisibility.PUBLIC];

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
    /**
     * Journal d'audit — une diffusion qui n'atteint personne doit laisser une
     * trace consultable, pas seulement une ligne dans les logs du serveur.
     * Optionnel à la construction pour rester injectable dans les tests
     * unitaires qui n'exercent pas ce chemin.
     */
    private readonly audit?: AuditService,
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
        modeAttribution: dto.modeAttribution ?? ModeAttribution.AUTOMATIQUE,
        ...this.normaliserCiblage(dto),
      },
    });
  }

  /**
   * Nettoie le ciblage demandé pour qu'il soit cohérent tout seul, sans que
   * l'écran ait à y veiller. Une cible « sélection » sans intervenant coché ne
   * restreindrait rien du tout : on retombe alors sur la diffusion normale
   * plutôt que de publier une mission que personne ne recevrait.
   *
   * La cible « unité » et les salariés désignés n'existent plus (24/09/2026,
   * « 1 compte = 1 personne ») : `UNITE` retombe sur la diffusion normale, et
   * `destinatairesSalaries`, encore accepté par le DTO pour les anciens
   * écrans, n'est jamais lu.
   */
  private normaliserCiblage(dto: {
    cibleDiffusion?: CibleDiffusion;
    destinatairesIntervenants?: string[];
  }) {
    const intervenants = [...new Set(dto.destinatairesIntervenants ?? [])];
    let cible = dto.cibleDiffusion ?? CibleDiffusion.RESEAU;
    if (cible === CibleDiffusion.UNITE) cible = CibleDiffusion.RESEAU;
    if (cible === CibleDiffusion.SELECTION && intervenants.length === 0) {
      cible = CibleDiffusion.RESEAU;
    }
    return {
      cibleDiffusion: cible,
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
        // jointure, le board RenforTeam affichait « Candidatures recues (0) »
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
    // LE STATUT N'EST PAS NÉGOCIABLE PAR LA REQUÊTE.
    //
    // Il était pris dans `query.status` avec PUBLISHED pour simple défaut :
    // `?status=DRAFT` sortait donc les brouillons de TOUS les établissements —
    // besoins pas encore arbitrés, intitulés de poste, tarifs envisagés. Le
    // raisonnement est le même que pour `visibility` juste en dessous, qui
    // était déjà verrouillé : une requête peut restreindre ce qu'elle voit,
    // jamais l'élargir. La marketplace ne montre que ce qui est publié.
    const where: Prisma.ReliefMissionWhereInput = {
      status: MissionStatus.PUBLISHED,
      // ⚠ Les missions d'un compte ARCHIVÉ ne s'affichent plus. Archiver
      // retire de la vue, et une annonce reste une vue : proposer de
      // candidater chez un établissement qu'on a sorti des listes ferait
      // perdre son temps à quelqu'un, et le contrat n'aurait personne en face.
      account: { archivedAt: null },
    };
    // La cascade de diffusion s'applique aussi a la LECTURE. Une mission au
    // palier « reseau reserve » ne doit pas apparaitre sur la
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
    // Le palier RESERVED se lisait intégralement par son adresse directe : la
    // mission « réservée au réseau de l'établissement » se lisait par son
    // identifiant depuis n'importe quel compte. Le ciblage n'était appliqué
    // qu'à la RÉPONSE (`assertReponseAutorisee`) ; on l'applique désormais
    // aussi à la LECTURE, avec exactement la même définition du réseau, pour
    // qu'une seule règle décide de qui voit quoi.
    if (mission.status === MissionStatus.PUBLISHED) {
      // Une mission ancienne encore au palier SALARIES est lue comme RESERVED.
      const palier = palierEffectif(mission.visibility);
      const lisible =
        palier === MissionVisibility.PUBLIC ||
        (palier === MissionVisibility.RESERVED &&
          Boolean(accountId) &&
          (await this.lectureReserveeAutorisee(mission, accountId as string)));
      if (lisible) {
        const { bookings: _bookings, ...publicView } = mission as any;
        /**
         * ⚠ ON PRÉVIENT AVANT LE CLIC, ON NE REFUSE PLUS APRÈS.
         *
         * Deux règles réparables — le montage déclaré, le dossier déposé —
         * renvoyaient un refus au moment de candidater, sur un bouton qu'on
         * venait de proposer. L'écran reçoit maintenant la liste avec la
         * mission : il dit ce qui manque et où le réparer.
         *
         * Le refus serveur reste en place (`assertReponseAutorisee`) : c'est
         * lui qui fait foi, ceci n'est qu'une politesse.
         */
        const blocages = accountId
          ? await this.ciblage.blocagesReponse(mission as never, accountId)
          : [];
        return { ...publicView, blocages };
      }
    }
    // Brouillon, fermée, réservée au réseau d'un autre : on ne révèle pas son
    // existence.
    throw new NotFoundException('Mission introuvable.');
  }

  /**
   * Ce compte fait-il partie du réseau auquel la mission est réservée ?
   *
   * Même source que la réponse à une mission (CiblageService) : le ciblage
   * nominatif quand il y en a un, sinon les intervenants déjà venus dans la
   * structure. Une règle de lecture qui divergerait de la règle de réponse
   * finirait par montrer ce qu'on ne peut pas prendre, ou l'inverse.
   */
  private async lectureReserveeAutorisee(
    mission: {
      id: string;
      accountId: string;
      visibility: MissionVisibility;
      cibleDiffusion: CibleDiffusion;
      destinatairesIntervenants: string[];
    },
    accountId: string,
  ): Promise<boolean> {
    const nominatif = await this.ciblage.intervenantsAutorises(mission);
    if (nominatif) return nominatif.has(accountId);
    const connus = await this.ciblage.intervenantsConnus(mission.accountId);
    return connus.includes(accountId);
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
      dto.cibleDiffusion !== undefined || dto.destinatairesIntervenants !== undefined;
    // `orgUnitId` et `destinatairesSalaries` restent acceptés par le DTO pour
    // les anciens écrans, mais ne sont plus écrits (24/09/2026).
    const {
      cibleDiffusion: _c,
      destinatairesSalaries: _s,
      destinatairesIntervenants: _i,
      orgUnitId: _u,
      ...reste
    } = dto;
    return this.prisma.reliefMission.update({
      where: { id },
      data: {
        ...reste,
        ...(ciblageDemande
          ? this.normaliserCiblage({
              cibleDiffusion: dto.cibleDiffusion ?? mission.cibleDiffusion,
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
          ? 'Une personne a déjà candidaté à ce renfort : il ne peut plus être supprimé. Clôturez-le : elle en sera informée, et l’historique restera consultable.'
          : `${candidatures} personnes ont déjà candidaté à ce renfort : il ne peut plus être supprimé. Clôturez-le : elles en seront informées, et l’historique restera consultable.`,
      );
    }
    await this.prisma.reliefMission.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * CLÔTURER — la sortie que le message ci-dessus promettait.
   *
   * `remove()` disait « Clôturez-le » depuis le début, mais aucune route ne
   * permettait de le faire : ni `close`, ni `cancel`, et `UpdateMissionDto`
   * n'accepte pas `status`. Seul le back-office de la plateforme savait
   * dépublier. Une annonce annulée, pourvue par téléphone ou publiée par
   * erreur restait donc indéfiniment dans le tableau de bord, et l'outil
   * renvoyait l'établissement vers une action inexistante.
   *
   * La clôture ne détruit rien : la mission sort de la diffusion, les
   * candidatures encore en attente sont classées sans suite — et leurs
   * auteurs prévenus, parce que quelqu'un qui a pris le temps de répondre
   * mérite de savoir que c'est terminé — et tout l'historique reste lisible.
   * Ce qui a été confirmé (contrat, planning, facture) n'est pas touché.
   */
  async cloturer(id: string, accountId: string, motif?: string) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status === MissionStatus.CLOSED) {
      throw new BadRequestException('Ce renfort est déjà clôturé.');
    }

    const enAttente = await this.prisma.booking.findMany({
      where: { missionId: id, status: BookingStatus.REQUESTED },
      select: { id: true, account: { select: { ownerId: true } } },
    });

    await this.prisma.$transaction([
      this.prisma.reliefMission.update({
        where: { id },
        data: { status: MissionStatus.CLOSED },
      }),
      this.prisma.booking.updateMany({
        where: { missionId: id, status: BookingStatus.REQUESTED },
        data: {
          status: BookingStatus.CANCELLED,
          cancelReason: motif?.trim() || 'Le renfort a été clôturé par l’établissement.',
        },
      }),
    ]);

    // Une candidature laissée sans réponse, c'est ce qui fait qu'on ne revient
    // pas. On prévient, même quand la nouvelle est mauvaise.
    for (const b of enAttente) {
      if (!b.account?.ownerId) continue;
      await this.notifications
        .create(b.account.ownerId, {
          type: 'MISSION_CLOSED',
          title: 'Renfort clôturé',
          body: `« ${mission.title} » a été clôturé par l’établissement${
            motif?.trim() ? ` : ${motif.trim()}` : ''
          }. Votre candidature n’a pas de suite.`,
          link: '/dashboard/opportunites',
        })
        .catch(() => undefined);
    }

    // La file d'engagement se ferme avec la mission. Sans cet appel, les
    // intervenants EN_ATTENTE ou PRESENTE restaient engagés sur un besoin
    // clôturé, sans jamais être prévenus.
    const engagementsClos = await this.engagements
      .cloreLaFile(id, { title: mission.title, startDate: mission.startDate })
      .catch(() => 0);

    return {
      closed: true,
      candidaturesClassees: enAttente.length,
      engagementsClos,
    };
  }

  /**
   * Publie une mission : DRAFT -> PUBLISHED et démarre la cascade au palier
   * le plus restreint utile (RESERVED si l'établissement a un réseau connu,
   * sinon PUBLIC). L'établissement peut forcer un palier ; /broaden élargit
   * ensuite, et le planificateur élargit tout seul si la mission reste non
   * pourvue.
   *
   * La validation hiérarchique (un chef de service demande, la direction
   * approuve) est retirée depuis le 24/09/2026 : un compte, une personne.
   */
  async publish(id: string, accountId: string, visibiliteDemandee?: MissionVisibility) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status !== MissionStatus.DRAFT) {
      throw new BadRequestException('Seule une mission en brouillon peut être publiée.');
    }
    refuserPublicationTest(mission.title);
    // Un ciblage nominatif IMPOSE le palier : une mission adressée au seul
    // SESSAD, ou aux trois intervenants qu'on connaît, ne doit jamais se
    // retrouver sur la marketplace publique. La restriction demandée est une
    // promesse faite à l'établissement — elle prime sur tout le reste, y
    // compris sur une visibilité explicitement demandée par l'écran.
    const impose = CiblageService.palierImpose(mission);
    // Palier de départ : « mon réseau d'abord » si le compte a effectivement
    // des intervenants connus (vivier retenu ou déjà venus), sinon on
    // publierait dans le vide → diffusion publique immédiate. Un palier
    // SALARIES demandé par un ancien écran est lu comme RESERVED.
    const demande = visibiliteDemandee ? palierEffectif(visibiliteDemandee) : null;
    const palierDepart =
      impose ??
      demande ??
      ((await this.aUnReseauConnu(accountId)) ? MissionVisibility.RESERVED : MissionVisibility.PUBLIC);

    const published = await this.prisma.reliefMission.update({
      where: { id },
      data: {
        status: MissionStatus.PUBLISHED,
        visibility: palierDepart,
        publishedAt: new Date(),
      },
    });
    // Diffusion ciblée selon le palier. N'échoue jamais la publication — mais
    // ne se tait plus non plus : une diffusion muette, c'est un établissement
    // qui croit avoir lancé son RenforTeam alors que personne n'a rien reçu.
    // On journalise le résultat comme l'échec, et l'audit garde la trace.
    void this.broadcastToMatched(id, accountId)
      .then((notifies) => {
        this.logger.log(
          `Mission ${id} publiée (${palierDepart}) : ${notifies} destinataire(s) notifié(s).`,
        );
        if (notifies === 0) {
          void this.audit?.log({
            action: 'mission.diffusion.silencieuse',
            entityType: 'ReliefMission',
            entityId: id,
            accountId,
            summary: `Mission « ${published.title} » publiée : aucun destinataire notifié.`,
          });
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Mission ${id}, diffusion en échec après publication : ${message}`);
        void this.audit?.log({
          action: 'mission.diffusion.echec',
          entityType: 'ReliefMission',
          entityId: id,
          accountId,
          summary: `Diffusion en échec pour « ${published.title} » : ${message}`,
        });
      });
    return published;
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

  /** Le compte a-t-il un réseau connu pour alimenter le palier RESERVED ? */
  private async aUnReseauConnu(accountId: string): Promise<boolean> {
    const connus = await this.intervenantsConnus(accountId);
    return connus.length > 0;
  }

  /**
   * Les candidats à qui l'on peut RÉELLEMENT écrire, et l'alerte quand il n'y
   * en a aucun.
   *
   * La diffusion filtre sur l'adresse e-mail — sans adresse, pas d'envoi. Mais
   * si AUCUN candidat classé n'en porte, ce n'est pas un résultat métier :
   * c'est une panne. C'est exactement ce qui s'est produit en production, la
   * source des candidats ayant cessé de renvoyer l'adresse : RenforTeam ne
   * prévenait plus personne, sans la moindre erreur visible. On journalise
   * donc, bruyamment, plutôt que de rendre une liste vide l'air de rien.
   */
  private joignables(
    missionId: string,
    candidats: CandidatMissionInterne[],
  ): CandidatMissionInterne[] {
    const avecAdresse = candidats.filter((c) => Boolean(c.email));
    if (candidats.length > 0 && avecAdresse.length === 0) {
      const message =
        `Mission ${missionId}, diffusion impossible : ${candidats.length} candidat(s) classé(s), ` +
        `aucun avec adresse e-mail. La source des candidats ne renvoie plus l'adresse ` +
        `(voir MatchingService.candidatesForMissionInterne).`;
      this.logger.error(message);
      void this.audit?.log({
        action: 'mission.diffusion.aucun_destinataire',
        entityType: 'ReliefMission',
        entityId: missionId,
        summary: message,
        metadata: { candidats: candidats.length },
      });
    }
    return avecAdresse;
  }

  /**
   * Envoi d'une vague, et compte des e-mails RÉELLEMENT partis.
   *
   * `Promise.allSettled` n'échoue jamais : sans personne pour lire ses
   * résultats, un fournisseur d'envoi en panne passait pour un succès. On
   * compte donc les envois aboutis — et c'est ce nombre, pas la taille de la
   * liste visée, que la diffusion renvoie et journalise.
   */
  private async envoyerOffre(
    mission: {
      id: string;
      title: string;
      city: string | null;
      startDate: Date;
      job: string | null;
      hourlyRate: unknown;
      emergency: boolean;
    },
    destinataires: CandidatMissionInterne[],
    vague: number,
  ): Promise<number> {
    const resultats = await Promise.allSettled(
      destinataires.map((c) =>
        this.mail.sendMissionMatch(c.email as string, {
          title: mission.title,
          city: mission.city,
          date: mission.startDate,
          job: mission.job,
          rate: mission.hourlyRate ? String(mission.hourlyRate) : null,
          emergency: mission.emergency,
          missionId: mission.id,
          retenus: destinataires.length,
          vague,
        }),
      ),
    );
    const partis = resultats.filter((r) => r.status === 'fulfilled').length;
    const echecs = resultats.length - partis;
    if (echecs > 0) {
      this.logger.error(
        `Mission ${mission.id} : ${echecs} e-mail(s) de diffusion non partis sur ${resultats.length}.`,
      );
    }
    return partis;
  }

  private async broadcastToMatched(
    missionId: string,
    accountId: string,
    options?: { excludeAccountIds?: string[] },
  ): Promise<number> {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id: missionId } });
    if (!mission) return 0;

    // ── Cascade : le palier décide QUI est sollicité ───────────────────────
    // (une mission ancienne au palier SALARIES est traitée comme RESERVED)
    const palier = palierEffectif(mission.visibility);

    // Variante INTERNE du classement : elle seule porte l'adresse e-mail, et
    // elle ne sort jamais par une route HTTP (voir MatchingService).
    const { candidates } = await this.matching.candidatesForMissionInterne(missionId, accountId);
    const joignables = this.joignables(missionId, candidates);
    const exclus = new Set(options?.excludeAccountIds ?? []);

    // ── Ciblage nominatif : il prime sur la cascade ─────────────────────────
    // « Uniquement les gens que je connais » ou « uniquement ces personnes-là »
    // ne se négocie pas : on envoie à cette liste, une seule fois, et on
    // n'élargit jamais tout seul.
    const nominatif = await this.ciblage.intervenantsAutorises(mission);
    if (nominatif) {
      const destinataires = joignables.filter(
        (c) => nominatif.has(c.accountId) && !exclus.has(c.accountId),
      );
      const notifies = await this.envoyerOffre(mission, destinataires, 1);
      await this.prisma.reliefMission.update({
        where: { id: missionId },
        data: { diffusionVague: 1, derniereVagueAt: new Date() },
      });
      this.logger.log(
        `Mission ${missionId}, diffusion ciblée (${mission.cibleDiffusion}) : ${notifies} intervenant(s) notifié(s) sur ${destinataires.length} visé(s).`,
      );
      return notifies;
    }

    // Palier RESERVED : uniquement les intervenants déjà venus dans la structure.
    let autorises: Set<string> | null = null;
    if (palier === MissionVisibility.RESERVED) {
      autorises = new Set(await this.intervenantsConnus(accountId));
      // Programme de progression : les « Super Extra » (10 missions terminees,
      // note >= 4,5, annulations <= 5 %) sont sollicites des ce palier, avant
      // l'ouverture au reseau complet — c'est leur avantage d'acces prioritaire.
      const superExtras = await this.progression.superExtrasParmi(
        candidates.map((c) => c.accountId).filter((id) => !autorises!.has(id)),
      );
      for (const id of superExtras) autorises.add(id);
      if (autorises.size === 0) return 0; // pas de vivier : le planificateur élargira.
    }

    const eligibles = joignables.filter(
      (c) =>
        c.available &&
        !c.hasConflict &&
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
      .filter((c) => c.total >= seuil)
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

    const notifies = await this.envoyerOffre(mission, targets, vague);

    await this.prisma.reliefMission.update({
      where: { id: missionId },
      data: { diffusionVague: vague, derniereVagueAt: new Date() },
    });
    this.logger.log(
      `Mission ${missionId}, vague ${vague}/${vagues.length} : ${notifies} intervenant(s) notifié(s) sur ${targets.length} visé(s) (seuil ${seuil}).`,
    );
    return notifies;
  }

  /**
   * RenforTeam — un FREELANCE accepte la mission (premier arrivé, premier servi).
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
    // Les règles d'accès s'appliquent à la RÉPONSE autant qu'à l'envoi : sans
    // ce contrôle, n'importe qui muni du lien contournait la restriction et la
    // promesse faite à l'établissement ne valait rien. Vérifié AVANT le
    // renvoi vers la file d'engagement, qui referait sinon le même contrôle
    // trop tard.
    await this.ciblage.assertReponseAutorisee(mission, freelanceAccountId);
    if (mission.modeAttribution === ModeAttribution.FILE_ENGAGEMENT) {
      return this.engagements.sengager(missionId, freelanceAccountId, accountType);
    }

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

    // La mission est pourvue : les deux parties reçoivent la même fiche, avec
    // les coordonnées de l'autre. C'est de là que part la mise au point.
    await envoyerFicheReservation(this.prisma, this.mail, booking.id);

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
          time: mission.startTime && mission.endTime ? `${mission.startTime}, ${mission.endTime}` : mission.startTime ?? null,
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
        destinatairesIntervenants: true,
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
      const verrouillee = CiblageService.estVerrouillee(m);

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

  /** Élargit la diffusion d'un cran : RESERVED -> PUBLIC. */
  async broaden(id: string, accountId: string) {
    const mission = await this.assertOwned(id, accountId);
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException('La mission doit être publiée pour élargir sa diffusion.');
    }
    if (CiblageService.estVerrouillee(mission)) {
      throw new BadRequestException(
        "Cette mission a été adressée à des destinataires précis : sa diffusion ne s'élargit pas. Modifiez la mission pour l'ouvrir au réseau.",
      );
    }
    const idx = CASCADE.indexOf(palierEffectif(mission.visibility));
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
    // Qui a le droit de répondre : ciblage, cascade de diffusion et garde-fou
    // du compte géré. Vérifié AVANT de renvoyer vers l'autre mode : sinon
    // on confirmerait à un inconnu l'existence d'une mission qu'il n'a pas le
    // droit de voir (`GET /missions/:id` lui répond « introuvable »).
    await this.ciblage.assertReponseAutorisee(mission, freelanceAccountId);
    if (mission.modeAttribution === ModeAttribution.FILE_ENGAGEMENT) {
      throw new BadRequestException(
        'Sur cette mission, on ne candidate pas : cliquez sur « Je prends la mission ». Votre profil sera présenté à l’établissement pour validation.',
      );
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
   * Palier de diffusion suivant dans la cascade RESERVED -> PUBLIC,
   * ou `null` si la mission est déjà diffusée au niveau maximal.
   * Méthode statique : permet au scheduler de savoir s'il est utile d'appeler
   * `broaden()` sans avoir à dupliquer l'ordre de la cascade.
   */
  static visibiliteSuivante(visibilite: MissionVisibility): MissionVisibility | null {
    const idx = CASCADE.indexOf(palierEffectif(visibilite));
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
        destinatairesIntervenants: true,
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
