import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, CibleDiffusion, MissionVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CIBLAGE DE LA DIFFUSION — à qui l'offre est adressée.
 *
 * Une place de marché qui ne sait pas restreindre ne sert qu'une fois. Le
 * premier réflexe d'un chef de service qui a besoin de quelqu'un demain matin
 * n'est pas de publier une annonce au monde entier : c'est d'appeler les trois
 * personnes qui connaissent déjà la maison. Tant que l'outil ne sait pas faire
 * ce geste-là, il est contourné par le téléphone — et il ne voit jamais passer
 * les besoins qu'il aurait pu couvrir.
 *
 * Ce service isole tout ce qui répond à la question « qui a le droit de voir,
 * et de prendre, cette mission ? ». Il est partagé par la diffusion
 * (MissionsService) et par la file d'engagement (EngagementsService) : une
 * seule vérité, appliquée à l'envoi comme à la réponse. Un ciblage qui ne
 * serait appliqué qu'à l'e-mail ne serait pas un ciblage, seulement une
 * politesse — n'importe qui muni du lien passerait à travers.
 */

/** Le strict nécessaire pour décider d'un ciblage. */
export interface MissionCiblee {
  id: string;
  accountId: string;
  orgUnitId: string | null;
  visibility: MissionVisibility;
  cibleDiffusion: CibleDiffusion;
  destinatairesSalaries: string[];
  destinatairesIntervenants: string[];
}

/** Champs à sélectionner pour obtenir une `MissionCiblee`. */
export const SELECT_CIBLAGE = {
  id: true,
  accountId: true,
  orgUnitId: true,
  visibility: true,
  cibleDiffusion: true,
  destinatairesSalaries: true,
  destinatairesIntervenants: true,
} as const;

@Injectable()
export class CiblageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Une mission est-elle adressée nominativement (donc non élargissable) ? */
  static estVerrouillee(cible: CibleDiffusion): boolean {
    return cible !== CibleDiffusion.RESEAU;
  }

  /**
   * Comptes d'intervenants déjà venus travailler pour cet établissement :
   * ils ont soit accepté une de ses missions, soit animé un de ses ateliers.
   * S'y ajoutent ceux que l'établissement a explicitement retenus au vivier.
   *
   * Le vivier CHOISI compte autant que le vivier déduit. C'est même là toute
   * la valeur du geste : quand un chef de service retient quelqu'un, il faut
   * que cela produise un effet — recevoir les offres en priorité. Sans cela,
   * ajouter au vivier ne serait qu'un signet.
   */
  async intervenantsConnus(accountId: string): Promise<string[]> {
    const retenus = await this.prisma.poolMember.findMany({
      where: { accountId },
      select: { intervenantAccountId: true },
    });

    const [surMissions, surAteliers] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          mission: { accountId },
        },
        select: { accountId: true },
        distinct: ['accountId'],
      }),
      this.prisma.booking.findMany({
        where: {
          accountId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          service: { isNot: null },
        },
        select: { service: { select: { accountId: true } } },
      }),
    ]);

    const ids = new Set<string>();
    retenus.forEach((r) => r.intervenantAccountId !== accountId && ids.add(r.intervenantAccountId));
    surMissions.forEach((b) => b.accountId !== accountId && ids.add(b.accountId));
    surAteliers.forEach((b) => b.service?.accountId && ids.add(b.service.accountId));
    return [...ids];
  }

  /**
   * Les SALARIÉS destinataires de l'offre (identifiants User), selon la cible.
   *
   * `UNITE` est la raison d'être de ce calcul : jusqu'ici, une mission portant
   * un `orgUnitId` était quand même poussée à toute la structure. Le champ
   * existait, l'écran le proposait, et rien n'en tenait compte — on demandait
   * à l'internat de couvrir un créneau du SESSAD.
   */
  async salariesDestinataires(mission: MissionCiblee): Promise<string[]> {
    if (mission.cibleDiffusion === CibleDiffusion.CONNUS) return [];

    if (mission.cibleDiffusion === CibleDiffusion.SELECTION) {
      if (mission.destinatairesSalaries.length === 0) return [];
      const membres = await this.prisma.membership.findMany({
        where: {
          accountId: mission.accountId,
          status: 'ACTIVE',
          userId: { in: mission.destinatairesSalaries },
        },
        select: { userId: true },
      });
      return membres.map((m) => m.userId);
    }

    const membres = await this.prisma.membership.findMany({
      where: {
        accountId: mission.accountId,
        status: 'ACTIVE',
        ...(mission.cibleDiffusion === CibleDiffusion.UNITE && mission.orgUnitId
          ? { orgUnitId: mission.orgUnitId }
          : {}),
      },
      select: { userId: true },
    });
    return membres.map((m) => m.userId);
  }

  /**
   * Les COMPTES intervenants autorisés, ou `null` quand aucune restriction
   * nominative ne s'applique (cible RESEAU : c'est la cascade qui décide).
   */
  async intervenantsAutorises(mission: MissionCiblee): Promise<Set<string> | null> {
    switch (mission.cibleDiffusion) {
      case CibleDiffusion.SELECTION:
        return new Set(mission.destinatairesIntervenants);
      case CibleDiffusion.CONNUS:
        return new Set(await this.intervenantsConnus(mission.accountId));
      case CibleDiffusion.UNITE:
        // Rien ne sort de la structure : la couverture est interne, point.
        return new Set<string>();
      default:
        return null;
    }
  }

  /**
   * Palier de visibilité imposé par la cible. `null` = la cascade habituelle
   * s'applique. Une mission adressée nominativement ne doit jamais apparaître
   * sur la marketplace publique : la restriction demandée est une promesse.
   */
  static palierImpose(mission: {
    cibleDiffusion: CibleDiffusion;
    destinatairesIntervenants: string[];
  }): MissionVisibility | null {
    switch (mission.cibleDiffusion) {
      case CibleDiffusion.CONNUS:
        return MissionVisibility.RESERVED;
      case CibleDiffusion.UNITE:
        return MissionVisibility.SALARIES;
      case CibleDiffusion.SELECTION:
        return mission.destinatairesIntervenants.length > 0
          ? MissionVisibility.RESERVED
          : MissionVisibility.SALARIES;
      default:
        return null;
    }
  }

  /**
   * Garde-fou appliqué à TOUTE réponse (candidature, acceptation directe,
   * engagement) : le compte fait-il partie des destinataires désignés ?
   *
   * Ne dit rien de la cascade classique — celle-ci reste gérée par les
   * méthodes appelantes, qui ont chacune leurs règles historiques.
   */
  async assertCiblageRespecte(mission: MissionCiblee, accountId: string): Promise<void> {
    if (mission.cibleDiffusion === CibleDiffusion.RESEAU) return;

    const autorises = await this.intervenantsAutorises(mission);
    if (autorises?.has(accountId)) return;

    // Un salarié désigné répond avec son compte personnel : on remonte au
    // propriétaire du compte pour le reconnaître.
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { ownerId: true },
    });
    if (compte?.ownerId) {
      const salaries = await this.salariesDestinataires(mission);
      if (salaries.includes(compte.ownerId)) return;
    }

    throw new BadRequestException(MESSAGE_HORS_CIBLE[mission.cibleDiffusion]);
  }
}

/** Ce qu'on dit à quelqu'un qui n'était pas destinataire. Sans jargon. */
const MESSAGE_HORS_CIBLE: Record<CibleDiffusion, string> = {
  [CibleDiffusion.RESEAU]: 'Cette mission ne vous est pas ouverte.',
  [CibleDiffusion.CONNUS]:
    "Cet établissement a réservé cette mission aux intervenants avec lesquels il a déjà travaillé.",
  [CibleDiffusion.UNITE]:
    "Cette mission est réservée aux salariés du service concerné dans l'établissement.",
  [CibleDiffusion.SELECTION]:
    "Cette mission a été adressée nominativement à quelques personnes : vous n'en faites pas partie.",
};
