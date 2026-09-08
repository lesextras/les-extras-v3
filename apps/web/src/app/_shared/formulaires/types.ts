/**
 * LES FORMULAIRES LIBRES — les types partagés par les deux espaces.
 *
 * Copie fidèle de ce que l'API renvoie (apps/api/src/formulaires/champs.ts).
 * Ce fichier est importé par du code client : il ne contient que des types et
 * des constantes, jamais d'appel serveur.
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
  id: string;
  type: TypeChamp;
  libelle: string;
  aide?: string;
  obligatoire: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export type StatutFormulaire = 'BROUILLON' | 'PUBLIE' | 'FERME';

export interface FormulaireResume {
  id: string;
  titre: string;
  slug: string;
  statut: StatutFormulaire;
  nbChamps: number;
  nbReponses: number;
  fermeLe: string | null;
  modifieLe: string;
}

export interface FormulaireComplet {
  id: string;
  titre: string;
  introduction: string | null;
  slug: string;
  statut: StatutFormulaire;
  champs: Champ[];
  remerciement: string | null;
  reponseUnique: boolean;
  demanderEmail: boolean;
  fermeLe: string | null;
  modifieLe: string;
  adresse: string;
}

export interface Reponse {
  id: string;
  email: string | null;
  valeurs: Record<string, string | string[] | number>;
  recueLe: string;
}

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

/** Ce qu'une question de ce type demande en plus. */
export const AVEC_OPTIONS: TypeChamp[] = ['CHOIX_UNIQUE', 'CHOIX_MULTIPLE', 'LISTE'];
export const AVEC_BORNES: TypeChamp[] = ['NOMBRE', 'ECHELLE'];

/**
 * LES COULEURS DE L'ESPACE.
 *
 * Le même atelier sert l'association (indigo) et l'académie (vert bouteille).
 * On passe les teintes en style en ligne : Tailwind ne sait pas composer une
 * classe à partir d'une variable.
 */
export interface Teinte {
  /** Le préfixe des adresses : '/association' ou '/academie'. */
  racine: string;
  encre: string;
  texte: string;
  sourdine: string;
  bord: string;
  fond: string;
  plein: string;
  pleinSurvol: string;
  clair: string;
}

export const TEINTE_ASSOCIATION: Teinte = {
  racine: '/association',
  encre: '#1D1B5C',
  texte: '#3B3A66',
  sourdine: '#6B6A8A',
  bord: '#E6E4F3',
  fond: '#F5F4FC',
  plein: '#4F46E5',
  pleinSurvol: '#4338CA',
  clair: '#ECEBFC',
};

export const TEINTE_ACADEMIE: Teinte = {
  racine: '/academie',
  encre: '#12312A',
  texte: '#334A42',
  sourdine: '#5E7A6E',
  bord: '#DDEBE4',
  fond: '#F2F7F5',
  plein: '#0F5F3E',
  pleinSurvol: '#0B4A30',
  clair: '#E3F5EC',
};

/** Un identifiant court et lisible pour une nouvelle question. */
export function nouvelIdentifiant() {
  return `q${Math.random().toString(36).slice(2, 9)}`;
}

/** La valeur d'une réponse, telle qu'on l'affiche dans un tableau ou un CSV. */
export function valeurLisible(valeur: string | string[] | number | undefined) {
  if (valeur === undefined || valeur === null) return '';
  if (Array.isArray(valeur)) return valeur.join(', ');
  return String(valeur);
}
