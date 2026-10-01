'use client';

import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import type { ActionAssociation, FormationCatalogue } from '../../association/espace/_types';

/**
 * « MES PROJETS », PARTAGÉ PAR LES DEUX ESPACES.
 *
 * Les mêmes composants servent l'association (indigo) et l'académie (vert) :
 * chaque espace fournit son `appel` (son relais et son compte), ses adresses
 * d'API et sa teinte. La teinte passe par des variables CSS posées sur le
 * conteneur : les composants écrivent `var(--pj-…, <indigo>)`, l'association
 * n'a donc rien à poser.
 */

export type Appel = <T = unknown>(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown },
) => Promise<T>;

export interface ContexteProjets {
  appel: Appel;
  /** `/association/actions` ou `/academie/projets` ; `/association/taches` ou `/academie/taches`. */
  chemins: { projets: string; taches: string };
  /** Où ajouter quelqu'un à l'équipe. */
  lienEquipe: string;
  /** Le catalogue des formations reliables ; `null` : pas de section « Formations ». */
  formations: FormationCatalogue[] | null;
  /** Où ouvrir une formation (null : pas de lien). */
  lienFormation?: (f: { id: string; academieId: string }) => string | null;
  /** Ce qu'on affiche quand aucune académie n'est reliée. */
  aideSansFormations?: ReactNode;
  /** Vu d'une académie reliée : à quel espace un nouveau projet appartient. */
  proprietaires?: { cle: string; nom: string; type: 'ASSOCIATION' | 'ACADEMIE' }[];
  /** Le bloc « Trouver des financeurs » de l'association. */
  financeurs?: (projet: ActionAssociation) => ReactNode;
  /** Exemple de nom de projet. */
  exemple?: string;
}

const Contexte = createContext<ContexteProjets | null>(null);

export function useProjets(): ContexteProjets {
  const c = useContext(Contexte);
  if (!c) throw new Error('Les projets doivent être affichés dans un <FournisseurProjets>.');
  return c;
}

/** Les teintes de l'académie (l'association garde les valeurs par défaut, indigo). */
export const TEINTE_ACADEMIE: CSSProperties = {
  ['--pj-encre' as string]: '#12312A',
  ['--pj-accent' as string]: '#0F5F3E',
  ['--pj-accent-fonce' as string]: '#0B4A30',
  ['--pj-gris' as string]: '#5E7A6E',
  ['--pj-gris-clair' as string]: '#8FA89D',
  ['--pj-texte' as string]: '#334A42',
  ['--pj-teinte' as string]: '#E3F5EC',
  ['--pj-teinte-douce' as string]: '#EEF8F2',
  ['--pj-fond' as string]: '#EDF4F1',
  ['--pj-fond-doux' as string]: '#F2F7F5',
  ['--pj-bord' as string]: '#DCEBE3',
  ['--pj-bord-champ' as string]: '#CFE4D9',
  ['--pj-bord-vif' as string]: '#A9D3BE',
  ['--pj-blanc-casse' as string]: '#F7FBF9',
};

export function FournisseurProjets({ valeur, teinte, children }: { valeur: ContexteProjets; teinte?: CSSProperties; children: ReactNode }) {
  return (
    <Contexte.Provider value={valeur}>
      <div style={teinte}>{children}</div>
    </Contexte.Provider>
  );
}
