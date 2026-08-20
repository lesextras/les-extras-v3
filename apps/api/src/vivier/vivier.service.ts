import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountType, BookingStatus, MissionVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * LE VIVIER D'INTERVENANTS.
 *
 * Un chef de service ne cherche pas d'abord « un éducateur » : il cherche
 * celui qui connaît déjà le groupe, la maison et le prénom des jeunes. Le
 * remplacement le moins coûteux est celui qu'on n'a pas à expliquer, et la
 * fidélisation d'une poignée d'intervenants vaut mieux qu'un catalogue de
 * mille inconnus.
 *
 * Le calcul existait déjà — `intervenantsConnus()` dans MissionsService liste
 * les comptes ayant travaillé pour l'établissement, et le palier RESERVED s'en
 * sert pour diffuser en priorité. Mais c'était un calcul privé : aucun écran
 * ne montrait ce vivier, personne ne pouvait y ajouter quelqu'un rencontré
 * ailleurs, et surtout rien ne permettait de rappeler une personne
 * nommément — il fallait republier une offre et espérer.
 *
 * Ce service réunit les deux moitiés : les habitués détectés automatiquement,
 * et les intervenants explicitement retenus. Puis il donne le geste qui
 * manquait : les rappeler.
 */
@Injectable()
export class VivierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Les comptes intervenants déjà venus travailler ici, avec le compte de
   * leurs interventions et la date de la dernière.
   *
   * Deux requêtes bornées, pas une par intervenant : cette liste s'affiche à
   * chaque ouverture de l'écran, et un établissement qui tourne peut avoir
   * plusieurs centaines de réservations derrière lui.
   */
  private async habitues(accountId: string): Promise<
    Map<string, { interventions: number; derniere: Date | null }>
  > {
    const [surMissions, surAteliers] = await Promise.all([
      // Renforts : l'intervenant est le compte qui a candidaté sur une mission
      // publiée par cet établissement.
      this.prisma.booking.findMany({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          mission: { accountId },
        },
        select: { accountId: true, scheduledAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
      // Ateliers : l'intervenant est le propriétaire de la fiche réservée.
      this.prisma.booking.findMany({
        where: {
          accountId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          service: { isNot: null },
        },
        select: {
          scheduledAt: true,
          createdAt: true,
          service: { select: { accountId: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
    ]);

    const compteur = new Map<string, { interventions: number; derniere: Date | null }>();
    const ajouter = (id: string | null | undefined, quand: Date | null) => {
      if (!id || id === accountId) return;
      const actuel = compteur.get(id) ?? { interventions: 0, derniere: null };
      actuel.interventions += 1;
      if (quand && (!actuel.derniere || quand > actuel.derniere)) actuel.derniere = quand;
      compteur.set(id, actuel);
    };

    surMissions.forEach((b) => ajouter(b.accountId, b.scheduledAt ?? b.createdAt));
    surAteliers.forEach((b) => ajouter(b.service?.accountId, b.scheduledAt ?? b.createdAt));
    return compteur;
  }

  /**
   * Le vivier complet : les retenus d'abord, les habitués ensuite.
   *
   * L'ordre n'est pas cosmétique. Ce que le responsable a choisi passe avant
   * ce que la machine a déduit — sinon l'écran devient un journal d'activité
   * de plus, alors qu'il doit être une liste de gens qu'on rappelle.
   */
  async liste(accountId: string) {
    const [retenus, compteur] = await Promise.all([
      this.prisma.poolMember.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        include: {
          intervenantAccount: {
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
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                  profile: {
                    select: { job: true, city: true, hourlyRate: true, available: true },
                  },
                },
              },
            },
          },
          addedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.habitues(accountId),
    ]);

    const idsRetenus = new Set(retenus.map((r) => r.intervenantAccountId));
    const idsHabitues = [...compteur.keys()].filter((id) => !idsRetenus.has(id));

    const comptesHabitues =
      idsHabitues.length === 0
        ? []
        : await this.prisma.account.findMany({
            where: { id: { in: idsHabitues }, type: AccountType.FREELANCE },
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
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                  profile: {
                    select: { job: true, city: true, hourlyRate: true, available: true },
                  },
                },
              },
            },
          });

    // Les notes reçues, pour toute la liste d'un coup. Une note moyenne dit
    // quelque chose qu'un compteur d'interventions ne dit pas.
    const tousLesProprios = [
      ...retenus.map((r) => r.intervenantAccount.owner?.id),
      ...comptesHabitues.map((c) => c.owner?.id),
    ].filter((id): id is string => Boolean(id));

    const notes =
      tousLesProprios.length === 0
        ? []
        : await this.prisma.review.groupBy({
            by: ['targetId'],
            where: { targetId: { in: tousLesProprios } },
            _avg: { rating: true },
            _count: { rating: true },
          });
    const noteParUser = new Map(
      notes.map((n) => [
        n.targetId,
        {
          moyenne: n._avg.rating != null ? Math.round(n._avg.rating * 10) / 10 : null,
          nombre: n._count.rating,
        },
      ]),
    );

    const enrichir = (
      compte: (typeof comptesHabitues)[number],
      retenu: { note: string | null; createdAt: Date; addedBy: { firstName: string | null; lastName: string | null } | null } | null,
    ) => {
      const stats = compteur.get(compte.id) ?? { interventions: 0, derniere: null };
      const note = compte.owner?.id ? noteParUser.get(compte.owner.id) : undefined;
      return {
        accountId: compte.id,
        nom: compte.name,
        slug: compte.slug,
        userId: compte.owner?.id ?? null,
        prenom: compte.owner?.firstName ?? null,
        nomPersonne: compte.owner?.lastName ?? null,
        email: compte.owner?.email ?? null,
        avatarUrl: compte.owner?.avatarUrl ?? null,
        metier: compte.owner?.profile?.job ?? null,
        ville: compte.owner?.profile?.city ?? compte.city ?? null,
        tauxHoraire: compte.owner?.profile?.hourlyRate ?? null,
        disponible: compte.owner?.profile?.available ?? null,
        interventions: stats.interventions,
        derniereIntervention: stats.derniere,
        noteMoyenne: note?.moyenne ?? null,
        nombreAvis: note?.nombre ?? 0,
        retenu: retenu !== null,
        noteInterne: retenu?.note ?? null,
        ajouteLe: retenu?.createdAt ?? null,
        ajoutePar: retenu?.addedBy
          ? [retenu.addedBy.firstName, retenu.addedBy.lastName].filter(Boolean).join(' ') || null
          : null,
      };
    };

    const items = [
      ...retenus.map((r) =>
        enrichir(r.intervenantAccount as never, {
          note: r.note,
          createdAt: r.createdAt,
          addedBy: r.addedBy,
        }),
      ),
      ...comptesHabitues
        .map((c) => enrichir(c, null))
        // Les habitués se classent par fréquence : celui qui est venu dix fois
        // avant celui qui est venu une fois.
        .sort((a, b) => b.interventions - a.interventions),
    ];

    return {
      items,
      retenus: retenus.length,
      habitues: comptesHabitues.length,
      total: items.length,
    };
  }

  /** Ajouter quelqu'un au vivier, ou mettre à jour la note de service. */
  async retenir(accountId: string, intervenantAccountId: string, userId: string, note?: string) {
    if (intervenantAccountId === accountId) {
      throw new BadRequestException('Un compte ne peut pas figurer dans son propre vivier.');
    }
    const intervenant = await this.prisma.account.findUnique({
      where: { id: intervenantAccountId },
      select: { id: true, type: true, name: true, ownerId: true },
    });
    if (!intervenant) throw new NotFoundException('Compte intervenant introuvable.');
    if (intervenant.type !== AccountType.FREELANCE) {
      throw new BadRequestException("Seul un compte intervenant peut entrer dans un vivier.");
    }

    const propre = note?.trim() || null;
    const entree = await this.prisma.poolMember.upsert({
      where: {
        accountId_intervenantAccountId: { accountId, intervenantAccountId },
      },
      create: { accountId, intervenantAccountId, note: propre, addedById: userId },
      // Une note absente ne veut pas dire « effacer la note » : le bouton
      // « Retenir » du board RenforTeam ne connait pas l'etat du vivier et
      // envoyait un champ vide qui ecrasait la note de service existante.
      update: { ...(propre !== null ? { note: propre } : {}) },
    });

    // L'intervenant est prévenu : c'est une bonne nouvelle pour lui, et c'est
    // aussi la transparence minimale — savoir qu'une structure vous a retenu.
    const etablissement = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { name: true },
    });
    await this.notifications
      .create(intervenant.ownerId, {
        type: 'VIVIER_AJOUT',
        title: 'Vous êtes dans un vivier',
        body: `${etablissement?.name ?? 'Un établissement'} vous a ajouté à ses intervenants habituels : ses besoins de renfort vous parviendront en priorité.`,
        link: '/dashboard/opportunites',
      })
      .catch(() => undefined);

    return entree;
  }

  /** Retirer du vivier. Les interventions passées, elles, restent des faits. */
  async retirer(accountId: string, intervenantAccountId: string) {
    const existant = await this.prisma.poolMember.findUnique({
      where: {
        accountId_intervenantAccountId: { accountId, intervenantAccountId },
      },
    });
    if (!existant) throw new NotFoundException('Cet intervenant ne figure pas dans votre vivier.');

    await this.prisma.poolMember.delete({ where: { id: existant.id } });
    // Aucune notification ici : annoncer un retrait n'apporte rien à personne
    // et transformerait une décision d'organisation en jugement personnel.
    return { retire: true };
  }

  /**
   * RAPPELER SON VIVIER SUR UNE MISSION.
   *
   * C'est le geste qui manquait, et c'est celui qui fait gagner du temps :
   * plutôt que publier une offre et attendre, on prévient nommément les trois
   * personnes qui connaissent déjà la maison.
   *
   * La mission doit appartenir à l'établissement, et rester au moins visible
   * du réseau réservé — inviter quelqu'un sur une offre qu'il ne peut pas voir
   * serait une impasse. Les intervenants ciblés doivent appartenir au vivier :
   * on ne transforme pas cette route en outil de démarchage.
   */
  async rappeler(
    accountId: string,
    missionId: string,
    intervenantAccountIds: string[],
  ): Promise<{ notifies: number; ignores: number }> {
    const mission = await this.prisma.reliefMission.findFirst({
      where: { id: missionId, accountId },
      select: {
        id: true,
        title: true,
        startDate: true,
        startTime: true,
        city: true,
        visibility: true,
        account: { select: { name: true } },
      },
    });
    if (!mission) throw new NotFoundException('Mission introuvable dans votre établissement.');

    if (mission.visibility === MissionVisibility.SALARIES) {
      throw new BadRequestException(
        "Cette mission n'est encore ouverte qu'à vos salariés. Élargissez la diffusion à votre réseau réservé avant d'y inviter des intervenants extérieurs.",
      );
    }

    // On ne rappelle que des gens du vivier — retenus ou habitués. Le contraire
    // ferait de cette route un canal de sollicitation vers n'importe qui.
    const { items } = await this.liste(accountId);
    const autorises = new Map(items.map((i) => [i.accountId, i]));
    const cibles = intervenantAccountIds.filter((id) => autorises.has(id));
    const ignores = intervenantAccountIds.length - cibles.length;

    if (cibles.length === 0) {
      throw new BadRequestException(
        'Aucun des intervenants désignés ne figure dans votre vivier.',
      );
    }

    const comptes = await this.prisma.account.findMany({
      where: { id: { in: cibles } },
      select: { id: true, ownerId: true },
    });

    const quand = mission.startDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
    const lieu = mission.city ? `, à ${mission.city}` : '';
    const heure = mission.startTime ? ` à partir de ${mission.startTime}` : '';

    const envois = await Promise.allSettled(
      comptes.map((c) =>
        this.notifications.create(c.ownerId, {
          type: 'VIVIER_RAPPEL',
          title: `${mission.account?.name ?? 'Un établissement'} vous sollicite`,
          body: `« ${mission.title} » ${quand}${heure}${lieu}. Vous êtes sollicité directement parce que vous connaissez déjà la structure.`,
          link: `/marketplace/missions/${mission.id}`,
        }),
      ),
    );

    return {
      notifies: envois.filter((e) => e.status === 'fulfilled').length,
      ignores,
    };
  }

  /**
   * Les identifiants du vivier, pour la diffusion en cascade.
   * `MissionsService` s'en sert pour le palier RESERVED : entrer dans un vivier
   * doit avoir une conséquence concrète — recevoir les offres en premier.
   */
  async identifiantsRetenus(accountId: string): Promise<string[]> {
    const lignes = await this.prisma.poolMember.findMany({
      where: { accountId },
      select: { intervenantAccountId: true },
    });
    return lignes.map((l) => l.intervenantAccountId);
  }

  /** Garde-fou : le vivier n'a de sens que pour un établissement. */
  assertEtablissement(type: AccountType) {
    if (type !== AccountType.ESTABLISHMENT) {
      throw new ForbiddenException('Le vivier est propre aux établissements.');
    }
  }
}
