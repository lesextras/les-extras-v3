import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, CibleDiffusion, Interet, MissionVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PIECES_POUR_CANDIDATER, listerPieces, piecesManquantes } from '../common/dossier';

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

/**
 * UN COMPTE = UNE PERSONNE (24/09/2026, décision de Siham).
 *
 * Le palier `SALARIES` de la cascade, la cible `UNITE` et le versant
 * « salariés » de la cible `SELECTION` sont retirés : il n'y a plus d'équipe
 * interne à qui proposer un créneau. Les valeurs restent dans l'énumération
 * (aucune migration destructive), et une mission ancienne qui les porterait
 * encore est lue ainsi :
 *   - visibilité `SALARIES` → `RESERVED` (le réseau connu, jamais le public) ;
 *   - cible `UNITE`, ou `SELECTION` sans intervenant désigné → `RESEAU`.
 * La migration `20260924200000_un_compte_une_personne` fait la même chose en
 * base ; ces deux fonctions couvrent l'intervalle et les lignes oubliées.
 */
export function palierEffectif(visibilite: MissionVisibility): MissionVisibility {
  return visibilite === MissionVisibility.SALARIES ? MissionVisibility.RESERVED : visibilite;
}

export function cibleEffective(mission: {
  cibleDiffusion: CibleDiffusion;
  destinatairesIntervenants: string[];
}): CibleDiffusion {
  if (mission.cibleDiffusion === CibleDiffusion.UNITE) return CibleDiffusion.RESEAU;
  if (
    mission.cibleDiffusion === CibleDiffusion.SELECTION &&
    mission.destinatairesIntervenants.length === 0
  ) {
    return CibleDiffusion.RESEAU;
  }
  return mission.cibleDiffusion;
}

/** Le strict nécessaire pour décider d'un ciblage. */
export interface MissionCiblee {
  id: string;
  accountId: string;
  visibility: MissionVisibility;
  cibleDiffusion: CibleDiffusion;
  destinatairesIntervenants: string[];
}

/** Champs à sélectionner pour obtenir une `MissionCiblee`. */
export const SELECT_CIBLAGE = {
  id: true,
  accountId: true,
  visibility: true,
  cibleDiffusion: true,
  destinatairesIntervenants: true,
} as const;

@Injectable()
export class CiblageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Une mission est-elle adressée nominativement (donc non élargissable) ? */
  static estVerrouillee(mission: {
    cibleDiffusion: CibleDiffusion;
    destinatairesIntervenants: string[];
  }): boolean {
    return cibleEffective(mission) !== CibleDiffusion.RESEAU;
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
   * Les COMPTES intervenants autorisés, ou `null` quand aucune restriction
   * nominative ne s'applique (cible RESEAU : c'est la cascade qui décide).
   */
  async intervenantsAutorises(mission: MissionCiblee): Promise<Set<string> | null> {
    switch (cibleEffective(mission)) {
      case CibleDiffusion.SELECTION:
        return new Set(mission.destinatairesIntervenants);
      case CibleDiffusion.CONNUS:
        return new Set(await this.intervenantsConnus(mission.accountId));
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
    switch (cibleEffective(mission)) {
      case CibleDiffusion.CONNUS:
      case CibleDiffusion.SELECTION:
        return MissionVisibility.RESERVED;
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
    const cible = cibleEffective(mission);
    if (cible === CibleDiffusion.RESEAU) return;

    const autorises = await this.intervenantsAutorises(mission);
    if (autorises?.has(accountId)) return;

    throw new BadRequestException(MESSAGE_HORS_CIBLE[cible]);
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
   * Les règles, appliquées ensemble et une seule fois :
   *  1. le ciblage nominatif (à qui l'annonce a été adressée) ;
   *  2. la cascade de diffusion (réseau connu, puis public) ;
   *  3. le garde-fou juridique : on ne répond pas, en indépendant, à une
   *     mission publiée par un compte que l'on gère soi-même ;
   *  4. le montage : une mission de renfort est un REMPLACEMENT DE POSTE, elle
   *     se conclut en CDD. Qui a déclaré ne pas vouloir de CDD n'a rien à y
   *     faire.
   *  5. le dossier : on ne candidate pas à un poste auprès de publics
   *     vulnérables sans avoir déposé sa pièce d'identité et son bulletin n° 3.
   *
   * Toute nouvelle voie de réponse doit appeler CETTE méthode. Ne recopiez
   * pas les contrôles ailleurs : c'est précisément la recopie incomplète qui
   * avait ouvert la brèche.
   */
  async assertReponseAutorisee(mission: MissionCiblee, accountId: string): Promise<void> {
    await this.assertCiblageRespecte(mission, accountId);

    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { ownerId: true, interets: true },
    });

    /**
     * ⚠ LE BESOIN CHOISIT LE MONTAGE, PAS LA PERSONNE.
     *
     * Une `ReliefMission` est un remplacement : quelqu'un manque sur un poste,
     * et cela ne se couvre qu'en CDD salarié (CE 11/02/2025, n° 491128 ;
     * LFSS 2025, art. 70). Intervenir EN PLUS, sur un besoin nommé, est une
     * autre chose (le « renfort personnalisé ») et cela passe par une fiche,
     * un devis et un contrat de prestation, pas par ici.
     *
     * ⚠ UNE LISTE VIDE NE REFUSE RIEN, ET C'EST ESSENTIEL. Tous les comptes
     * créés avant les centres d'intérêt l'ont vide : refuser sur une absence
     * de déclaration fermerait RenforTeam à tout le monde du jour au
     * lendemain. On ne restreint que sur un choix explicitement fait.
     */
    const montage = CiblageService.blocageMontage(compte?.interets ?? []);
    if (montage) throw new BadRequestException(montage.message);

    // Palier réservé : le réseau connu de l'établissement seulement. Une
    // mission ancienne encore au palier SALARIES est lue comme RESERVED.
    if (palierEffectif(mission.visibility) === MissionVisibility.RESERVED) {
      const connus = await this.intervenantsConnus(mission.accountId);
      if (!connus.includes(accountId)) {
        throw new BadRequestException(
          "Cette mission est réservée au réseau de l'établissement pour l'instant. Elle s'ouvrira plus largement si elle n'est pas pourvue.",
        );
      }
    }

    if (compte?.ownerId) {
      // ON NE RÉPOND PAS À SA PROPRE MISSION PAR UN AUTRE COMPTE.
      //
      // Une même personne peut tenir un compte établissement et un compte
      // intervenant. Prendre, en indépendant, la mission que l'on a soi-même
      // publiée, c'est se facturer à soi-même : la plateforme ne doit pas en
      // être l'instrument. (Le cas « même compte » est refusé en amont.)
      const gereLeCompte = await this.prisma.membership.findFirst({
        where: { accountId: mission.accountId, userId: compte.ownerId },
        select: { id: true },
      });
      if (gereLeCompte) {
        throw new BadRequestException(
          "Vous gérez le compte qui publie cette mission : vous ne pouvez pas y répondre en tant qu'intervenant.",
        );
      }

      /**
       * LE DOSSIER, la cinquième règle.
       *
       * ⚠ ELLE S'APPLIQUE AUX COMPTES DÉJÀ EXISTANTS, contrairement à la règle
       * du montage juste au-dessus, qui ne mord que sur une déclaration
       * explicite. C'est assumé : une candidature sans pièces fait perdre
       * plusieurs jours à l'établissement, qui les réclame après coup. Le refus
       * doit donc dire exactement ce qui manque et où le déposer, sinon il se
       * lit comme une panne.
       */
      const dossier = await this.blocageDossier(accountId, compte.ownerId);
      if (dossier) throw new BadRequestException(dossier.message);
    }
  }

  /**
   * LES MÊMES RÈGLES, MAIS SANS REFUSER — POUR PRÉVENIR AVANT LE CLIC.
   *
   * ⚠⚠ UN VERROU QUI NE SE VOIT QU'APRÈS COUP SE LIT COMME UNE PANNE. Les deux
   * règles réparables — le montage déclaré et le dossier déposé — refusaient
   * une candidature au moment du clic, avec un message que personne n'avait
   * demandé. La personne avait lu l'annonce, décidé d'y aller, et recevait un
   * refus rouge sur une action qu'on lui proposait une seconde plus tôt.
   *
   * Elles sont donc calculées À LA LECTURE de la mission et renvoyées avec
   * elle : l'écran dit ce qui manque, où le réparer, et n'affiche pas un
   * bouton qui mène à un refus.
   *
   * ⚠ CE N'EST PAS UN SECOND JEU DE RÈGLES. `assertReponseAutorisee` reste le
   * seul point de passage qui REFUSE — le serveur fait foi, l'avertissement
   * n'est qu'une politesse. Les deux appellent les mêmes fonctions, et il faut
   * que ça continue : deux écritures de la même règle finissent toujours par
   * ne plus dire la même chose.
   *
   * ⚠ LES REFUS NON RÉPARABLES N'Y FIGURENT PAS. Le ciblage, les paliers de
   * cascade et le garde-fou du compte géré ne dépendent pas de la personne : ils
   * tombent d'eux-mêmes avec le temps, ou n'ont aucune réparation à proposer.
   * Les afficher transformerait l'écran en liste de reproches.
   */
  async blocagesReponse(
    _mission: MissionCiblee,
    accountId: string,
  ): Promise<BlocageReponse[]> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { ownerId: true, interets: true },
    });
    if (!compte) return [];

    const blocages: BlocageReponse[] = [];
    const montage = CiblageService.blocageMontage(compte.interets ?? []);
    if (montage) blocages.push(montage);

    if (compte.ownerId) {
      const dossier = await this.blocageDossier(accountId, compte.ownerId);
      if (dossier) blocages.push(dossier);
    }
    return blocages;
  }

  /**
   * LE MONTAGE DÉCLARÉ.
   *
   * ⚠ UNE LISTE VIDE NE BLOQUE RIEN, ici comme dans le refus. Tous les comptes
   * créés avant les centres d'intérêt l'ont vide.
   */
  private static blocageMontage(interets: Interet[]): BlocageReponse | null {
    if (interets.length === 0 || interets.includes(Interet.RENFORT_CDD)) return null;
    return {
      code: 'MONTAGE',
      titre: 'Ce renfort se conclut en CDD',
      message: 'Un renfort se conclut en CDD avec l’établissement. Pour y répondre, cochez « être contacté pour des remplacements en CDD » dans votre espace — ou proposez un renfort personnalisé, qui se facture par votre structure.',
      action: 'Modifier ce que je veux faire',
      href: '/dashboard/disponibilite',
    };
  }

  /** Les pièces exigées pour candidater — leur DÉPÔT, jamais leur contenu. */
  private async blocageDossier(
    accountId: string,
    ownerId: string,
  ): Promise<BlocageReponse | null> {
    const pieces = await this.prisma.complianceDocument.findMany({
      where: { userId: ownerId, accountId, type: { in: PIECES_POUR_CANDIDATER } },
      select: { type: true, fileId: true, fileUrl: true, issuedAt: true },
    });
    const manquantes = piecesManquantes(pieces);
    if (manquantes.length === 0) return null;
    return {
      code: 'DOSSIER',
      titre: 'Votre dossier n’est pas complet',
      message: `Déposez ${listerPieces(manquantes)} dans « Mon dossier » avant de candidater : l'établissement vous les demandera à l'embauche.`,
      action: 'Déposer mes pièces',
      href: '/dashboard/mon-dossier',
    };
  }
}

/**
 * Ce qui empêche de répondre, ET CE QU'ON PEUT Y FAIRE.
 *
 * `href` n'est pas décoratif : un avertissement qui nomme un écran sans y
 * mener oblige à chercher dans le menu, et c'est là qu'on abandonne.
 */
export interface BlocageReponse {
  code: 'MONTAGE' | 'DOSSIER';
  titre: string;
  message: string;
  action: string;
  href: string;
}

/** Ce qu'on dit à quelqu'un qui n'était pas destinataire. Sans jargon. */
const MESSAGE_HORS_CIBLE: Record<CibleDiffusion, string> = {
  [CibleDiffusion.RESEAU]: 'Cette mission ne vous est pas ouverte.',
  [CibleDiffusion.CONNUS]:
    "Cet établissement a réservé cette mission aux intervenants avec lesquels il a déjà travaillé.",
  // Valeur héritée, ramenée à RESEAU par `cibleEffective` : jamais affichée.
  [CibleDiffusion.UNITE]: 'Cette mission ne vous est pas ouverte.',
  [CibleDiffusion.SELECTION]:
    "Cette mission a été adressée nominativement à quelques personnes : vous n'en faites pas partie.",
};
