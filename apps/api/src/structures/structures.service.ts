import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normaliserNom } from '../common/normaliser';
import { RequestAccount } from '../common/types/request-context';

/**
 * STRUCTURE — l'entité juridique qui possède un ou plusieurs établissements :
 * association, fondation, mairie, groupe.
 *
 * Le rattachement est DÉCLARATIF. Un compte dit à quelle structure il
 * appartient, comme on déclare son employeur sur un réseau professionnel :
 * rien n'est validé en amont, et c'est délibéré — une validation à l'entrée
 * fait chuter les inscriptions, et personne ici n'a les moyens humains de
 * valider chaque salarié qui arrive.
 *
 * Ce qui rend l'ouverture tenable, ce n'est pas le contrôle à l'entrée : c'est
 * que déclarer ne donne AUCUN droit. La visibilité vient du lien d'invitation
 * (voir `common/perimetre.ts`), jamais de ce qu'on a écrit dans un formulaire.
 */

/** L'annuaire public des entreprises — déjà utilisé par le module association. */
const API_RECHERCHE = 'https://recherche-entreprises.api.gouv.fr/search';

/** Quatorze chiffres, espaces déjà retirés. */
const SIRET = /^\d{14}$/;

/** Une entité trouvée dans l'annuaire public, réduite à ce qui nous sert. */
export interface EntiteLegale {
  nom: string;
  sigle: string | null;
  siren: string;
  /**
   * SIRET du siège — 14 chiffres. L'annuaire le renvoie, nous ne le lisions
   * pas, et c'est pourtant LUI qui s'imprime sur une facture : une facture
   * porte le SIRET de l'établissement émetteur, pas le SIREN de l'entité.
   */
  siret: string | null;
  formeJuridique: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
}

interface ResultatBrut {
  nom_raison_sociale?: string | null;
  nom_complet?: string | null;
  sigle?: string | null;
  siren?: string;
  nature_juridique?: string | null;
  siege?: {
    siret?: string | null;
    adresse?: string | null;
    libelle_commune?: string | null;
    code_postal?: string | null;
  } | null;
}

/**
 * Natures juridiques utiles ici. Bien plus large que le module association :
 * une structure peut être une association (92xx), une fondation, une commune ou
 * un établissement public (7xxx), une mutuelle, une société. On ne filtre donc
 * pas par nature — filtrer exclurait les mairies et les CCAS, qui gèrent
 * une bonne part des établissements du secteur.
 */
const LIBELLES_NATURE: Record<string, string> = {
  '7210': 'Commune',
  '7220': 'Département',
  '7230': 'Région',
  '7312': "Centre communal d'action sociale",
  '7321': 'Établissement public local social et médico-social',
  '7361': 'Établissement public national à caractère administratif',
  '9220': 'Association déclarée',
  '9230': "Association reconnue d'utilité publique",
  '9240': 'Congrégation',
  '9260': 'Association de droit local',
  '9300': 'Fondation',
  '5710': 'Société par actions simplifiée',
  '5499': 'Société à responsabilité limitée',
  '8110': 'Mutuelle',
};

@Injectable()
export class StructuresService {
  private readonly logger = new Logger(StructuresService.name);
  private readonly cache = new Map<string, { expire: number; valeur: unknown }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RECHERCHE DANS L'ANNUAIRE PUBLIC.
   *
   * C'est ce qui évite de faire saisir une raison sociale à la main : la
   * personne tape « Poidatz », choisit sa structure, et l'adresse, le SIREN et
   * la forme juridique viennent avec. Une structure saisie à la main reste
   * parfaitement valable — beaucoup de petites structures ne sont pas dans
   * l'annuaire, et les exclure reviendrait à les mettre dehors.
   */
  async rechercherEntite(q: string): Promise<EntiteLegale[]> {
    const texte = (q ?? '').trim();
    if (texte.length < 3) {
      throw new BadRequestException(
        'Indiquez au moins trois caractères : un nom, un SIREN ou un SIRET.',
      );
    }
    /**
     * ⚠ UN SIRET SE CHERCHE PAR SES NEUF PREMIERS CHIFFRES.
     *
     * L'annuaire indexe les entités légales par SIREN ; interrogé avec les
     * quatorze chiffres d'un SIRET, il ne rend rien. Or c'est le SIRET que les
     * gens ont sous la main — il est sur leur avis de situation, sur leurs
     * factures, et c'est celui qu'on leur demande partout ailleurs. On le
     * réduit donc ici plutôt que de leur répondre « aucun résultat ».
     */
    const recherche = SIRET.test(texte.replace(/\s+/g, ''))
      ? texte.replace(/\s+/g, '').slice(0, 9)
      : texte;
    const params = new URLSearchParams({ q: recherche, per_page: '10', page: '1' });
    const brut = await this.appeler<{ results?: ResultatBrut[] }>(
      `${API_RECHERCHE}?${params.toString()}`,
    );
    return (brut.results ?? [])
      .map((r) => this.normaliserEntite(r))
      .filter((e): e is EntiteLegale => e !== null);
  }

  private normaliserEntite(r: ResultatBrut): EntiteLegale | null {
    const nom = (r.nom_raison_sociale || r.nom_complet || '').trim();
    if (!nom || !r.siren) return null;
    const nature = r.nature_juridique ?? '';
    return {
      nom,
      sigle: r.sigle?.trim() || null,
      siren: r.siren,
      siret: r.siege?.siret?.trim() || null,
      formeJuridique: LIBELLES_NATURE[nature] ?? (nature || null),
      adresse: r.siege?.adresse?.trim() || null,
      ville: r.siege?.libelle_commune?.trim() || null,
      codePostal: r.siege?.code_postal?.trim() || null,
    };
  }

  /**
   * Recherche parmi les structures DÉJÀ déclarées sur la plateforme.
   *
   * Passe avant l'annuaire dans le parcours d'inscription : si dix
   * établissements d'un même groupe se sont déjà rattachés, le onzième doit
   * tomber sur la structure existante plutôt que d'en créer une douzième.
   */
  async rechercherDeclarees(q: string) {
    const texte = (q ?? '').trim();
    if (texte.length < 2) return [];
    return this.prisma.structure.findMany({
      where: {
        OR: [
          { nom: { contains: texte, mode: 'insensitive' } },
          { nomNormalise: { contains: normaliserNom(texte) } },
          { siren: texte.replace(/\s+/g, '') },
          { siret: texte.replace(/\s+/g, '') },
        ],
      },
      take: 10,
      orderBy: { nom: 'asc' },
      include: { _count: { select: { comptes: true } } },
    });
  }

  /**
   * Trouve ou crée la structure. Le SIREN fait foi quand il existe ; à défaut,
   * le nom normalisé. Une structure n'appartient à personne : plusieurs
   * établissements d'un même groupe partagent la même ligne, c'est tout
   * l'intérêt.
   */
  async trouverOuCreer(entree: {
    nom: string;
    siren?: string | null;
    siret?: string | null;
    formeJuridique?: string | null;
    adresse?: string | null;
    ville?: string | null;
    codePostal?: string | null;
    verifiee?: boolean;
  }) {
    const nom = (entree.nom ?? '').trim();
    if (nom.length < 2) {
      throw new BadRequestException('Le nom de la structure est trop court.');
    }
    const siret = (entree.siret ?? '').replace(/\s+/g, '') || null;
    if (siret && !SIRET.test(siret)) {
      throw new BadRequestException('Un numéro SIRET compte exactement quatorze chiffres.');
    }
    /**
     * ⚠ LE SIREN SE DÉDUIT DU SIRET, ET C'EST VOULU.
     *
     * Les gens ont leur SIRET sous la main, pas leur SIREN : il est sur l'avis
     * de situation, sur les factures, et c'est celui qu'on leur demande
     * partout. Les neuf premiers chiffres d'un SIRET SONT le SIREN — le
     * déduire évite de faire saisir deux numéros dont l'un est contenu dans
     * l'autre, et de les voir se contredire.
     */
    const siren =
      ((entree.siren ?? '').replace(/\s+/g, '') || siret?.slice(0, 9)) || null;
    if (siren && !/^\d{9}$/.test(siren)) {
      throw new BadRequestException('Un numéro SIREN compte exactement neuf chiffres.');
    }

    if (siren) {
      const parSiren = await this.prisma.structure.findUnique({ where: { siren } });
      if (parSiren) {
        // Même logique que pour le SIREN plus bas : on complète ce qui manque
        // plutôt que de laisser une fiche à moitié vide.
        if (siret && !parSiren.siret) {
          return this.prisma.structure.update({
            where: { id: parSiren.id },
            data: { siret },
          });
        }
        return parSiren;
      }
    }

    const nomNormalise = normaliserNom(nom);
    if (!nomNormalise) {
      throw new BadRequestException('Le nom de la structure doit contenir des lettres.');
    }
    const parNom = await this.prisma.structure.findUnique({ where: { nomNormalise } });
    if (parNom) {
      // Une structure trouvée par son nom et à qui il manque son SIREN gagne
      // celui qu'on vient d'apporter : on complète, on ne duplique pas.
      if ((siren && !parNom.siren) || (siret && !parNom.siret)) {
        return this.prisma.structure.update({
          where: { id: parNom.id },
          data: {
            ...(siren && !parNom.siren ? { siren } : {}),
            ...(siret && !parNom.siret ? { siret } : {}),
            verifiee: entree.verifiee ?? parNom.verifiee,
          },
        });
      }
      return parNom;
    }

    return this.prisma.structure.create({
      data: {
        nom,
        nomNormalise,
        siren,
        siret,
        formeJuridique: entree.formeJuridique ?? null,
        adresse: entree.adresse ?? null,
        ville: entree.ville ?? null,
        codePostal: entree.codePostal ?? null,
        verifiee: entree.verifiee ?? false,
      },
    });
  }

  /** Rattache le compte actif à une structure (déclaratif, réversible). */
  async rattacher(
    account: RequestAccount,
    dto: {
      structureId?: string;
      nom?: string;
      siren?: string;
      siret?: string;
      formeJuridique?: string;
      adresse?: string;
      ville?: string;
      codePostal?: string;
      verifiee?: boolean;
    },
  ) {
    let structureId = dto.structureId;

    if (!structureId) {
      if (!dto.nom) {
        throw new BadRequestException(
          'Indiquez une structure existante ou le nom de la vôtre.',
        );
      }
      const structure = await this.trouverOuCreer({
        nom: dto.nom,
        siren: dto.siren,
        siret: dto.siret,
        formeJuridique: dto.formeJuridique,
        adresse: dto.adresse,
        ville: dto.ville,
        codePostal: dto.codePostal,
        verifiee: dto.verifiee,
      });
      structureId = structure.id;
    } else {
      const existe = await this.prisma.structure.findUnique({ where: { id: structureId } });
      if (!existe) throw new NotFoundException('Structure introuvable.');
    }

    /**
     * ⚠ LE SIRET DESCEND SUR LE COMPTE, ET IL NE L'ÉCRASE JAMAIS.
     *
     * C'est `Account.siret` qui s'imprime sur les factures, les devis et les
     * contrats — pas celui de la structure. Un intervenant qui vient de
     * déclarer sa structure n'aurait sinon toujours rien sur ses documents,
     * et aurait à ressaisir le même numéro dans ses paramètres.
     *
     * On ne remplit que le vide : un compte qui portait déjà un SIRET l'a
     * reçu de quelqu'un qui l'a tapé, et une saisie humaine ne se corrige pas
     * toute seule au détour d'un rattachement.
     */
    const structure = await this.prisma.structure.findUnique({ where: { id: structureId } });
    const compte = await this.prisma.account.findUnique({
      where: { id: account.id },
      select: { siret: true },
    });
    const siretADescendre =
      structure?.siret && !compte?.siret?.trim() ? structure.siret : undefined;

    return this.prisma.account.update({
      where: { id: account.id },
      data: { structureId, ...(siretADescendre ? { siret: siretADescendre } : {}) },
      select: {
        id: true,
        name: true,
        siret: true,
        structure: true,
      },
    });
  }

  /** Détache le compte actif de sa structure. */
  async detacher(account: RequestAccount) {
    await this.prisma.account.update({
      where: { id: account.id },
      data: { structureId: null },
    });
    return { detache: true };
  }

  /**
   * La fiche d'une structure : ses établissements déclarés.
   *
   * ⚠ Volontairement pauvre. On liste les ÉTABLISSEMENTS (nom, ville), jamais
   * les personnes : l'organigramme nominatif d'un établissement se lit sur
   * l'établissement, avec la règle de périmètre qui lui est propre. Ouvrir ici
   * la liste des salariés de toute une fondation reviendrait à publier un
   * annuaire du secteur.
   */
  async fiche(id: string) {
    const structure = await this.prisma.structure.findUnique({
      where: { id },
      include: {
        comptes: {
          where: { type: 'ESTABLISHMENT' },
          select: { id: true, name: true, city: true, slug: true, logoUrl: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!structure) throw new NotFoundException('Structure introuvable.');
    return structure;
  }

  /** Appel HTTP avec cache court : l'annuaire public est lent et limité. */
  private async appeler<T>(url: string): Promise<T> {
    const enCache = this.cache.get(url);
    if (enCache && enCache.expire > Date.now()) return enCache.valeur as T;

    try {
      const reponse = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!reponse.ok) {
        throw new BadRequestException(
          "L'annuaire public des entreprises est momentanément indisponible. " +
            'Vous pouvez saisir votre structure à la main.',
        );
      }
      const valeur = (await reponse.json()) as T;
      this.cache.set(url, { expire: Date.now() + 5 * 60_000, valeur });
      return valeur;
    } catch (erreur) {
      if (erreur instanceof BadRequestException) throw erreur;
      this.logger.warn(`Annuaire des entreprises injoignable : ${String(erreur)}`);
      throw new BadRequestException(
        "L'annuaire public des entreprises est momentanément indisponible. " +
          'Vous pouvez saisir votre structure à la main.',
      );
    }
  }
}
