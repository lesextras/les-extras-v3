import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  EngagementStatut,
  MissionStatus,
  ModeAttribution,
  PointReason,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommunityService } from '../community/community.service';
import { MailService } from '../common/mail/mail.service';
import { CiblageService, SELECT_CIBLAGE } from './ciblage.service';

/**
 * LA FILE D'ENGAGEMENT.
 *
 * Le modèle historique — premier arrivé, premier servi — est le plus rapide
 * qui soit, et c'est ce qu'il faut pour un renfort de dernière minute. Mais il
 * force un arbitrage désagréable : pour que l'établissement garde la main sur
 * qui entre dans sa structure, il faut lui envoyer peu de profils, donc
 * restreindre la diffusion, donc réduire les chances de couvrir le besoin.
 *
 * La file d'engagement dénoue ce nœud. L'intervenant dit « je prends la
 * mission » : il s'engage réellement, dans l'ordre d'arrivée. Son profil part
 * à l'établissement, qui accepte ou refuse. En cas de refus, le suivant de la
 * file est présenté aussitôt, et ainsi de suite jusqu'à acceptation — et c'est
 * seulement là que le contrat d'engagement est émis.
 *
 * Ce que cela change concrètement : puisque l'établissement valide de toute
 * façon, on peut diffuser BEAUCOUP plus largement sans risque. Le matching
 * s'élargit (voir VAGUES_LARGES), la file se remplit, et l'établissement ne
 * trie jamais un tas de dossiers — il répond oui ou non à une personne à la
 * fois. C'est plus rapide pour lui, et plus clair pour les intervenants, qui
 * savent toujours à quelle place ils sont.
 *
 * Les deux modes coexistent : l'établissement choisit à la publication.
 */

/**
 * Délai au terme duquel un établissement qui n'a pas tranché est relancé.
 * Une mission urgente divise ce délai par trois — un profil qui attend une
 * réponse pendant que la date approche, c'est un intervenant perdu deux fois.
 */
export const DELAI_RELANCE_DECISION_MIN = 240;

/** Ce que l'écran a besoin de savoir sur chaque engagement. */
const INCLUDE_PROFIL = {
  account: {
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      logoUrl: true,
      points: true,
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          profile: {
            select: { job: true, city: true, bio: true, skills: true, hourlyRate: true },
          },
        },
      },
    },
  },
} satisfies Prisma.MissionEngagementInclude;

/** Statuts qui « occupent » la file : la personne est toujours en lice. */
const EN_LICE: EngagementStatut[] = [EngagementStatut.EN_ATTENTE, EngagementStatut.PRESENTE];

@Injectable()
export class EngagementsService {
  private readonly logger = new Logger(EngagementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly community: CommunityService,
    private readonly ciblage: CiblageService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────
  // Côté intervenant
  // ───────────────────────────────────────────────────────────────────────

  /**
   * « Je prends la mission » — l'intervenant s'engage.
   *
   * Ce n'est pas une candidature : c'est une prise de position ferme, datée,
   * qui lui donne un rang dans la file. Il n'y a donc pas de course perdue
   * d'avance — le deuxième arrivé n'a pas « raté » la mission, il attend son
   * tour, et il le sait.
   */
  async sengager(
    missionId: string,
    accountId: string,
    accountType?: string,
    message?: string,
  ) {
    if (accountType === 'ESTABLISHMENT') {
      throw new BadRequestException(
        'Seul un compte intervenant peut prendre une mission de renfort.',
      );
    }
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: {
        ...SELECT_CIBLAGE,
        title: true,
        status: true,
        startDate: true,
        modeAttribution: true,
        emergency: true,
        city: true,
        account: { select: { id: true, name: true, ownerId: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.modeAttribution !== ModeAttribution.FILE_ENGAGEMENT) {
      throw new BadRequestException(
        "Cette mission est attribuée au premier qui l'accepte : utilisez « Accepter cette mission ».",
      );
    }
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException("Cette mission n'est plus ouverte.");
    }
    if (mission.accountId === accountId) {
      throw new BadRequestException('Vous ne pouvez pas prendre votre propre mission.');
    }
    // Ciblage, cascade de diffusion et garde-fou salarié/employeur : la file
    // d'engagement n'appliquait que le premier des trois. Une mission
    // « réservée à mon équipe » y était donc prise par un inconnu, dont le
    // profil était présenté à la direction dans la foulée.
    await this.ciblage.assertReponseAutorisee(mission, accountId);

    const existant = await this.prisma.missionEngagement.findUnique({
      where: { missionId_accountId: { missionId, accountId } },
    });
    if (existant && EN_LICE.includes(existant.statut)) {
      throw new BadRequestException('Vous êtes déjà engagé·e sur cette mission.');
    }
    if (existant && existant.statut === EngagementStatut.REFUSE) {
      throw new BadRequestException(
        "L'établissement n'a pas retenu votre profil pour cette mission.",
      );
    }

    // Le rang se calcule sur TOUT l'historique de la file, retraits compris :
    // il note l'ordre d'arrivée, pas la position instantanée. Deux personnes
    // ne peuvent ainsi jamais porter le même numéro.
    const dejaVus = await this.prisma.missionEngagement.count({ where: { missionId } });
    const engagement = await this.prisma.missionEngagement.upsert({
      where: { missionId_accountId: { missionId, accountId } },
      create: {
        missionId,
        accountId,
        rang: dejaVus + 1,
        message: message?.trim() || null,
        statut: EngagementStatut.EN_ATTENTE,
      },
      update: {
        rang: dejaVus + 1,
        message: message?.trim() || null,
        statut: EngagementStatut.EN_ATTENTE,
        presenteAt: null,
        relanceAt: null,
        decideAt: null,
        motifRefus: null,
      },
    });

    // S'il n'y a personne devant, le profil part tout de suite.
    const presente = await this.presenterSuivant(missionId);
    const estPresente = presente?.id === engagement.id;

    const intervenant = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { owner: { select: { id: true, email: true } } },
    });
    const enFile = await this.prisma.missionEngagement.count({
      where: { missionId, statut: { in: EN_LICE } },
    });
    if (intervenant?.owner?.id) {
      await this.notifications
        .create(intervenant.owner.id, {
          type: 'ENGAGEMENT_ENREGISTRE',
          title: estPresente ? 'Votre profil est présenté' : 'Vous êtes dans la file',
          body: estPresente
            ? `Votre engagement sur « ${mission.title} » est transmis à l'établissement pour validation.`
            : `Vous êtes positionné·e sur « ${mission.title} ». Un profil est en cours de validation avant le vôtre.`,
          link: `/marketplace/missions/${missionId}`,
        })
        .catch(() => undefined);
      if (intervenant.owner.email) {
        await this.mail
          .sendEngagementEnregistre(intervenant.owner.email, {
            title: mission.title,
            missionId,
            rang: engagement.rang,
            presente: estPresente,
            date: mission.startDate,
          })
          .catch(() => undefined);
      }
    }

    return { engagement: { ...engagement, statut: estPresente ? EngagementStatut.PRESENTE : engagement.statut }, enFile, presente: estPresente };
  }

  /** L'intervenant se retire : rien ne l'engage tant qu'il n'a pas signé. */
  async retirer(missionId: string, accountId: string) {
    const engagement = await this.prisma.missionEngagement.findUnique({
      where: { missionId_accountId: { missionId, accountId } },
    });
    if (!engagement || !EN_LICE.includes(engagement.statut)) {
      throw new BadRequestException("Vous n'êtes pas engagé·e sur cette mission.");
    }
    await this.prisma.missionEngagement.update({
      where: { id: engagement.id },
      data: { statut: EngagementStatut.RETIRE, decideAt: new Date() },
    });
    // S'il était en cours de présentation, la file doit repartir tout de suite.
    if (engagement.statut === EngagementStatut.PRESENTE) {
      await this.presenterSuivant(missionId).catch(() => undefined);
    }
    return { retire: true };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Côté établissement
  // ───────────────────────────────────────────────────────────────────────

  /** La file d'une mission, dans l'ordre : le profil présenté d'abord. */
  async liste(missionId: string, etablissementAccountId: string) {
    await this.assertProprietaire(missionId, etablissementAccountId);
    const engagements = await this.prisma.missionEngagement.findMany({
      where: { missionId },
      orderBy: [{ rang: 'asc' }],
      include: INCLUDE_PROFIL,
    });
    const ordre: Record<EngagementStatut, number> = {
      PRESENTE: 0,
      EN_ATTENTE: 1,
      ACCEPTE: 2,
      REFUSE: 3,
      RETIRE: 4,
      CADUC: 5,
    };
    return engagements.sort(
      (a, b) => ordre[a.statut] - ordre[b.statut] || a.rang - b.rang,
    );
  }

  /**
   * L'établissement tranche sur le profil qui lui est présenté.
   *
   * En cas d'acceptation, tout se passe ici et seulement ici : la mission est
   * pourvue, la réservation confirmée, le contrat émis, les autres engagements
   * levés. C'est le seul endroit du code où une mission en file d'engagement
   * change de statut — un intervenant ne peut jamais se l'attribuer seul.
   */
  async decider(
    missionId: string,
    engagementId: string,
    etablissementAccountId: string,
    decision: 'ACCEPTE' | 'REFUSE',
    motif?: string,
  ) {
    const mission = await this.assertProprietaire(missionId, etablissementAccountId);
    const engagement = await this.prisma.missionEngagement.findFirst({
      where: { id: engagementId, missionId },
      include: INCLUDE_PROFIL,
    });
    if (!engagement) throw new NotFoundException('Engagement introuvable.');
    if (!EN_LICE.includes(engagement.statut)) {
      throw new BadRequestException('Cet engagement a déjà été traité.');
    }

    if (decision === 'REFUSE') {
      await this.prisma.missionEngagement.update({
        where: { id: engagement.id },
        data: {
          statut: EngagementStatut.REFUSE,
          decideAt: new Date(),
          motifRefus: motif?.trim() || null,
        },
      });
      await this.previenirEcarte(engagement, mission, motif?.trim() || null, false);
      const suivant = await this.presenterSuivant(missionId);
      if (!suivant) await this.previenirFileVide(missionId);
      return { refuse: true, suivantPresente: Boolean(suivant) };
    }

    // ── Acceptation ────────────────────────────────────────────────────────
    if (mission.status !== MissionStatus.PUBLISHED) {
      throw new BadRequestException("Cette mission n'est plus ouverte.");
    }
    const verrou = await this.prisma.reliefMission.updateMany({
      where: { id: missionId, status: MissionStatus.PUBLISHED },
      data: { status: MissionStatus.FILLED },
    });
    if (verrou.count === 0) {
      throw new BadRequestException('Cette mission a déjà été pourvue.');
    }

    const booking = await this.prisma.booking.create({
      data: {
        accountId: engagement.accountId,
        missionId,
        status: BookingStatus.CONFIRMED,
        scheduledAt: mission.startDate,
        totalAmount: mission.hourlyRate ?? undefined,
      },
    });
    await this.prisma.missionEngagement.update({
      where: { id: engagement.id },
      data: { statut: EngagementStatut.ACCEPTE, decideAt: new Date(), bookingId: booking.id },
    });
    // Les candidatures ouvertes et les autres engagements tombent ensemble.
    await this.prisma.booking.updateMany({
      where: { missionId, status: BookingStatus.REQUESTED, id: { not: booking.id } },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: 'Mission pourvue par un autre intervenant.',
      },
    });
    const caducs = await this.prisma.missionEngagement.findMany({
      where: { missionId, id: { not: engagement.id }, statut: { in: EN_LICE } },
      include: INCLUDE_PROFIL,
    });
    await this.prisma.missionEngagement.updateMany({
      where: { missionId, id: { not: engagement.id }, statut: { in: EN_LICE } },
      data: { statut: EngagementStatut.CADUC, decideAt: new Date() },
    });
    await Promise.allSettled(
      caducs.map((e) => this.previenirEcarte(e, mission, null, true)),
    );

    await this.community
      .crediter(engagement.accountId, PointReason.MISSION, `Mission acceptée : ${mission.title}`)
      .catch(() => undefined);

    const contractUrl = `/documents/contrat/${booking.id}`;
    const nom =
      [engagement.account?.owner?.firstName, engagement.account?.owner?.lastName]
        .filter(Boolean)
        .join(' ') ||
      engagement.account?.name ||
      'Un intervenant';

    // L'intervenant : c'est MAINTENANT qu'il est confirmé, pas avant.
    if (engagement.account?.owner?.id) {
      await this.notifications
        .create(engagement.account.owner.id, {
          type: 'MISSION_ACCEPTED',
          title: 'Mission confirmée',
          body: `L'établissement a validé votre profil pour « ${mission.title} ». Signez le contrat d'engagement.`,
          link: contractUrl,
        })
        .catch(() => undefined);
      if (engagement.account.owner.email) {
        await this.mail
          .sendMissionAcceptedFreelance(engagement.account.owner.email, {
            title: mission.title,
            city: mission.city,
            address: null,
            date: mission.startDate,
            time:
              mission.startTime && mission.endTime
                ? `${mission.startTime} – ${mission.endTime}`
                : (mission.startTime ?? null),
            contractUrl,
          })
          .catch(() => undefined);
      }
    }

    // L'établissement : confirmation + contrat.
    if (mission.account?.ownerId) {
      await this.notifications
        .create(mission.account.ownerId, {
          type: 'MISSION_FILLED',
          title: 'Mission pourvue',
          body: `Vous avez retenu ${nom} pour « ${mission.title} ». Contrat à signer.`,
          link: contractUrl,
        })
        .catch(() => undefined);
      const proprietaire = await this.prisma.user.findUnique({
        where: { id: mission.account.ownerId },
        select: { email: true },
      });
      if (proprietaire?.email) {
        await this.mail
          .sendMissionFilledEstablishment(proprietaire.email, {
            title: mission.title,
            freelanceName: nom,
            freelanceJob: engagement.account?.owner?.profile?.job ?? null,
            city: mission.city,
            date: mission.startDate,
            contractUrl,
          })
          .catch(() => undefined);
      }
    }

    return { booking, contractUrl, ecartes: caducs.length };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Mécanique de la file
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Présente à l'établissement le premier engagement en attente — sauf si un
   * profil est déjà soumis, auquel cas on ne fait rien : une seule personne
   * est examinée à la fois, c'est ce qui rend la décision rapide.
   * Retourne l'engagement actuellement présenté, ou `null` si la file est vide.
   */
  async presenterSuivant(missionId: string) {
    const dejaPresente = await this.prisma.missionEngagement.findFirst({
      where: { missionId, statut: EngagementStatut.PRESENTE },
      include: INCLUDE_PROFIL,
    });
    if (dejaPresente) return dejaPresente;

    const suivant = await this.prisma.missionEngagement.findFirst({
      where: { missionId, statut: EngagementStatut.EN_ATTENTE },
      orderBy: { rang: 'asc' },
      include: INCLUDE_PROFIL,
    });
    if (!suivant) return null;

    await this.prisma.missionEngagement.update({
      where: { id: suivant.id },
      data: { statut: EngagementStatut.PRESENTE, presenteAt: new Date(), relanceAt: null },
    });
    await this.notifierEtablissement(missionId, suivant, false);
    return { ...suivant, statut: EngagementStatut.PRESENTE };
  }

  /** Prévient l'établissement qu'un profil attend sa décision. */
  private async notifierEtablissement(
    missionId: string,
    engagement: Prisma.MissionEngagementGetPayload<{ include: typeof INCLUDE_PROFIL }>,
    relance: boolean,
  ) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: {
        title: true,
        city: true,
        startDate: true,
        account: { select: { ownerId: true } },
      },
    });
    if (!mission?.account?.ownerId) return;
    const nom =
      [engagement.account?.owner?.firstName, engagement.account?.owner?.lastName]
        .filter(Boolean)
        .join(' ') ||
      engagement.account?.name ||
      'Un intervenant';
    const enAttente = await this.prisma.missionEngagement.count({
      where: { missionId, statut: EngagementStatut.EN_ATTENTE },
    });

    await this.notifications
      .create(mission.account.ownerId, {
        type: 'ENGAGEMENT_A_VALIDER',
        title: relance ? 'Un profil attend votre réponse' : 'Un intervenant a pris votre mission',
        body: `${nom} s'est engagé·e sur « ${mission.title} ». Acceptez ou refusez son profil pour déclencher le contrat.`,
        link: `/dashboard/renforts#${missionId}`,
      })
      .catch(() => undefined);

    const proprietaire = await this.prisma.user.findUnique({
      where: { id: mission.account.ownerId },
      select: { email: true },
    });
    if (proprietaire?.email) {
      await this.mail
        .sendProfilAValider(proprietaire.email, {
          title: mission.title,
          freelanceName: nom,
          freelanceJob: engagement.account?.owner?.profile?.job ?? null,
          city: mission.city,
          date: mission.startDate,
          missionId,
          enAttente,
          message: engagement.message,
          relance,
        })
        .catch(() => undefined);
    }
  }

  /** Dit à un intervenant que son profil n'a pas été retenu — et pourquoi. */
  private async previenirEcarte(
    engagement: Prisma.MissionEngagementGetPayload<{ include: typeof INCLUDE_PROFIL }>,
    mission: { title: string; startDate: Date },
    motif: string | null,
    caduc: boolean,
  ) {
    const owner = engagement.account?.owner;
    if (!owner?.id) return;
    await this.notifications
      .create(owner.id, {
        type: 'ENGAGEMENT_ECARTE',
        title: caduc ? 'Mission attribuée à un autre' : 'Profil non retenu',
        body: caduc
          ? `« ${mission.title} » a été attribuée à un intervenant engagé avant vous. Vous êtes libre sur ce créneau.`
          : `L'établissement n'a pas retenu votre profil pour « ${mission.title} »${motif ? ` — ${motif}` : ''}.`,
        link: '/marketplace',
      })
      .catch(() => undefined);
    if (owner.email) {
      await this.mail
        .sendEngagementEcarte(owner.email, {
          title: mission.title,
          motif,
          caduc,
          date: mission.startDate,
        })
        .catch(() => undefined);
    }
  }

  /** File vidée après un refus : l'établissement doit savoir que ça repart. */
  private async previenirFileVide(missionId: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: {
        title: true,
        startDate: true,
        account: { select: { ownerId: true } },
      },
    });
    if (!mission?.account?.ownerId) return;
    const refuses = await this.prisma.missionEngagement.count({
      where: { missionId, statut: EngagementStatut.REFUSE },
    });
    await this.notifications
      .create(mission.account.ownerId, {
        type: 'ENGAGEMENT_FILE_VIDE',
        title: 'Plus personne en file',
        body: `« ${mission.title} » reste publiée et continue d'être proposée aux intervenants.`,
        link: `/dashboard/renforts#${missionId}`,
      })
      .catch(() => undefined);
    const proprietaire = await this.prisma.user.findUnique({
      where: { id: mission.account.ownerId },
      select: { email: true },
    });
    if (proprietaire?.email) {
      await this.mail
        .sendFileEpuisee(proprietaire.email, {
          title: mission.title,
          missionId,
          date: mission.startDate,
          refuses,
        })
        .catch(() => undefined);
    }
  }

  /**
   * Relance les établissements qui laissent un profil sans réponse.
   * Appelée par le planificateur de diffusion. Une seule relance par profil :
   * on informe, on ne harcèle pas — et on ne décide JAMAIS à leur place.
   */
  async relancerDecisionsEnAttente(): Promise<number> {
    const enSouffrance = await this.prisma.missionEngagement.findMany({
      where: {
        statut: EngagementStatut.PRESENTE,
        relanceAt: null,
        presenteAt: { not: null },
        mission: { status: MissionStatus.PUBLISHED },
      },
      include: { ...INCLUDE_PROFIL, mission: { select: { id: true, emergency: true } } },
      take: 100,
    });
    const maintenant = Date.now();
    let relances = 0;
    for (const e of enSouffrance) {
      const facteur = e.mission.emergency ? 3 : 1;
      const ecouleMin = (maintenant - e.presenteAt!.getTime()) / 60_000;
      if (ecouleMin < DELAI_RELANCE_DECISION_MIN / facteur) continue;
      try {
        await this.prisma.missionEngagement.update({
          where: { id: e.id },
          data: { relanceAt: new Date() },
        });
        await this.notifierEtablissement(e.mission.id, e, true);
        relances += 1;
      } catch (err) {
        this.logger.error(`Relance impossible pour l'engagement ${e.id}: ${err}`);
      }
    }
    return relances;
  }

  /** Vérifie que le compte appelant est bien l'établissement propriétaire. */
  private async assertProprietaire(missionId: string, accountId: string) {
    const mission = await this.prisma.reliefMission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        accountId: true,
        title: true,
        status: true,
        startDate: true,
        startTime: true,
        endTime: true,
        city: true,
        hourlyRate: true,
        modeAttribution: true,
        account: { select: { id: true, name: true, ownerId: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    if (mission.accountId !== accountId) {
      throw new ForbiddenException('Mission hors de votre compte.');
    }
    return mission;
  }
}
