import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AccountType, Interet, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { trouverDepartement, nomsDepartements } from '../common/territoires';
import { PIECES_POUR_CANDIDATER, piecesManquantes } from '../common/dossier';
import { DeclarerDisponibiliteDto, FiltresVivierDto } from './dto/disponibilite.dto';

/**
 * LE VIVIER OUVERT — les personnes qui se déclarent disponibles.
 *
 * ⚠⚠ CE N'EST PAS LE VIVIER QUI EXISTAIT DÉJÀ, ET LES DEUX NE DOIVENT PAS
 * ÊTRE FONDUS.
 *
 *   — `PoolMember` (module `vivier`) est le CARNET D'ADRESSES d'un
 *     établissement : les gens qu'il a déjà fait venir ou déjà réservés. C'est
 *     lui qui alimente le palier RESERVED de la cascade de diffusion.
 *   — Celui-ci est l'inverse : il est alimenté par les personnes elles-mêmes,
 *     et il est lu par des établissements qui ne les connaissent pas.
 *
 * Les mélanger remplirait « mes intervenants » de gens jamais rencontrés et
 * fausserait le ciblage des missions.
 *
 * ⚠ DEUX MONTAGES, ET LA LISTE LES AFFICHE PLUTÔT QUE DE LES GOMMER.
 *
 * Remplacer quelqu'un sur un poste ne se fait qu'en CDD salarié : le Conseil
 * d'État l'a tranché le 11/02/2025 (n° 491128). Intervenir EN PLUS, sur un
 * besoin nommé, est une prestation ordinaire facturée par la structure de
 * l'intervenant — c'est le « renfort personnalisé ».
 *
 * Ce n'est donc pas la personne qui choisit le montage, c'est le BESOIN. La
 * liste porte l'étiquette pour que l'établissement sache sur quoi il s'engage
 * avant d'écrire, et le libellé du bouton suit. On rend visible, on n'interdit
 * pas — même doctrine que les droits déclarés.
 *
 * ⚠ AUCUNE COORDONNÉE NE SORT D'ICI. Ni téléphone, ni e-mail, ni nom de
 * famille isolé : un profil, un métier, un territoire, et un lien vers la
 * messagerie. Les coordonnées s'ouvrent quand la demande est confirmée (voir
 * `conversations/masquage.ts`). Une liste de personnes avec leurs numéros
 * s'aspire en une après-midi, et c'est tout le modèle qui sort de la
 * plateforme avec elle.
 */
@Injectable()
export class DisponibilitesService {
  /**
   * ⚠ LA FRAÎCHEUR EST CE QUI FAIT VIVRE OU MOURIR CETTE LISTE.
   *
   * Une disponibilité vieille de plusieurs mois fait perdre son temps à
   * l'établissement, et il ne revient pas. Au-delà de ce délai sans
   * confirmation, la ligne passe en veille : elle sort de la liste sans être
   * supprimée, et revient d'un clic.
   */
  static readonly JOURS_AVANT_VEILLE = 45;

  /** On relance une fois, quelques jours avant la mise en veille. */
  static readonly JOURS_AVANT_RELANCE = 38;

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // CE QUE JE DÉCLARE
  // ---------------------------------------------------------------------------

  async moi(account: RequestAccount) {
    const compte = await this.prisma.account.findUnique({
      where: { id: account.id },
      select: { interets: true, disponibilite: true },
    });
    return {
      interets: compte?.interets ?? [],
      disponibilite: compte?.disponibilite ?? null,
      joursAvantVeille: DisponibilitesService.JOURS_AVANT_VEILLE,
    };
  }

  /**
   * Déclarer ses centres d'intérêt et, éventuellement, sa disponibilité.
   *
   * ⚠ APPELABLE PAR TOUT TYPE DE COMPTE SAUF UN ÉTABLISSEMENT. Un intervenant
   * indépendant s'y déclare, un particulier aussi — c'est précisément le
   * chemin par lequel quelqu'un qui n'a pas de structure vient proposer des
   * remplacements, et il est propre : un remplacement se fait en CDD, donc en
   * salarié, donc sans SIRET à fournir.
   */
  async declarer(account: RequestAccount, dto: DeclarerDisponibiliteDto) {
    if (account.type === AccountType.ESTABLISHMENT) {
      throw new BadRequestException(
        "Un compte d'établissement ne se déclare pas disponible : ce sont ses salariés qui le font depuis leur propre compte.",
      );
    }

    const interets = dto.interets ?? undefined;
    if (interets) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { interets: { set: interets } },
      });
    }

    // Rien d'autre à faire si l'écran n'envoyait que les centres d'intérêt.
    const toucheDisponibilite =
      dto.actif !== undefined ||
      dto.montages !== undefined ||
      dto.metier !== undefined ||
      dto.departements !== undefined ||
      dto.presentation !== undefined ||
      dto.aPartirDu !== undefined;
    if (!toucheDisponibilite) return this.moi(account);

    const declares = interets ?? (await this.interetsDuCompte(account.id));
    const montages = this.montagesRetenus(dto.montages, declares);
    const departements = this.departementsValides(dto.departements);

    /**
     * ⚠ UN CONSENTEMENT SANS MONTAGE N'EN EST PAS UN. Se rendre visible sans
     * dire sur quoi on est disponible produit une ligne que l'établissement
     * ne peut pas lire et sur laquelle il ne peut pas s'engager.
     */
    if (dto.actif === true && montages.length === 0) {
      throw new BadRequestException(
        'Indiquez au moins un type de mission avant de vous rendre visible : un remplacement en CDD, ou un renfort personnalisé.',
      );
    }

    const commun = {
      ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
      ...(dto.montages !== undefined ? { montages: { set: montages } } : {}),
      ...(dto.metier !== undefined ? { metier: dto.metier?.trim() || null } : {}),
      ...(dto.departements !== undefined ? { departements: { set: departements } } : {}),
      ...(dto.presentation !== undefined
        ? { presentation: dto.presentation?.trim() || null }
        : {}),
      ...(dto.aPartirDu !== undefined
        ? { aPartirDu: dto.aPartirDu ? new Date(dto.aPartirDu) : null }
        : {}),
    };

    await this.prisma.disponibiliteRenfort.upsert({
      where: { accountId: account.id },
      // Toute mise à jour vaut confirmation : quelqu'un qui vient de corriger
      // sa fiche est, par définition, toujours là.
      update: { ...commun, confirmeeLe: new Date(), enVeille: false, relanceeLe: null },
      create: {
        accountId: account.id,
        actif: dto.actif ?? false,
        montages: { set: montages },
        metier: dto.metier?.trim() || null,
        departements: { set: departements },
        presentation: dto.presentation?.trim() || null,
        aPartirDu: dto.aPartirDu ? new Date(dto.aPartirDu) : null,
      },
    });

    return this.moi(account);
  }

  /** « Toujours disponible » — d'un clic, depuis l'espace ou le courriel. */
  async confirmer(account: RequestAccount) {
    await this.prisma.disponibiliteRenfort.updateMany({
      where: { accountId: account.id },
      data: { confirmeeLe: new Date(), enVeille: false, relanceeLe: null },
    });
    return this.moi(account);
  }

  /**
   * Se retirer de la liste.
   *
   * ⚠ ON NE SUPPRIME PAS LA LIGNE, on éteint le consentement. Supprimer
   * effacerait le métier, le territoire et la présentation que la personne a
   * pris le temps d'écrire — et elle devrait tout refaire pour revenir trois
   * semaines plus tard. `actif: false` la rend invisible immédiatement, ce qui
   * est la seule chose qu'elle a demandée.
   */
  async retirer(account: RequestAccount) {
    await this.prisma.disponibiliteRenfort.updateMany({
      where: { accountId: account.id },
      data: { actif: false },
    });
    return this.moi(account);
  }

  // ---------------------------------------------------------------------------
  // CE QUE L'ÉTABLISSEMENT VOIT
  // ---------------------------------------------------------------------------

  /**
   * Le vivier ouvert.
   *
   * ⚠ RÉSERVÉ AUX ÉTABLISSEMENTS. Une liste de personnes en recherche de
   * vacations n'a pas à être feuilletée par un intervenant ou un particulier.
   * Depuis le 24/09/2026 (« 1 compte = 1 personne »), il n'y a plus de droit
   * déclaré à vérifier : le compte établissement actif suffit.
   */
  async vivier(account: RequestAccount, _user: RequestUser, filtres: FiltresVivierDto) {
    if (account.type !== AccountType.ESTABLISHMENT) {
      throw new ForbiddenException(
        'Le vivier est réservé aux établissements qui cherchent du renfort.',
      );
    }
    const where: Prisma.DisponibiliteRenfortWhereInput = {
      actif: true,
      enVeille: false,
      account: { type: { not: AccountType.ESTABLISHMENT } },
    };
    if (filtres.montage) where.montages = { has: filtres.montage };
    if (filtres.departement) {
      const d = trouverDepartement(filtres.departement);
      if (d) where.departements = { has: d.code };
    }
    if (filtres.metier?.trim()) {
      where.metier = { contains: filtres.metier.trim(), mode: 'insensitive' };
    }

    const lignes = await this.prisma.disponibiliteRenfort.findMany({
      where,
      orderBy: { confirmeeLe: 'desc' },
      take: 200,
      select: {
        id: true,
        montages: true,
        metier: true,
        departements: true,
        presentation: true,
        aPartirDu: true,
        confirmeeLe: true,
        account: {
          select: { id: true, name: true, type: true, slug: true, logoUrl: true, ownerId: true },
        },
      },
    });

    /**
     * LE DOSSIER DÉPOSÉ — en une requête pour toute la liste.
     *
     * ⚠ ON N'AFFICHE QUE LE COMPTE DES PIÈCES, JAMAIS LEUR CONTENU. Savoir que
     * les papiers sont prêts évite à l'établissement de découvrir trois
     * semaines de relances après l'accord ; ouvrir les pièces à quiconque
     * feuillette la liste ferait de cet écran un fichier de documents
     * d'identité.
     */
    const proprietaires = lignes.map((l) => l.account.ownerId);
    const comptes = lignes.map((l) => l.account.id);
    const pieces = proprietaires.length
      ? await this.prisma.complianceDocument.findMany({
          where: {
            userId: { in: proprietaires },
            accountId: { in: comptes },
            type: { in: PIECES_POUR_CANDIDATER },
          },
          select: { userId: true, accountId: true, type: true, fileId: true, fileUrl: true, issuedAt: true },
        })
      : [];

    return lignes.map((l) => ({
      id: l.id,
      accountId: l.account.id,
      nom: l.account.name,
      slug: l.account.slug,
      logoUrl: l.account.logoUrl,
      /**
       * ⚠ L'ÉTIQUETTE EST CALCULÉE ICI, PAS À L'ÉCRAN. Deux écrans qui
       * traduiraient chacun l'énumération finiraient par ne plus dire la même
       * chose du même montage juridique.
       */
      montages: l.montages.map((m) => ({ cle: m, libelle: LIBELLE_MONTAGE[m] })),
      metier: l.metier,
      departements: l.departements,
      territoire: nomsDepartements(l.departements).join(', ') || null,
      presentation: l.presentation,
      aPartirDu: l.aPartirDu,
      confirmeeLe: l.confirmeeLe,
      dossier: (() => {
        const siennes = pieces.filter(
          (p) => p.userId === l.account.ownerId && p.accountId === l.account.id,
        );
        const manquantes = piecesManquantes(siennes);
        return {
          deposees: PIECES_POUR_CANDIDATER.length - manquantes.length,
          total: PIECES_POUR_CANDIDATER.length,
          complet: manquantes.length === 0,
        };
      })(),
    }));
  }

  // ---------------------------------------------------------------------------
  // OUTILS
  // ---------------------------------------------------------------------------

  private async interetsDuCompte(accountId: string): Promise<Interet[]> {
    const c = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { interets: true },
    });
    return c?.interets ?? [];
  }

  /**
   * ON NE SE DÉCLARE DISPONIBLE QUE POUR CE QU'ON A DIT VOULOIR FAIRE.
   *
   * Et seuls deux intérêts sont des montages d'intervention : proposer des
   * ateliers ou des formations relève du catalogue, pas d'une disponibilité.
   */
  private montagesRetenus(demandes: Interet[] | undefined, declares: Interet[]): Interet[] {
    const possibles = [Interet.RENFORT_CDD, Interet.RENFORT_PERSONNALISE];
    const source = demandes ?? declares;
    return possibles.filter((m) => source.includes(m) && declares.includes(m));
  }

  /**
   * Les codes sont confrontés au référentiel plutôt qu'à une liste recopiée.
   * Un code inconnu est ignoré en silence : il ne mérite pas de faire échouer
   * une déclaration entière, et la personne verra tout de suite ce qui a été
   * retenu.
   */
  private departementsValides(codes: string[] | undefined): string[] {
    if (!codes?.length) return [];
    const vus = new Set<string>();
    for (const c of codes) {
      const d = trouverDepartement(c);
      if (d) vus.add(d.code);
    }
    return [...vus];
  }
}

/**
 * ⚠ LES DEUX LIBELLÉS DISENT LE MONTAGE, PAS LA MISSION.
 *
 * « Renfort » va désigner deux choses aux contrats opposés, et un chef de
 * service pressé ne lit pas, il clique. Les deux ne doivent donc jamais
 * s'afficher côte à côte sans leur montage écrit dessus.
 */
export const LIBELLE_MONTAGE: Record<Interet, string> = {
  [Interet.RENFORT_CDD]: 'Remplacement · CDD',
  [Interet.RENFORT_PERSONNALISE]: 'Renfort personnalisé · prestation',
  [Interet.ATELIERS]: 'Ateliers',
  [Interet.FORMATIONS]: 'Formations',
};
