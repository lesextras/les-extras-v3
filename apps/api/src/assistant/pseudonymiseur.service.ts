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

/**
 * JETONS PARLANTS — le rôle plutôt qu'une lettre.
 *
 * Un moteur qui lit « [PERSONNE-A] a refusé de se lever, [PERSONNE-B] est
 * intervenue » ne sait pas qui est l'enfant, qui est la mère, qui est la
 * collègue. Il produit alors des tournures maladroites et confond parfois les
 * rôles — un défaut qu'un éducateur repère immédiatement et qui lui coûte une
 * relecture entière.
 *
 * Remplacer la lettre par le rôle règle cela sans rien céder sur la
 * protection : « la mère » ne désigne personne en dehors de la maison, et le
 * vrai prénom revient de toute façon dans le texte rendu au professionnel.
 * C'est le seul endroit du dispositif où l'on gagne en qualité ET en clarté
 * pour l'utilisateur, qui comprend enfin ce qu'il lit dans l'aperçu masqué.
 *
 * L'ordre compte : les libellés les plus longs d'abord, sinon « chef » avale
 * « chef de service » et « mère » avale « grand-mère ».
 */
const ROLES: { cue: string; jeton: string }[] = [
  { cue: "assistante sociale", jeton: "L'ASSISTANTE SOCIALE" },
  { cue: 'assistant social', jeton: "L'ASSISTANT SOCIAL" },
  { cue: 'cheffe de service', jeton: 'LA CHEFFE DE SERVICE' },
  { cue: 'chef de service', jeton: 'LE CHEF DE SERVICE' },
  { cue: 'grand-mère', jeton: 'LA GRAND-MÈRE' },
  { cue: 'grand-père', jeton: 'LE GRAND-PÈRE' },
  { cue: 'belle-mère', jeton: 'LA BELLE-MÈRE' },
  { cue: 'beau-père', jeton: 'LE BEAU-PÈRE' },
  { cue: 'éducatrice référente', jeton: "L'ÉDUCATRICE RÉFÉRENTE" },
  { cue: 'éducateur référent', jeton: "L'ÉDUCATEUR RÉFÉRENT" },
  { cue: 'éducatrice', jeton: "L'ÉDUCATRICE" },
  { cue: 'éducateur', jeton: "L'ÉDUCATEUR" },
  { cue: 'référente', jeton: 'LA RÉFÉRENTE' },
  { cue: 'référent', jeton: 'LE RÉFÉRENT' },
  { cue: 'psychologue', jeton: 'LE PSYCHOLOGUE' },
  { cue: 'psychiatre', jeton: 'LE PSYCHIATRE' },
  { cue: 'infirmière', jeton: "L'INFIRMIÈRE" },
  { cue: 'infirmier', jeton: "L'INFIRMIER" },
  { cue: 'directrice', jeton: 'LA DIRECTRICE' },
  { cue: 'directeur', jeton: 'LE DIRECTEUR' },
  { cue: 'enseignante', jeton: "L'ENSEIGNANTE" },
  { cue: 'enseignant', jeton: "L'ENSEIGNANT" },
  { cue: 'professeure', jeton: 'LA PROFESSEURE' },
  { cue: 'professeur', jeton: 'LE PROFESSEUR' },
  { cue: 'stagiaire', jeton: 'LE STAGIAIRE' },
  { cue: 'collègue', jeton: 'LE COLLÈGUE' },
  { cue: 'avocate', jeton: "L'AVOCATE" },
  { cue: 'avocat', jeton: "L'AVOCAT" },
  { cue: 'médecin', jeton: 'LE MÉDECIN' },
  { cue: 'juge', jeton: 'LE JUGE' },
  { cue: 'tutrice', jeton: 'LA TUTRICE' },
  { cue: 'tuteur', jeton: 'LE TUTEUR' },
  { cue: 'résidente', jeton: 'LA RÉSIDENTE' },
  { cue: 'résident', jeton: 'LE RÉSIDENT' },
  { cue: 'usagère', jeton: "L'USAGÈRE" },
  { cue: 'usager', jeton: "L'USAGER" },
  { cue: 'maman', jeton: 'LA MÈRE' },
  { cue: 'papa', jeton: 'LE PÈRE' },
  { cue: 'mère', jeton: 'LA MÈRE' },
  { cue: 'père', jeton: 'LE PÈRE' },
  { cue: 'frère', jeton: 'LE FRÈRE' },
  { cue: 'sœur', jeton: 'LA SŒUR' },
  { cue: 'soeur', jeton: 'LA SŒUR' },
  { cue: 'enfant', jeton: "L'ENFANT" },
  { cue: 'jeune', jeton: 'LE JEUNE' },
];

/**
 * Déterminants et possessifs qui précèdent un rôle. « l' » est collé au mot
 * qui suit, les autres en sont séparés par une espace : les deux formes sont
 * dans le motif, sinon « l'éducatrice » n'est jamais reconnu.
 */
const DETERMINANTS =
  "(?:(?:le|la|les|un|une|des|son|sa|ses|leur|leurs|notre|nos|votre|vos|mon|ma|mes)\\s+|[ld]')";

/** Tous les libellés de rôle, pour repérer un jeton inventé par le moteur. */
const JETONS_ROLES = new Set(ROLES.map((r) => r.jeton));

/**
 * Un jeton produit par la pseudonymisation ? Sert partout où l'on doit
 * neutraliser ce qui resterait de masqué dans un texte publié.
 */
export function estJetonRole(jetonAvecCrochets: string): boolean {
  const corps = jetonAvecCrochets
    .replace(/^\[|\]$/g, '')
    .replace(/\s+\d+$/, '')
    .trim();
  return JETONS_ROLES.has(corps);
}

/** Échappe une chaîne destinée à une expression régulière. */
function echapper(valeur: string): string {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remplace les jetons qu'un modèle a inventés et que la table ne connaît pas
 * (« [DATE-9] » alors qu'aucune date n'a été masquée) par une mention neutre
 * que l'auteur complétera. Rassemblé ici parce que les quatre générateurs de
 * LEX en avaient chacun leur copie, et qu'une copie oubliée laisse passer un
 * jeton brut dans un rapport destiné à un juge.
 */
export function nettoyerJetonsResiduels(texte: string): string {
  return texte
    .replace(/\[DATE-\d+\]/g, '[date à préciser]')
    .replace(/\[CONTACT-\d+\]/g, '[contact à préciser]')
    .replace(/\[PERSONNE-[A-Z]+\]/g, '[personne à préciser]')
    .replace(/\[([A-ZÀ-ÜŒ' -]{3,40}?)(?:\s+\d+)?\]/g, (m, corps: string) =>
      JETONS_ROLES.has(corps.trim()) ? '[personne à préciser]' : m,
    );
}

/** Mots en tête de phrase qu'il ne faut pas prendre pour des prénoms. */
const MOTS_COURANTS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'ce', 'cette', 'ces', 'il', 'elle',
  'ils', 'elles', 'nous', 'vous', 'je', 'tu', 'on', 'mais', 'donc', 'or',
  'car', 'ni', 'que', 'qui', 'quand', 'lors', 'apres', 'après', 'avant',
  'pendant', 'depuis', 'aujourd', 'hier', 'demain', 'matin', 'soir', 'nuit',
  'monsieur', 'madame', 'docteur', 'mme', 'mlle', 'mr', 'dr', 'pr', 'maitre',
  'maître', 'lundi', 'mardi', 'mercredi', 'jeudi',
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
 * VOCABULAIRE ORDINAIRE QUI S'ÉCRIT AVEC UNE MAJUSCULE.
 *
 * L'heuristique « mot capitalisé au milieu d'une phrase = nom propre » se
 * trompait sur tout ce qui suit une étiquette de formulaire ou ouvre une ligne :
 * « Public : Adolescents 13-16 ans en MECS » repartait avec deux « personnes »
 * masquées (« Adolescents », puis « Besoins » en tête de la ligne suivante).
 * Un professionnel qui voit LEX annoncer cinq identités protégées dans une
 * saisie qui n'en contient aucune cesse de croire au dispositif entier.
 *
 * Cette liste ne relâche RIEN sur les identités : un mot présent dans le
 * dictionnaire des prénoms l'emporte toujours (voir estMotOrdinaire), et les
 * patronymes en capitales continuent d'être traités par leurs règles propres.
 * On n'y met donc que des mots communs du métier et des intitulés de rubrique —
 * jamais un mot qui pourrait servir de prénom ou de nom de famille isolé.
 */
const LEXIQUE_COURANT = new Set([
  // Étiquettes des formulaires de LEX et des écrits professionnels.
  'public', 'publics', 'besoin', 'besoins', 'duree', 'durée', 'effectif',
  'effectifs', 'objectif', 'objectifs', 'contrainte', 'contraintes', 'materiel',
  'matériel', 'deroule', 'déroulé', 'deroulement', 'déroulement', 'variante',
  'variantes', 'alternative', 'alternatives', 'titre', 'theme', 'thème',
  'themes', 'thèmes', 'consigne', 'consignes', 'resume', 'résumé',
  'commentaire', 'commentaires', 'remarque', 'remarques', 'precision',
  'précision', 'precisions', 'précisions', 'difficulte', 'difficulté',
  'difficultes', 'difficultés', 'modalites', 'modalités', 'moyens', 'lieu',
  'lieux', 'horaire', 'horaires', 'frequence', 'fréquence', 'budget', 'points',
  'point', 'vigilance', 'indicateur', 'indicateurs', 'evaluation', 'évaluation',
  'bilan', 'bilans', 'projet', 'projets', 'proposition', 'propositions',
  'activite', 'activité', 'activites', 'activités', 'seance', 'séance',
  'seances', 'séances', 'ateliers', 'intervention', 'interventions', 'methode',
  'méthode', 'methodes', 'méthodes', 'contenu', 'conclusion', 'introduction',
  'sommaire', 'annexe', 'annexes', 'historique', 'suivi', 'suivis',
  // Publics accompagnés — les mots qui décrivent un groupe, jamais quelqu'un.
  'adolescent', 'adolescents', 'adolescente', 'adolescentes', 'ado', 'ados',
  'adulte', 'adultes', 'enfants', 'jeunes', 'mineur', 'mineurs', 'majeur',
  'majeurs', 'residents', 'résidents', 'residentes', 'résidentes', 'usagers',
  'usageres', 'usagères', 'beneficiaires', 'bénéficiaires', 'participant',
  'participants', 'participante', 'participantes', 'professionnel',
  'professionnels', 'professionnelle', 'professionnelles', 'equipes', 'équipes',
  'fratrie', 'parent', 'parents', 'familles', 'groupes', 'collectif', 'mixte',
  'garcon', 'garçon', 'garcons', 'garçons', 'filles', 'stagiaires',
  // Quotidien d'un établissement.
  'repas', 'coucher', 'lever', 'reveil', 'réveil', 'sommeil', 'toilette',
  'hygiene', 'hygiène', 'douche', 'dejeuner', 'déjeuner', 'gouter', 'goûter',
  'diner', 'dîner', 'cantine', 'internat', 'externat', 'veillee', 'veillée',
  'vacances', 'sortie', 'sorties', 'sejour', 'séjour', 'sejours', 'séjours',
  'transport', 'transports', 'chambre', 'chambres', 'salle', 'salles', 'cour',
  'jardin', 'cuisine', 'gymnase', 'piscine', 'mediatheque', 'médiathèque',
  'bibliotheque', 'bibliothèque', 'terrain', 'ecole', 'école', 'college',
  'collège', 'lycee', 'lycée', 'classe', 'classes', 'scolaire', 'stage',
  'stages', 'reunion', 'réunion', 'reunions', 'réunions', 'entretien',
  'entretiens', 'visite', 'visites', 'audience',
  // Supports et médiations.
  'theatre', 'théâtre', 'musique', 'danse', 'sport', 'sports', 'dessin',
  'peinture', 'poterie', 'jeu', 'jeux', 'lecture', 'ecriture', 'écriture',
  'chant', 'video', 'vidéo', 'photo', 'photos', 'cirque', 'escalade',
  'randonnee', 'randonnée', 'relaxation', 'respiration', 'mediation',
  'médiation', 'mediations', 'médiations', 'debat', 'débat', 'discussion',
  'jardinage', 'bricolage', 'informatique', 'numerique', 'numérique',
  // Ce qu'on décrit d'une situation.
  'conflit', 'conflits', 'tension', 'tensions', 'violence', 'violences',
  'agressivite', 'agressivité', 'angoisse', 'angoisses', 'colere', 'colère',
  'crise', 'crises', 'refus', 'opposition', 'isolement', 'repli', 'fatigue',
  'stress', 'emotion', 'émotion', 'emotions', 'émotions', 'confiance',
  'cooperation', 'coopération', 'autonomie', 'respect', 'regle', 'règle',
  'regles', 'règles', 'limites', 'sanction', 'sanctions', 'incident',
  'incidents', 'comportement', 'comportements', 'progres', 'progrès',
  // Repères de temps.
  'semaine', 'semaines', 'mois', 'annee', 'année', 'annees', 'années', 'jour',
  'jours', 'journee', 'journée', 'journees', 'journées', 'heure', 'heures',
  'minute', 'minutes', 'midi', "apres-midi", 'après-midi', 'week-end',
  'weekend', "aujourd'hui", 'veille', 'lendemain',
]);

/**
 * Civilités et titres : ce qui les suit est un nom, toujours. Sert de
 * rattrapage quand la civilité a « absorbé » la place du mot capitalisé.
 */
const CIVILITES = new Set([
  'monsieur', 'madame', 'mademoiselle', 'docteur', 'docteure', 'maitre',
  'professeur', 'professeure', 'mme', 'mlle', 'mr', 'dr', 'pr', 'me',
]);

/** Lowercase + accents retirés : la comparaison ne dépend ni de l'un ni des autres. */
function normaliserMot(mot: string): string {
  return mot.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Ce mot capitalisé est-il un mot ordinaire, qu'il serait absurde de masquer ?
 *
 * RÈGLE DE SÉCURITÉ : un prénom du dictionnaire n'est JAMAIS ordinaire. Le
 * garde-fou vaut pour aujourd'hui comme pour les mots qu'on ajoutera demain —
 * laisser passer un prénom coûte infiniment plus cher que masquer un mot de
 * trop.
 */
function estMotOrdinaire(mot: string): boolean {
  const brut = mot.toLowerCase();
  const n = normaliserMot(mot);
  if (PRENOMS_COURANTS.has(n)) return false;
  return (
    MOTS_COURANTS.has(brut) ||
    MOTS_COURANTS.has(n) ||
    LEXIQUE_COURANT.has(brut) ||
    LEXIQUE_COURANT.has(n)
  );
}

/**
 * Sigles et intitulés qu'on rencontre en capitales dans une trame et qui ne
 * sont PAS des noms de famille. Sans cette liste, masquer les capitales
 * détruirait les intitulés de sections — c'est-à-dire précisément ce qu'on
 * cherche à apprendre d'un modèle d'écrit.
 *
 * Volontairement séparée de LEXIQUE_COURANT : un mot commun peut très bien être
 * un patronyme (« Mme JARDIN », « M. BOULANGER »), et les capitales ne sont
 * traitées ici que lorsqu'elles jouxtent une identité déjà repérée.
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

    // 3. « M. Dupont », « Mme MARTIN », « Dr Leroy » — civilité + nom.
    //    La civilité est CONSERVÉE : elle n'identifie personne, et la faire
    //    disparaître cassait l'aller-retour — « Mme Martin » revenait
    //    « Martin » dans un courrier adressé à une famille.
    //    Le patronyme est accepté en capitales : c'est la forme la plus
    //    fréquente dans les écrits d'établissement.
    resultat = resultat.replace(
      /\b(M\.|Mr|Mme|Mlle|Dr|Pr)\s+([A-ZÀ-Ü][A-Za-zÀ-ÿ'-]+(?:\s+[A-ZÀ-Ü][A-Za-zÀ-ÿ'-]+)?)/g,
      (_m, civ: string, nom: string) => `${civ} ${jetonPour(nom, 'PERSONNE')}`,
    );

    // 4. Prénoms/noms : mot capitalisé qui n'ouvre pas la phrase et n'est pas
    //    un mot ordinaire. Volontairement prudent : mieux vaut masquer un mot de
    //    trop que laisser passer un prénom.
    resultat = resultat.replace(
      /([^.!?\n]\s)([A-ZÀ-Ü][a-zà-ÿ'-]{2,})(\s+[A-ZÀ-Ü][a-zà-ÿ'-]{2,})?/gm,
      (m, avant: string, mot1: string, mot2?: string) => {
        if (estMotOrdinaire(mot1)) {
          // Le premier mot est ordinaire, mais le second peut être l'identité
          // qu'il annonce : « Monsieur Zoubida », « Ce matin, Madame Dubois ».
          // Sans ce rattrapage, le nom repartait en clair au seul motif qu'il
          // n'ouvrait pas la phrase — le mot ordinaire l'avait absorbé.
          const nom2 = mot2?.trim() ?? '';
          const espace2 = nom2 ? mot2!.slice(0, mot2!.length - nom2.length) : '';
          const suspect =
            CIVILITES.has(normaliserMot(mot1)) || PRENOMS_COURANTS.has(normaliserMot(nom2));
          if (nom2 && suspect) {
            return `${avant}${mot1}${espace2}${jetonPour(nom2, 'PERSONNE')}`;
          }
          return m;
        }
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

    // 4 quater. RÔLES — on remplace la lettre par ce que la phrase dit de la
    //    personne : « le jeune Kevin » devient [LE JEUNE], « sa mère Mme
    //    Martin » devient [LA MÈRE]. Le moteur écrit nettement mieux avec un
    //    rôle qu'avec une lettre, et l'aperçu masqué devient enfin lisible
    //    pour le professionnel. La protection est inchangée : un rôle ne
    //    désigne personne hors de l'établissement.
    resultat = this.etiqueterLesRoles(resultat, table);

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

  /**
   * Renomme les jetons personne en fonction du rôle que la phrase leur donne.
   *
   * On travaille sur le texte DÉJÀ masqué : les noms ont été repérés, on ne
   * cherche donc plus qu'à savoir qui est qui. Deux tournures couvrent
   * l'essentiel de ce qu'écrit un éducateur : le rôle avant le nom (« le jeune
   * Kevin », « sa mère, Mme Martin ») et le rôle après (« Kevin, son frère »).
   *
   * « la mère de Kevin » est volontairement ignoré : le mot « de » sépare le
   * rôle du nom, et c'est l'enfant qui est nommé, pas la mère. Confondre les
   * deux inverserait les rôles dans tout le document — bien pire que de garder
   * une lettre.
   */
  private etiqueterLesRoles(texte: string, table: TablePseudo): string {
    const cues = ROLES.map((r) => echapper(r.cue)).join('|');
    const parCue = new Map(ROLES.map((r) => [r.cue, r.jeton]));

    // On RELÈVE d'abord, on renomme ensuite. Deux personnes peuvent porter le
    // même patronyme — « Mme DUBOIS, sa mère, et M. DUBOIS, son père » — et
    // partagent alors un seul jeton. Étiqueter à la volée donnerait au père le
    // rôle de la mère : on préfère laisser la lettre plutôt qu'inverser deux
    // rôles dans tout un rapport.
    const roleObserve = new Map<string, string | null>();
    const relever = (jeton: string, base: string) => {
      if (!table.vers.has(jeton)) return;
      const connu = roleObserve.get(jeton);
      if (connu === undefined) roleObserve.set(jeton, base);
      else if (connu !== base) roleObserve.set(jeton, null); // rôles en conflit
    };

    // Rôle AVANT le nom : « le jeune [PERSONNE-A] », « sa mère, [PERSONNE-B] ».
    const avant = new RegExp(`${DETERMINANTS}?(${cues})\\s*,?\\s+(\\[PERSONNE-[A-Z]+\\])`, 'gi');
    for (const m of texte.matchAll(avant)) {
      const base = parCue.get(m[1].toLowerCase());
      if (base) relever(m[2], base);
    }

    // Rôle APRÈS le nom : « [PERSONNE-A], son frère », « [PERSONNE-B], la référente ».
    const apres = new RegExp(`(\\[PERSONNE-[A-Z]+\\])\\s*,\\s*${DETERMINANTS}?(${cues})\\b`, 'gi');
    for (const m of texte.matchAll(apres)) {
      const base = parCue.get(m[2].toLowerCase());
      if (base) relever(m[1], base);
    }

    let resultat = texte;
    for (const [ancien, base] of roleObserve) {
      if (!base) continue;
      const valeur = table.vers.get(ancien);
      if (!valeur) continue;
      // Unicité : deux frères doivent porter deux jetons distincts, sinon la
      // restauration rendrait le même prénom aux deux.
      let nouveau = `[${base}]`;
      let n = 2;
      while (table.vers.has(nouveau)) nouveau = `[${base} ${n++}]`;
      table.vers.delete(ancien);
      table.vers.set(nouveau, valeur);
      table.depuis.set(valeur.toLowerCase(), nouveau);
      resultat = resultat.split(ancien).join(nouveau);
    }

    return resultat;
  }

  /**
   * Réinjecte les valeurs réelles dans le texte produit par le modèle.
   *
   * Tolérant à dessein sur la casse et l'espacement : un modèle réécrit
   * volontiers « [la mère] » ou « [LA  MÈRE] », et une correspondance stricte
   * laisserait alors un jeton brut dans un document destiné à un juge ou à une
   * famille. On reste en revanche strict sur les crochets et sur le libellé.
   */
  restaurer(texte: string, table: TablePseudo): string {
    let resultat = texte;
    for (const [jeton, valeur] of table.vers) {
      const corps = echapper(jeton.slice(1, -1)).replace(/\s+/g, '\\s+');
      resultat = resultat.replace(new RegExp(`\\[\\s*${corps}\\s*\\]`, 'gi'), valeur);
    }
    return resultat;
  }

  /**
   * Résumé anonyme de ce qui a été masqué (affiché à l'utilisateur).
   *
   * `roles` liste les étiquettes réellement employées. C'est la contrepartie
   * de la promesse : plutôt que d'affirmer « c'est protégé », on montre
   * exactement ce que le moteur a vu à la place des noms. Un professionnel qui
   * lit « [LE JEUNE], [LA MÈRE], [L'ÉDUCATRICE] » comprend le dispositif en
   * une seconde, et peut le montrer à sa direction.
   */
  resume(table: TablePseudo): {
    personnes: number;
    dates: number;
    contacts: number;
    roles: string[];
  } {
    let personnes = 0, dates = 0, contacts = 0;
    const roles: string[] = [];
    for (const jeton of table.vers.keys()) {
      if (jeton.startsWith('[DATE')) dates++;
      else if (jeton.startsWith('[CONTACT')) contacts++;
      else {
        personnes++;
        if (!jeton.startsWith('[PERSONNE-')) roles.push(jeton);
      }
    }
    return { personnes, dates, contacts, roles };
  }
}
