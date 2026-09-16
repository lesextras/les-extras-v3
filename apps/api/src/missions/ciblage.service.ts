import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, CibleDiffusion, Interet, MissionVisibility } from '@prisma/client';
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

  /** Le compte qui répond est-il un compte de salarié ? */
  async estSalarie(accountId: string): Promise<boolean> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { profilSalarie: true },
    });
    return compte?.profilSalarie === true;
  }

  /**
   * LE SEUL POINT DE PASSAGE POUR RÉPONDRE À UNE MISSION.
   *
   * Il y a trois façons de répondre — candidater, accepter directement,
   * prendre rang dans la file d'engagement — et les règles n'avaient été
   * écrites que dans la première. Résultat constaté en production : une
   * mission publiée « réservée à mon équipe » était refusée à un inconnu sur
   * /candidate, et acceptée sur /accept et /sengager, contrat émis à l'appui.
   * La restriction que l'établissement croyait avoir posée ne tenait que sur
   * la voie qu'on avait pensé à protéger.
   *
   * Trois règles, appliquées ensemble et une seule fois :
   *  1. le ciblage nominatif (à qui l'annonce a été adressée) ;
   *  2. la cascade de diffusion (salariés, puis réseau connu, puis public) ;
   *  3. le garde-fou juridique : un salarié ne se facture pas en indépendant
   *     à son propre employeur — c'est du travail dissimulé, et la plateforme
   *     ne doit pas en être l'instrument.
   *  4. le montage : une mission de renfort est un REMPLACEMENT DE POSTE, elle
   *     se conclut en CDD. Qui a déclaré ne pas vouloir de CDD n'a rien à y
   *     faire.
   *
   * Toute nouvelle voie de réponse doit appeler CETTE méthode. Ne recopiez
   * pas les contrôles ailleurs : c'est précisément la recopie incomplète qui
   * avait ouvert la brèche.
   */
  async assertReponseAutorisee(mission: MissionCiblee, accountId: string): Promise<void> {
    await this.assertCiblageRespecte(mission, accountId);

    // Le compte qui répond est lu ICI, avant les paliers de diffusion, parce
    // que le premier palier a besoin de savoir s'il s'agit d'un salarié maison.
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { ownerId: true, profilSalarie: true, interets: true },
    });

    /**
     * ⚠ LE BESOIN CHOISIT LE MONTAGE, PAS LA PERSONNE.
     *
     * Une `ReliefMission` est un remplacement : quelqu'un manque sur un poste,
     * et cela ne se couvre qu'en CDD salarié (CE 11/02/2025, n° 491128 ;
     * LFSS 2025, art. 70). Intervenir EN PLUS, sur un besoin nommé, est une
     * autre chose — le « renfort personnalisé » — et cela passe par une fiche,
     * un devis et un contrat de prestation, pas par ici.
     *
     * Quelqu'un qui a déclaré vouloir seulement du renfort personnalisé est
     * donc refusé sur cette voie, et le message lui dit par où passer.
     *
     * ⚠ UNE LISTE VIDE NE REFUSE RIEN, ET C'EST ESSENTIEL. Tous les comptes
     * créés avant les centres d'intérêt l'ont vide : refuser sur une absence
     * de déclaration fermerait RenforTeam à tout le monde du jour au
     * lendemain. On ne restreint que sur un choix explicitement fait.
     */
    const interets = compte?.interets ?? [];
    if (interets.length > 0 && !interets.includes(Interet.RENFORT_CDD)) {
      throw new BadRequestException(
        'Un renfort se conclut en CDD avec l’établissement. Pour y répondre, cochez « être contacté pour des remplacements en CDD » dans votre espace — ou proposez un renfort personnalisé, qui se facture par votre structure.',
      );
    }
    const salarieMaison = compte?.ownerId
      ? await this.prisma.membership.findFirst({
          where: { accountId: mission.accountId, userId: compte.ownerId },
          select: { id: true },
        })
      : null;

    // ⚠ CE PALIER REFUSAIT TOUT LE MONDE, Y COMPRIS CEUX POUR QUI IL EXISTE.
    //
    // `SALARIES` est le premier cran de la cascade : l'annonce est proposée
    // pendant six heures à l'équipe avant de s'ouvrir. C'est aussi le choix par
    // défaut du formulaire SOS Renfort et du serveur. Mais le refus était
    // inconditionnel — il tombait avant la trentaine de lignes écrites plus
    // bas pour laisser précisément les salariés rattachés répondre. Personne ne
    // pouvait donc répondre à une mission pendant ses six premières heures :
    // ni l'équipe, à qui elle était adressée, ni les autres, à juste titre.
    //
    // Le refus ne vaut désormais que pour qui n'appartient pas à la maison.
    if (mission.visibility === MissionVisibility.SALARIES && !salarieMaison) {
      throw new BadRequestException(
        "Cette mission est réservée aux salariés de l'établissement pendant ses premières heures. Elle s'ouvrira plus largement si elle n'est pas pourvue.",
      );
    }
    // La cascade s'élargit, elle ne se rétrécit jamais : ce qui était ouvert
    // à l'équipe au premier palier le reste au second.
    if (mission.visibility === MissionVisibility.RESERVED && !salarieMaison) {
      const connus = await this.intervenantsConnus(mission.accountId);
      if (!connus.includes(accountId)) {
        throw new BadRequestException(
          "Cette mission est réservée au réseau de l'établissement pour l'instant. Elle s'ouvrira plus largement si elle n'est pas pourvue.",
        );
      }
    }

    if (compte?.ownerId) {
      const salarie = salarieMaison;

      // UN SALARIÉ NE RÉPOND QU'AUX BESOINS DE SA PROPRE MAISON.
      //
      // Ce qu'il fait là n'est pas de la prestation : ce sont des heures
      // supplémentaires chez son employeur, que l'établissement accepte ou
      // refuse ensuite, une par une. La relation de travail ne change pas,
      // elle s'allonge — et c'est pour cela que le rattachement, ici, ouvre
      // au lieu de fermer.
      //
      // Hors de sa maison, en revanche, il n'a rien à faire sur la place de
      // marché avec ce compte-là : intervenir ailleurs demande un compte
      // intervenant, qu'il reste libre d'ouvrir.
      if (compte.profilSalarie) {
        if (!salarie) {
          throw new BadRequestException(
            "Vous ne pouvez répondre qu'aux besoins de l'établissement qui vous emploie. Pour intervenir ailleurs, ouvrez un compte intervenant.",
          );
        }
        return;
      }

      // L'INDÉPENDANT, LUI, NE FACTURE PAS SON PROPRE EMPLOYEUR.
      // Le garde-fou d'origine reste entier pour lui : répondre en
      // prestataire à la maison qui vous salarie, c'est le terrain de la
      // requalification, et la plateforme ne doit pas en être l'instrument.
      if (salarie) {
        throw new BadRequestException(
          "Vous êtes rattaché à cet établissement : vous ne pouvez pas y répondre en tant qu'indépendant.",
        );
      }
    }
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
