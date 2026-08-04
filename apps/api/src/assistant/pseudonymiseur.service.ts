import { Injectable } from '@nestjs/common';
import { PRENOMS_COURANTS } from './prenoms';

/**
 * Pseudonymisation des écrits AVANT tout appel à un modèle externe.
 *
 * Principe : les éléments identifiants (prénoms, noms, dates de naissance,
 * téléphones, e-mails) sont remplacés par des jetons stables ([PERSONNE-A],
 * [DATE-1]…) ; la table de correspondance vit uniquement en mémoire, le temps
 * de la requête, et n'est JAMAIS écrite en base ni envoyée au fournisseur.
 * Au retour du modèle, les jetons sont remplacés par les vrais noms, localement.
 *
 * C'est la condition juridique de l'outil : le fournisseur d'IA ne voit jamais
 * « Kevin, 14 ans, MECS Les Hirondelles » mais « [PERSONNE-A], 14 ans,
 * [ETABLISSEMENT-1] ».
 */

export interface TablePseudo {
  /** jeton → valeur réelle */
  vers: Map<string, string>;
  /** valeur réelle (minuscule) → jeton */
  depuis: Map<string, string>;
}

/** Mots en tête de phrase qu'il ne faut pas prendre pour des prénoms. */
const MOTS_COURANTS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'ce', 'cette', 'ces', 'il', 'elle',
  'ils', 'elles', 'nous', 'vous', 'je', 'tu', 'on', 'mais', 'donc', 'or',
  'car', 'ni', 'que', 'qui', 'quand', 'lors', 'apres', 'après', 'avant',
  'pendant', 'depuis', 'aujourd', 'hier', 'demain', 'matin', 'soir', 'nuit',
  'monsieur', 'madame', 'docteur', 'lundi', 'mardi', 'mercredi', 'jeudi',
  'vendredi', 'samedi', 'dimanche', 'janvier', 'fevrier', 'février', 'mars',
  'avril', 'mai', 'juin', 'juillet', 'aout', 'août', 'septembre', 'octobre',
  'novembre', 'decembre', 'décembre', 'bonjour', 'merci', 'suite', 'objet',
  'note', 'rapport', 'synthese', 'synthèse', 'transmission', 'observation',
  'atelier', 'mission', 'equipe', 'équipe', 'service', 'groupe', 'unite',
  'unité', 'foyer', 'mecs', 'ime', 'itep', 'sessad', 'ehpad', 'ase', 'mdph',
  // Étiquettes des trames d'établissement : « Nom : », « Date de naissance : »,
  // « Référent éducatif : ». Sans elles, l'import d'un modèle masquait
  // l'intitulé au lieu du nom — et le squelette appris devenait illisible.
  'nom', 'noms', 'prenom', 'prénom', 'prenoms', 'prénoms', 'date', 'dates',
  'naissance', 'admission', 'referent', 'référent', 'referente', 'référente',
  'educateur', 'éducateur', 'educatrice', 'éducatrice', 'adresse', 'telephone',
  'téléphone', 'courriel', 'mail', 'identification', 'situation', 'contexte',
  'faits', 'elements', 'éléments', 'analyse', 'perspectives', 'sante', 'santé',
  'scolarite', 'scolarité', 'liens', 'familiaux', 'famille', 'mesure',
  'placement', 'accompagnement', 'periode', 'période', 'cadre', 'signature',
  'fonction', 'etablissement', 'établissement', 'structure', 'destinataire',
  'copie', 'reference', 'référence', 'dossier', 'jeune', 'enfant', 'personne',
  'usager', 'resident', 'résident', 'beneficiaire', 'bénéficiaire',
]);

/**
 * Sigles et intitulés qu'on rencontre en capitales dans une trame et qui ne
 * sont PAS des noms de famille. Sans cette liste, masquer les capitales
 * détruirait les intitulés de sections — c'est-à-dire précisément ce qu'on
 * cherche à apprendre d'un modèle d'écrit.
 */
const CAPITALES_METIER = new Set([
  'MECS', 'IME', 'ITEP', 'IEM', 'SESSAD', 'DITEP', 'EHPAD', 'ESAT', 'MAS',
  'FAM', 'CHRS', 'CCAS', 'PJJ', 'CEF', 'AEMO', 'ASE', 'MDPH', 'CAF', 'CMP',
  'CMPP', 'SAVS', 'SAMSAH', 'ARS', 'HAS', 'CNIL', 'RGPD', 'PPE', 'DIPC',
  'PPA', 'GAP', 'APP', 'CAP', 'BEP', 'SEGPA', 'ULIS', 'ITT', 'TISF', 'AES',
  'AMP', 'EJE', 'CIP', 'RAS', 'SAS', 'RDV', 'SAMU', 'CHU', 'CHS', 'TDAH',
  'TSA', 'MDA', 'JAF', 'TGI', 'OPP', 'AED', 'IP', 'CRIP', 'PMI', 'CESF',
]);

@Injectable()
export class PseudonymiseurService {
  /** Applique la pseudonymisation et renvoie le texte masqué + la table. */
  masquer(texte: string): { texte: string; table: TablePseudo } {
    const table: TablePseudo = { vers: new Map(), depuis: new Map() };
    let compteurPersonne = 0;
    let compteurDate = 0;
    let compteurContact = 0;

    const jetonPour = (valeur: string, genre: 'PERSONNE' | 'DATE' | 'CONTACT'): string => {
      const cle = valeur.toLowerCase();
      const existant = table.depuis.get(cle);
      if (existant) return existant;
      let jeton: string;
      if (genre === 'PERSONNE') {
        // A, B, C… — stable au fil du texte pour garder la cohérence du récit.
        jeton = `[PERSONNE-${String.fromCharCode(65 + (compteurPersonne++ % 26))}]`;
      } else if (genre === 'DATE') {
        jeton = `[DATE-${++compteurDate}]`;
      } else {
        jeton = `[CONTACT-${++compteurContact}]`;
      }
      table.vers.set(jeton, valeur);
      table.depuis.set(cle, jeton);
      return jeton;
    };

    let resultat = texte;

    // 1. E-mails et téléphones — identifiants directs, toujours masqués.
    resultat = resultat.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => jetonPour(m, 'CONTACT'));
    resultat = resultat.replace(/(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g, (m) =>
      jetonPour(m, 'CONTACT'),
    );

    // 2. Dates complètes (naissance, événements datés précis).
    resultat = resultat.replace(
      /\b\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)\d{2}\b/g,
      (m) => jetonPour(m, 'DATE'),
    );

    // 3. « M. Dupont », « Mme Martin », « Dr Leroy » — civilité + nom.
    resultat = resultat.replace(
      /\b(M\.|Mr|Mme|Mlle|Dr|Pr)\s+([A-ZÀ-Ü][a-zà-ÿ'-]+(?:\s+[A-ZÀ-Ü][a-zà-ÿ'-]+)?)/g,
      (_m, _civ, nom) => jetonPour(nom, 'PERSONNE'),
    );

    // 4. Prénoms/noms : mot capitalisé qui n'ouvre pas la phrase et n'est pas
    //    un mot courant. Volontairement prudent : mieux vaut masquer un mot de
    //    trop que laisser passer un prénom.
    resultat = resultat.replace(
      /([^.!?\n]\s)([A-ZÀ-Ü][a-zà-ÿ'-]{2,})(\s+[A-ZÀ-Ü][a-zà-ÿ'-]{2,})?/gm,
      (m, avant: string, mot1: string, mot2?: string) => {
        if (MOTS_COURANTS.has(mot1.toLowerCase())) return m;
        const valeur = mot2 ? `${mot1}${mot2}` : mot1;
        return `${avant}${jetonPour(valeur.trim(), 'PERSONNE')}`;
      },
    );

    // 4 bis. Prénom en TÊTE de phrase : la capitalisation ne suffit plus à
    //    trancher, on s'appuie sur le dictionnaire de prénoms courants.
    //    C'est la fuite détectée au premier test réel (« Medhi a son rdv… »).
    const normaliser = (m: string) =>
      m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    resultat = resultat.replace(
      /(^|[.!?]\s+|\n\s*)([A-ZÀ-Ü][a-zà-ÿ'-]{2,})/gm,
      (m, avant: string, mot: string) => {
        if (!PRENOMS_COURANTS.has(normaliser(mot))) return m;
        return `${avant}${jetonPour(mot, 'PERSONNE')}`;
      },
    );

    // 4 ter. NOMS DE FAMILLE EN CAPITALES — « Kevin MARTIN », « Mme DUBOIS ».
    //    C'est la convention de presque toutes les trames d'établissement, et
    //    la fuite constatée sur le premier vrai modèle importé : le prénom
    //    était masqué, le patronyme restait en clair juste à côté. On ne
    //    masque que les capitales ACCOLÉES à un jeton personne déjà posé ou à
    //    une civilité — jamais les capitales isolées, qui sont des intitulés
    //    de section (« IDENTIFICATION », « VIE QUOTIDIENNE ») ou des sigles
    //    métier qu'il faut conserver pour que le squelette reste lisible.
    const estNomEnCapitales = (mot: string) =>
      mot.length >= 3 && !CAPITALES_METIER.has(mot) && !MOTS_COURANTS.has(mot.toLowerCase());

    // Après un jeton personne : « [PERSONNE-B] MARTIN ».
    resultat = resultat.replace(
      /(\[PERSONNE-[A-Z]+\]\s+)([A-ZÀ-Ü][A-ZÀ-Ü'-]{2,})\b/g,
      (m, jeton: string, mot: string) =>
        estNomEnCapitales(mot) ? `${jeton}${jetonPour(mot, 'PERSONNE')}` : m,
    );
    // Avant un jeton personne : « MARTIN [PERSONNE-B] ».
    resultat = resultat.replace(
      /\b([A-ZÀ-Ü][A-ZÀ-Ü'-]{2,})(\s+\[PERSONNE-[A-Z]+\])/g,
      (m, mot: string, jeton: string) =>
        estNomEnCapitales(mot) ? `${jetonPour(mot, 'PERSONNE')}${jeton}` : m,
    );
    // Après une civilité : « Mme MARTIN », « M. DUBOIS ».
    resultat = resultat.replace(
      /\b(M\.|Mr|Mme|Mlle|Dr|Pr)(\s+)([A-ZÀ-Ü][A-ZÀ-Ü'-]{2,})\b/g,
      (m, civ: string, espace: string, mot: string) =>
        estNomEnCapitales(mot) ? `${civ}${espace}${jetonPour(mot, 'PERSONNE')}` : m,
    );

    // 5. Seconde passe : toute valeur déjà identifiée est masquée PARTOUT,
    //    y compris en tête de phrase (« Kevin s'est calmé. Kevin a mangé. »).
    //    Sans elle, un prénom qui ouvre une phrase passerait au travers.
    for (const [jeton, valeur] of table.vers) {
      if (!jeton.startsWith('[PERSONNE')) continue;
      const echappe = valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      resultat = resultat.replace(
        new RegExp(`(?<![\\wà-ÿÀ-Ü])${echappe}(?![\\wà-ÿÀ-Ü])`, 'g'),
        jeton,
      );
    }

    return { texte: resultat, table };
  }

  /** Réinjecte les valeurs réelles dans le texte produit par le modèle. */
  restaurer(texte: string, table: TablePseudo): string {
    let resultat = texte;
    for (const [jeton, valeur] of table.vers) {
      resultat = resultat.split(jeton).join(valeur);
    }
    return resultat;
  }

  /** Résumé anonyme de ce qui a été masqué (affiché à l'utilisateur). */
  resume(table: TablePseudo): { personnes: number; dates: number; contacts: number } {
    let personnes = 0, dates = 0, contacts = 0;
    for (const jeton of table.vers.keys()) {
      if (jeton.startsWith('[PERSONNE')) personnes++;
      else if (jeton.startsWith('[DATE')) dates++;
      else contacts++;
    }
    return { personnes, dates, contacts };
  }
}
