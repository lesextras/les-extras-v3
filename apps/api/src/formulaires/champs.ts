/**
 * CE QU'UNE QUESTION PEUT ÊTRE.
 *
 * On garde peu de types, mais des types qui couvrent tout ce qu'une association
 * ou une académie demande vraiment : un nom, un paragraphe, un choix, une date,
 * un nombre, une note. Le reste, c'est de l'habillage.
 *
 * Les questions sont rangées en JSON dans le formulaire : la forme change à
 * chaque formulaire, et une table de champs obligerait une migration à chaque
 * nouveau type. On paie ce choix par une validation écrite à la main, ici.
 */

export const TYPES_CHAMP = [
  'TEXTE',
  'PARAGRAPHE',
  'EMAIL',
  'TELEPHONE',
  'NOMBRE',
  'DATE',
  'CHOIX_UNIQUE',
  'CHOIX_MULTIPLE',
  'LISTE',
  'OUI_NON',
  'ECHELLE',
  'TITRE',
] as const;

export type TypeChamp = (typeof TYPES_CHAMP)[number];

export interface Champ {
  /** Identifiant stable : c'est la clé sous laquelle la réponse est rangée. */
  id: string;
  type: TypeChamp;
  libelle: string;
  /** La petite phrase sous la question. */
  aide?: string;
  obligatoire: boolean;
  /** Pour CHOIX_UNIQUE, CHOIX_MULTIPLE et LISTE. */
  options?: string[];
  /** Pour NOMBRE et ECHELLE. */
  min?: number;
  max?: number;
}

/** Les types qui attendent une liste de réponses possibles. */
const AVEC_OPTIONS: TypeChamp[] = ['CHOIX_UNIQUE', 'CHOIX_MULTIPLE', 'LISTE'];

/** Un champ TITRE n'attend aucune réponse : c'est un intertitre dans la page. */
export function attendUneReponse(champ: Champ) {
  return champ.type !== 'TITRE';
}

/**
 * On relit ce que le navigateur envoie avant de l'enregistrer. Une question mal
 * formée est corrigée quand c'est possible (identifiant manquant, options
 * vides) et refusée quand ça ne l'est pas (libellé absent).
 */
export function nettoyerChamps(brut: unknown): Champ[] {
  if (!Array.isArray(brut)) return [];
  const vus = new Set<string>();
  const champs: Champ[] = [];

  for (const entree of brut.slice(0, 100)) {
    if (!entree || typeof entree !== 'object') continue;
    const e = entree as Record<string, unknown>;

    const type = TYPES_CHAMP.includes(e.type as TypeChamp) ? (e.type as TypeChamp) : 'TEXTE';
    const libelle = typeof e.libelle === 'string' ? e.libelle.trim().slice(0, 300) : '';
    if (!libelle) continue;

    let id = typeof e.id === 'string' && e.id.trim() ? e.id.trim().slice(0, 40) : '';
    if (!id || vus.has(id)) id = `q${champs.length + 1}_${Math.random().toString(36).slice(2, 8)}`;
    vus.add(id);

    const champ: Champ = {
      id,
      type,
      libelle,
      obligatoire: Boolean(e.obligatoire) && type !== 'TITRE',
    };

    const aide = typeof e.aide === 'string' ? e.aide.trim().slice(0, 300) : '';
    if (aide) champ.aide = aide;

    if (AVEC_OPTIONS.includes(type)) {
      const options = Array.isArray(e.options)
        ? e.options
            .map((o) => (typeof o === 'string' ? o.trim().slice(0, 200) : ''))
            .filter((o, i, tout) => o && tout.indexOf(o) === i)
            .slice(0, 60)
        : [];
      // Sans option, un choix ne veut rien dire : on en pose une par défaut.
      champ.options = options.length ? options : ['Première réponse'];
    }

    if (type === 'NOMBRE' || type === 'ECHELLE') {
      const min = Number(e.min);
      const max = Number(e.max);
      champ.min = Number.isFinite(min) ? min : type === 'ECHELLE' ? 1 : undefined;
      champ.max = Number.isFinite(max) ? max : type === 'ECHELLE' ? 5 : undefined;
      if (champ.min !== undefined && champ.max !== undefined && champ.min > champ.max) {
        const t = champ.min;
        champ.min = champ.max;
        champ.max = t;
      }
    }

    champs.push(champ);
  }

  return champs;
}

/**
 * On relit une réponse question par question. On renvoie les valeurs propres et
 * la liste de ce qui manque : la page publique affiche ces messages tels quels.
 */
export function verifierReponse(champs: Champ[], brut: unknown) {
  const donnees = brut && typeof brut === 'object' ? (brut as Record<string, unknown>) : {};
  const valeurs: Record<string, string | string[] | number> = {};
  const manques: string[] = [];

  for (const champ of champs) {
    if (!attendUneReponse(champ)) continue;
    const valeur = donnees[champ.id];

    if (champ.type === 'CHOIX_MULTIPLE') {
      const choisis = Array.isArray(valeur)
        ? valeur.filter((v): v is string => typeof v === 'string' && (champ.options ?? []).includes(v))
        : [];
      if (champ.obligatoire && !choisis.length) manques.push(champ.libelle);
      if (choisis.length) valeurs[champ.id] = choisis;
      continue;
    }

    if (champ.type === 'NOMBRE' || champ.type === 'ECHELLE') {
      const n = Number(valeur);
      if (!Number.isFinite(n)) {
        if (champ.obligatoire) manques.push(champ.libelle);
        continue;
      }
      if (champ.min !== undefined && n < champ.min) { manques.push(champ.libelle); continue; }
      if (champ.max !== undefined && n > champ.max) { manques.push(champ.libelle); continue; }
      valeurs[champ.id] = n;
      continue;
    }

    const texte = typeof valeur === 'string' ? valeur.trim().slice(0, 5000) : '';
    if (!texte) {
      if (champ.obligatoire) manques.push(champ.libelle);
      continue;
    }
    if ((champ.type === 'CHOIX_UNIQUE' || champ.type === 'LISTE') && !(champ.options ?? []).includes(texte)) {
      manques.push(champ.libelle);
      continue;
    }
    if (champ.type === 'OUI_NON' && !['Oui', 'Non'].includes(texte)) {
      manques.push(champ.libelle);
      continue;
    }
    if (champ.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texte)) {
      manques.push(champ.libelle);
      continue;
    }
    valeurs[champ.id] = texte;
  }

  return { valeurs, manques };
}

/** Le libellé lisible d'un type, pour l'écran de composition. */
export const NOM_DU_TYPE: Record<TypeChamp, string> = {
  TEXTE: 'Réponse courte',
  PARAGRAPHE: 'Paragraphe',
  EMAIL: 'Adresse e-mail',
  TELEPHONE: 'Téléphone',
  NOMBRE: 'Nombre',
  DATE: 'Date',
  CHOIX_UNIQUE: 'Choix unique',
  CHOIX_MULTIPLE: 'Choix multiple',
  LISTE: 'Liste déroulante',
  OUI_NON: 'Oui / Non',
  ECHELLE: 'Note sur une échelle',
  TITRE: 'Intertitre',
};
