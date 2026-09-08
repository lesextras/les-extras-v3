import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

/**
 * LES RÉPERTOIRES PUBLICS D'UN ORGANISME DE FORMATION.
 *
 * Une académie n'a pas à retaper ce que l'administration sait déjà. Deux
 * sources publiques, gratuites, sans clé :
 *
 *  1. LA RECHERCHE D'ENTREPRISES (annuaire-entreprises.data.gouv.fr) — le nom
 *     exact, le SIREN, le SIRET du siège, l'adresse, la forme juridique, la
 *     date de création, le code APE. C'est la même source que pour les
 *     associations ; on ne la restreint pas ici, parce qu'un organisme de
 *     formation peut être une association, une SARL, une SAS ou un
 *     entrepreneur individuel.
 *
 *  2. LA LISTE PUBLIQUE DES ORGANISMES DE FORMATION (DGEFP, jeu de données
 *     `liste-publique-des-of-v2`) — le NUMÉRO DE DÉCLARATION D'ACTIVITÉ, la
 *     région de la DREETS, les certifications Qualiopi effectivement
 *     détenues, les spécialités déclarées, la date de la dernière
 *     déclaration. C'est le registre officiel de l'article L. 6351-1 du code
 *     du travail.
 *
 * La deuxième source répond aussi quand elle ne trouve rien : ne pas être dans
 * la liste, c'est ne pas être déclaré — et ça, c'est l'étape 4 du chemin. On
 * le dit franchement plutôt que de laisser un champ vide sans explication.
 */

const API_ENTREPRISES = 'https://recherche-entreprises.api.gouv.fr/search';
const API_ORGANISMES =
  'https://dgefp.opendatasoft.com/api/explore/v2.1/catalog/datasets/liste-publique-des-of-v2/records';

/** Le code APE de la formation continue d'adultes : on le met en avant. */
export const APE_FORMATION = '85.59A';

interface EntrepriseBrute {
  nom_complet?: string;
  nom_raison_sociale?: string;
  sigle?: string | null;
  siren?: string;
  nature_juridique?: string;
  activite_principale?: string | null;
  date_creation?: string | null;
  etat_administratif?: string | null;
  siege?: {
    siret?: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
    activite_principale?: string | null;
    date_creation?: string | null;
  };
  complements?: { identifiant_association?: string | null; est_association?: boolean };
}

interface OrganismeBrut {
  numerodeclarationactivite?: string | null;
  denomination?: string | null;
  siren?: string | null;
  siretetablissementdeclarant?: string | null;
  adressephysiqueorganismeformation_voie?: string | null;
  adressephysiqueorganismeformation_codepostal?: string | null;
  adressephysiqueorganismeformation_ville?: string | null;
  reg_name?: string | null;
  dep_name?: string | null;
  certifications_actionsdeformation?: string | null;
  certifications_bilansdecompetences?: string | null;
  certifications_vae?: string | null;
  certifications_actionsdeformationparapprentissage?: string | null;
  informationsdeclarees_datedernieredeclaration?: string | null;
  informationsdeclarees_specialitesdeformation_libellespecialite1?: string | null;
  informationsdeclarees_specialitesdeformation_libellespecialite2?: string | null;
  informationsdeclarees_specialitesdeformation_libellespecialite3?: string | null;
  informationsdeclarees_effectifformateurs?: number | null;
  informationsdeclarees_nbstagiaires?: number | null;
}

/** Ce que la déclaration d'activité dit d'un organisme. */
export interface DeclarationPublique {
  /** Le numéro de déclaration d'activité (NDA), tel que la DGEFP le publie. */
  nda: string;
  /** La région dont dépend la DREETS. */
  region: string | null;
  departement: string | null;
  /** Les quatre certifications Qualiopi possibles, telles qu'elles sont déclarées. */
  qualiopi: {
    actionsDeFormation: boolean;
    bilansDeCompetences: boolean;
    vae: boolean;
    apprentissage: boolean;
  };
  /** Vrai dès qu'une des quatre certifications est détenue. */
  certifie: boolean;
  specialites: string[];
  derniereDeclaration: string | null;
  effectifFormateurs: number | null;
  stagiaires: number | null;
}

export interface OrganismePublic {
  nom: string;
  sigle: string | null;
  siren: string;
  siret: string | null;
  natureJuridique: string | null;
  ape: string | null;
  /** Vrai quand le code APE est celui de la formation continue d'adultes. */
  apeFormation: boolean;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  dateCreation: string | null;
  active: boolean;
  /** Le RNA, quand la structure est une association : elle peut être les deux. */
  rna: string | null;
  /** La déclaration d'activité, si l'organisme figure dans la liste publique. */
  declaration: DeclarationPublique | null;
}

@Injectable()
export class RepertoiresFormationService {
  private readonly logger = new Logger(RepertoiresFormationService.name);
  private readonly cache = new Map<string, { expire: number; valeur: unknown }>();

  /**
   * Chercher un organisme par son nom, son sigle, son SIREN ou son SIRET.
   *
   * On interroge d'abord la liste des organismes de formation : quand la
   * recherche y répond, ce sont les bons résultats, déjà déclarés. On complète
   * ensuite avec la recherche d'entreprises, pour ceux qui ne sont pas encore
   * déclarés — c'est justement leur cas le plus fréquent ici.
   */
  async rechercher(q: string): Promise<OrganismePublic[]> {
    const texte = (q ?? '').trim();
    if (texte.length < 3) {
      throw new BadRequestException('Indique au moins trois caractères : un nom, un SIREN ou un SIRET.');
    }

    const params = new URLSearchParams({ q: texte, per_page: '8', page: '1' });
    const brut = await this.appeler<{ results?: EntrepriseBrute[] }>(`${API_ENTREPRISES}?${params.toString()}`);
    const entreprises = (brut.results ?? [])
      .map((r) => this.normaliser(r))
      .filter((o): o is OrganismePublic => o !== null);

    if (!entreprises.length) return [];

    // Une seule requête pour toutes les déclarations : on demande les SIREN en lot.
    const declarations = await this.declarationsPour(entreprises.map((e) => e.siren));
    return entreprises
      .map((e) => ({ ...e, declaration: declarations.get(e.siren) ?? null }))
      .sort((a, b) => Number(Boolean(b.declaration)) - Number(Boolean(a.declaration)));
  }

  /** La fiche complète d'un organisme, par son SIREN, prête à pré-remplir. */
  async fiche(siren: string): Promise<OrganismePublic> {
    const propre = (siren ?? '').replace(/\s+/g, '');
    if (!/^\d{9}$/.test(propre)) throw new BadRequestException('Un numéro SIREN compte exactement neuf chiffres.');

    const params = new URLSearchParams({ q: propre, per_page: '3', page: '1' });
    const brut = await this.appeler<{ results?: EntrepriseBrute[] }>(`${API_ENTREPRISES}?${params.toString()}`);
    const trouvee = (brut.results ?? []).find((r) => r.siren === propre);
    const organisme = trouvee ? this.normaliser(trouvee) : null;
    if (!organisme) throw new NotFoundException('Aucune structure immatriculée ne porte ce numéro SIREN.');

    const declarations = await this.declarationsPour([propre]);
    return { ...organisme, declaration: declarations.get(propre) ?? null };
  }

  /* ----------------------------------------------------------------- outils */

  /** Les déclarations d'activité de plusieurs SIREN, en un seul appel. */
  private async declarationsPour(sirens: string[]): Promise<Map<string, DeclarationPublique>> {
    const propres = [...new Set(sirens.filter((s) => /^\d{9}$/.test(s)))];
    const trouvees = new Map<string, DeclarationPublique>();
    if (!propres.length) return trouvees;

    const where = propres.map((s) => `siren like "${s}"`).join(' or ');
    const params = new URLSearchParams({ where, limit: String(Math.min(50, propres.length * 4)) });

    let brut: { results?: OrganismeBrut[] };
    try {
      brut = await this.appeler<{ results?: OrganismeBrut[] }>(`${API_ORGANISMES}?${params.toString()}`);
    } catch {
      // La liste publique ne répond pas : on ne bloque pas la recherche pour autant.
      this.logger.warn("La liste publique des organismes de formation n'a pas répondu.");
      return trouvees;
    }

    for (const r of brut.results ?? []) {
      const siren = (r.siren ?? '').replace(/\s+/g, '');
      const nda = (r.numerodeclarationactivite ?? '').trim();
      if (!siren || !nda || trouvees.has(siren)) continue;

      const vrai = (v: string | null | undefined) => String(v ?? '').toLowerCase() === 'true';
      const qualiopi = {
        actionsDeFormation: vrai(r.certifications_actionsdeformation),
        bilansDeCompetences: vrai(r.certifications_bilansdecompetences),
        vae: vrai(r.certifications_vae),
        apprentissage: vrai(r.certifications_actionsdeformationparapprentissage),
      };

      trouvees.set(siren, {
        nda,
        region: r.reg_name ?? null,
        departement: r.dep_name ?? null,
        qualiopi,
        certifie: Object.values(qualiopi).some(Boolean),
        specialites: [
          r.informationsdeclarees_specialitesdeformation_libellespecialite1,
          r.informationsdeclarees_specialitesdeformation_libellespecialite2,
          r.informationsdeclarees_specialitesdeformation_libellespecialite3,
        ].filter((s): s is string => Boolean(s && s.trim())),
        derniereDeclaration: r.informationsdeclarees_datedernieredeclaration ?? null,
        effectifFormateurs: typeof r.informationsdeclarees_effectifformateurs === 'number' ? r.informationsdeclarees_effectifformateurs : null,
        stagiaires: typeof r.informationsdeclarees_nbstagiaires === 'number' ? r.informationsdeclarees_nbstagiaires : null,
      });
    }

    return trouvees;
  }

  private normaliser(r: EntrepriseBrute): OrganismePublic | null {
    if (!r.siren || (!r.nom_complet && !r.nom_raison_sociale)) return null;
    const ape = r.activite_principale ?? r.siege?.activite_principale ?? null;
    return {
      nom: r.nom_complet ?? r.nom_raison_sociale ?? 'Structure sans nom renseigné',
      sigle: r.sigle ?? null,
      siren: r.siren,
      siret: r.siege?.siret ?? null,
      natureJuridique: r.nature_juridique ?? null,
      ape,
      apeFormation: (ape ?? '').replace(/\s/g, '').toUpperCase() === APE_FORMATION.replace('.', ''),
      adresse: r.siege?.adresse ?? null,
      codePostal: r.siege?.code_postal ?? null,
      commune: r.siege?.libelle_commune ?? null,
      dateCreation: r.date_creation ?? r.siege?.date_creation ?? null,
      active: (r.etat_administratif ?? 'A') === 'A',
      rna: r.complements?.identifiant_association ?? null,
      declaration: null,
    };
  }

  private async appeler<T>(url: string): Promise<T> {
    const enCache = this.cache.get(url);
    if (enCache && enCache.expire > Date.now()) return enCache.valeur as T;

    const controleur = new AbortController();
    const minuterie = setTimeout(() => controleur.abort(), 8_000);
    try {
      const reponse = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'pilote.toulali.fr' },
        signal: controleur.signal,
      });
      if (!reponse.ok) {
        this.logger.warn(`Répertoires publics : HTTP ${reponse.status}`);
        throw new BadRequestException(
          'Le service public des données ne répond pas pour le moment. Réessaie dans quelques minutes.',
        );
      }
      const valeur = (await reponse.json()) as T;
      this.cache.set(url, { expire: Date.now() + 10 * 60_000, valeur });
      if (this.cache.size > 500) {
        const premiere = this.cache.keys().next().value;
        if (premiere) this.cache.delete(premiere);
      }
      return valeur;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      this.logger.warn(`Répertoires publics : ${(e as Error).message}`);
      throw new BadRequestException(
        'Le service public des données ne répond pas pour le moment. Réessaie dans quelques minutes.',
      );
    } finally {
      clearTimeout(minuterie);
    }
  }
}

/**
 * Ce que la déclaration publique permet de cocher dans la fiche d'une académie.
 *
 * On ne devine rien : un NDA prouve la déclaration d'activité, une
 * certification déclarée prouve Qualiopi. Le reste reste à renseigner.
 */
export function prerempliDepuis(o: OrganismePublic) {
  return {
    nom: o.nom,
    sigle: o.sigle,
    siren: o.siren,
    siret: o.siret,
    ape: o.ape,
    adresse: o.adresse,
    codePostal: o.codePostal,
    commune: o.commune,
    nda: o.declaration?.nda ?? null,
    dreets: o.declaration?.region ?? null,
    certifie: Boolean(o.declaration?.certifie),
  };
}
