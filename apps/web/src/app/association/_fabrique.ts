/**
 * Les modèles de documents qu'on fabrique sur place, tels que l'API les
 * décrit (voir apps/api/src/association/fabrique.ts). Types seulement :
 * ce fichier est lu par des composants client.
 */

export interface SousChampFabrique {
  nom: string;
  libelle: string;
  type: 'texte' | 'nombre' | 'date';
  large?: boolean;
}

export interface ChampFabrique {
  nom: string;
  libelle: string;
  type: 'texte' | 'long' | 'date' | 'nombre' | 'liste';
  requis?: boolean;
  aide?: string;
  colonnes?: SousChampFabrique[];
  lignesDepart?: number;
  prerempli?: string;
}

export interface ModeleFabrique {
  code: string;
  titre: string;
  enUnMot: string;
  piece?: string;
  categorie?: string;
  etapes: string[];
  champs: ChampFabrique[];
  pages: { titre: string; champs: string[] }[];
}

export type Prerempli = Record<string, unknown>;

/** Les valeurs qu'on connaît sans compte : la date du jour, l'année passée, la prochaine. */
export function preremplissageDeBase(): Prerempli {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  return { aujourdhui: iso, anneePassee: now.getFullYear() - 1, anneeProchaine: now.getFullYear() + 1 };
}

/** Applique les valeurs pré-remplies d'un modèle : chaque champ nomme sa source. */
export function valeursInitiales(modele: ModeleFabrique, prerempli: Prerempli): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const c of modele.champs) {
    const source = c.prerempli ? prerempli[c.prerempli] : undefined;
    if (c.type === 'liste') {
      const lignes = Array.isArray(source) ? (source as Record<string, unknown>[]) : [];
      const vide = () => Object.fromEntries((c.colonnes ?? []).map((col) => [col.nom, '']));
      const depart = Math.max(c.lignesDepart ?? 3, lignes.length);
      v[c.nom] = Array.from({ length: depart }, (_, i) => ({ ...vide(), ...(lignes[i] ?? {}) }));
    } else {
      v[c.nom] = source === undefined || source === null ? '' : source;
    }
  }
  return v;
}
