import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DISPOSITIFS,
  TYPES_DE_PIECES,
  VERSION_REFERENTIEL,
  type Dispositif,
  type TypeDePiece,
} from './referentiel-pieces';
import { ETAPES_CHEMIN, trouverEtape, type EtapeChemin } from './chemin';
import { CARTE_DES_OUTILS, LIBELLES_COUT } from './outils';

/**
 * LES DONNÉES PUBLIQUES D'UNE ASSOCIATION.
 *
 * L'API « Recherche d'entreprises » (data.gouv.fr) expose gratuitement, sans
 * clé, l'identité SIRENE de toute structure immatriculée, et pour les
 * associations le numéro RNA. C'est ce qui permet la promesse « jamais de page
 * vide » : ce que l'administration sait déjà est pré-rempli.
 *
 * L'appel se fait côté serveur, jamais depuis le navigateur, pour trois
 * raisons : ne pas exposer la personne à un service tiers, pouvoir mettre en
 * cache, et ne pas dépendre de la politique CORS d'un service qu'on ne
 * contrôle pas.
 */
const API_RECHERCHE = 'https://recherche-entreprises.api.gouv.fr/search';

/** Natures juridiques INSEE des associations et fondations (catégorie 92). */
const NATURES_ASSOCIATIVES = ['9210', '9220', '9221', '9222', '9223', '9230', '9260'];

const LIBELLES_NATURE: Record<string, string> = {
  '9210': 'Association non déclarée',
  '9220': 'Association déclarée',
  '9221': "Association déclarée d'insertion par l'économique",
  '9222': 'Association intermédiaire',
  '9223': 'Groupement d\'employeurs',
  '9230': "Association déclarée reconnue d'utilité publique",
  '9260': 'Association de droit local (Alsace-Moselle)',
};

const LIBELLES_EFFECTIF: Record<string, string> = {
  NN: 'Effectif non renseigné',
  '00': 'Aucun salarié',
  '01': '1 ou 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
};

export interface AssociationPublique {
  nom: string;
  sigle: string | null;
  siren: string;
  siret: string | null;
  rna: string | null;
  natureJuridique: string;
  natureLibelle: string;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  dateCreation: string | null;
  trancheEffectif: string | null;
  effectifLibelle: string | null;
  ess: boolean;
  active: boolean;
}

interface ResultatBrut {
  nom_complet?: string;
  nom_raison_sociale?: string;
  sigle?: string | null;
  siren?: string;
  nature_juridique?: string;
  date_creation?: string | null;
  tranche_effectif_salarie?: string | null;
  etat_administratif?: string | null;
  siege?: {
    siret?: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
    date_creation?: string | null;
  };
  complements?: {
    identifiant_association?: string | null;
    est_association?: boolean;
    est_ess?: boolean;
  };
}

export interface PieceDeduite {
  type: TypeDePiece;
  /** 'DEDUITE' : les données publiques la prouvent. 'A_DEPOSER' : à fournir. */
  etat: 'DEDUITE' | 'A_DEPOSER';
  /** Ce que les données publiques disent, quand elles disent quelque chose. */
  preuve?: string;
}

export interface CompletudeDispositif {
  dispositif: Dispositif;
  exigees: number;
  deduites: number;
  manquantes: TypeDePiece[];
  /** Part des pièces exigées déjà prouvées par les données publiques. */
  pourcentage: number;
}

@Injectable()
export class AssociationService {
  private readonly logger = new Logger(AssociationService.name);
  private readonly cache = new Map<string, { expire: number; valeur: unknown }>();

  /** Recherche par nom, sigle, SIREN, SIRET ou RNA, limitée aux associations. */
  async rechercher(q: string): Promise<AssociationPublique[]> {
    const texte = (q ?? '').trim();
    if (texte.length < 3) {
      throw new BadRequestException('Indiquez au moins trois caractères : un nom, un SIREN ou un numéro RNA.');
    }
    const params = new URLSearchParams({
      q: texte,
      nature_juridique: NATURES_ASSOCIATIVES.join(','),
      per_page: '8',
      page: '1',
    });
    const brut = await this.appeler<{ results?: ResultatBrut[] }>(`${API_RECHERCHE}?${params.toString()}`);
    return (brut.results ?? []).map((r) => this.normaliser(r)).filter((a): a is AssociationPublique => a !== null);
  }

  /** La fiche d'une association par son SIREN, avec son classeur déduit. */
  async fiche(siren: string) {
    const propre = (siren ?? '').replace(/\s+/g, '');
    if (!/^\d{9}$/.test(propre)) {
      throw new BadRequestException('Un numéro SIREN compte exactement neuf chiffres.');
    }
    const params = new URLSearchParams({ q: propre, per_page: '3', page: '1' });
    const brut = await this.appeler<{ results?: ResultatBrut[] }>(`${API_RECHERCHE}?${params.toString()}`);
    const trouvee = (brut.results ?? []).find((r) => r.siren === propre);
    const association = trouvee ? this.normaliser(trouvee) : null;
    if (!association) {
      throw new NotFoundException("Aucune association immatriculée ne porte ce numéro SIREN.");
    }
    const classeur = this.deduireClasseur(association);
    const completude = DISPOSITIFS.map((d) => this.completude(d, classeur));
    return {
      association,
      classeur,
      completude,
      versionReferentiel: VERSION_REFERENTIEL,
      /** La liste des étapes du chemin que les données publiques permettent de cocher. */
      etapesVerifiees: ETAPES_CHEMIN.filter(
        (e) => (e.verifiableAvec === 'RNA' && association.rna) || (e.verifiableAvec === 'SIRENE' && association.siret),
      ).map((e) => ({ numero: e.numero, slug: e.slug, titre: e.titre })),
    };
  }

  referentiel() {
    return { version: VERSION_REFERENTIEL, pieces: TYPES_DE_PIECES, dispositifs: DISPOSITIFS };
  }

  chemin(): { etapes: EtapeChemin[]; total: number } {
    return { etapes: [...ETAPES_CHEMIN], total: ETAPES_CHEMIN.length };
  }

  etape(slugOuNumero: string) {
    const e = trouverEtape(slugOuNumero);
    if (!e) throw new NotFoundException("Cette étape n'existe pas.");
    const precedente = ETAPES_CHEMIN.find((x) => x.numero === e.numero - 1) ?? null;
    const suivante = ETAPES_CHEMIN.find((x) => x.numero === e.numero + 1) ?? null;
    const pieces = e.piecesAjoutees
      .map((code) => TYPES_DE_PIECES.find((t) => t.code === code))
      .filter((t): t is TypeDePiece => Boolean(t));
    return {
      etape: e,
      pieces,
      total: ETAPES_CHEMIN.length,
      precedente: precedente ? { numero: precedente.numero, slug: precedente.slug, titre: precedente.titre } : null,
      suivante: suivante ? { numero: suivante.numero, slug: suivante.slug, titre: suivante.titre } : null,
    };
  }

  outils() {
    return { besoins: CARTE_DES_OUTILS, libellesCout: LIBELLES_COUT };
  }

  // ---------------------------------------------------------------------------

  private normaliser(r: ResultatBrut): AssociationPublique | null {
    // Le service renvoie parfois une coquille vide (structure non diffusible) : on l'ignore.
    if (!r.siren || (!r.nom_complet && !r.nom_raison_sociale) || !r.nature_juridique) return null;
    const nature = r.nature_juridique ?? '';
    const effectif = r.tranche_effectif_salarie ?? null;
    return {
      nom: r.nom_complet ?? r.nom_raison_sociale ?? 'Association sans nom renseigné',
      sigle: r.sigle ?? null,
      siren: r.siren,
      siret: r.siege?.siret ?? null,
      rna: r.complements?.identifiant_association ?? null,
      natureJuridique: nature,
      natureLibelle: LIBELLES_NATURE[nature] ?? (r.complements?.est_association ? 'Association' : 'Structure'),
      adresse: r.siege?.adresse ?? null,
      codePostal: r.siege?.code_postal ?? null,
      commune: r.siege?.libelle_commune ?? null,
      dateCreation: r.date_creation ?? r.siege?.date_creation ?? null,
      trancheEffectif: effectif,
      effectifLibelle: effectif ? (LIBELLES_EFFECTIF[effectif] ?? null) : null,
      ess: Boolean(r.complements?.est_ess),
      active: (r.etat_administratif ?? 'A') === 'A',
    };
  }

  /**
   * Le classeur déduit : ce que les données publiques prouvent sans qu'on
   * dépose quoi que ce soit. Un numéro RNA prouve la déclaration en
   * préfecture et la parution au Journal officiel ; un SIRET prouve
   * l'immatriculation. Tout le reste est à fournir.
   */
  private deduireClasseur(a: AssociationPublique): PieceDeduite[] {
    return TYPES_DE_PIECES.map((type) => {
      if (type.deductible === 'RNA' && a.rna) {
        return { type, etat: 'DEDUITE', preuve: `Numéro RNA ${a.rna}` };
      }
      if (type.deductible === 'SIRENE' && a.siret) {
        return { type, etat: 'DEDUITE', preuve: `SIRET ${a.siret}` };
      }
      return { type, etat: 'A_DEPOSER' };
    });
  }

  private completude(d: Dispositif, classeur: PieceDeduite[]): CompletudeDispositif {
    const exigees = d.piecesExigees
      .map((code) => classeur.find((p) => p.type.code === code))
      .filter((p): p is PieceDeduite => Boolean(p));
    const deduites = exigees.filter((p) => p.etat === 'DEDUITE');
    return {
      dispositif: d,
      exigees: exigees.length,
      deduites: deduites.length,
      manquantes: exigees.filter((p) => p.etat === 'A_DEPOSER').map((p) => p.type),
      pourcentage: exigees.length ? Math.round((deduites.length / exigees.length) * 100) : 0,
    };
  }

  private async appeler<T>(url: string): Promise<T> {
    const enCache = this.cache.get(url);
    if (enCache && enCache.expire > Date.now()) return enCache.valeur as T;

    const controleur = new AbortController();
    const minuterie = setTimeout(() => controleur.abort(), 8_000);
    try {
      const reponse = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'association.toulali.fr' },
        signal: controleur.signal,
      });
      if (!reponse.ok) {
        this.logger.warn(`Recherche d'entreprises : HTTP ${reponse.status}`);
        throw new BadRequestException(
          "Le service public des données d'entreprises ne répond pas pour le moment. Réessayez dans quelques minutes.",
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
      this.logger.warn(`Recherche d'entreprises : ${(e as Error).message}`);
      throw new BadRequestException(
        "Le service public des données d'entreprises ne répond pas pour le moment. Réessayez dans quelques minutes.",
      );
    } finally {
      clearTimeout(minuterie);
    }
  }
}
