/**
 * LA FABRIQUE : les documents qu'une association peut faire sur place.
 *
 * Chaque modèle décrit ses champs (pour le formulaire) et sait se
 * construire en blocs neutres (titre, paragraphe, liste, tableau,
 * signatures). Deux rendus lisent ces blocs : PDF (rangé dans le classeur)
 * et Word (pour modifier). Voir rendu.ts.
 *
 * Les textes sont écrits pour une petite association : phrases courtes,
 * pas de jargon. Ce sont des modèles usuels d'associations loi 1901 ; ils
 * ne remplacent pas un formulaire officiel (CERFA), que l'on relie à part.
 */

export type TypeChamp = 'texte' | 'long' | 'date' | 'nombre' | 'liste';

export interface SousChamp {
  nom: string;
  libelle: string;
  type: 'texte' | 'nombre' | 'date';
  large?: boolean;
}

export interface Champ {
  nom: string;
  libelle: string;
  type: TypeChamp;
  requis?: boolean;
  aide?: string;
  /** Pour 'liste' : les colonnes de chaque ligne, et le nombre de lignes au départ. */
  colonnes?: SousChamp[];
  lignesDepart?: number;
  /** Nom de la valeur pré-remplie depuis l'espace (organisation.nom, bureau.president…). */
  prerempli?: string;
}

export type Bloc =
  | { type: 'titre'; texte: string; niveau?: 1 | 2 }
  | { type: 'para'; texte: string; gras?: boolean; italique?: boolean; centre?: boolean }
  | { type: 'liste'; items: string[] }
  | { type: 'tableau'; entetes: string[]; lignes: string[][]; total?: string[]; largeurs?: number[] }
  | { type: 'signatures'; lieu: string; date: string; noms: string[] }
  | { type: 'espace' };

export interface DocumentFabrique {
  titre: string;
  sousTitre?: string;
  blocs: Bloc[];
  /** Sans extension. */
  nomFichier: string;
}

export interface Modele {
  code: string;
  titre: string;
  /** Ce que ça fait, en une phrase. */
  enUnMot: string;
  /** La pièce du classeur qu'il produit, s'il y en a une. */
  piece?: string;
  /** Sinon, la catégorie du document libre. */
  categorie?: string;
  /** Les étapes du chemin où on le propose. */
  etapes: string[];
  champs: Champ[];
  /** Les écrans du formulaire (1 › 2 › 3) : un titre et les champs qu'il porte. Les champs non cités vont sur le dernier. */
  pages: { titre: string; champs: string[] }[];
  construire: (v: Valeurs) => DocumentFabrique;
}

export type Valeurs = Record<string, unknown>;

/* ------------------------------------------------------------ utilitaires */

const t = (v: unknown, repli = '') => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : repli);
const n = (v: unknown) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const x = Number(v.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
};
/** Espaces fines de fr-FR remplacées : les polices PDF standard ne les connaissent pas. */
const euros = (x: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(x).replace(/[\u202f\u00a0]/g, ' ')} €`;
const dateFr = (v: unknown) => {
  const s = t(v);
  if (!s) return '…';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};
const lignes = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((l) => l && typeof l === 'object') : []) as Record<string, unknown>[];
const nomFichier = (base: string, nom: string) =>
  `${base}-${nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'association'}`;

const CHAMP_NOM: Champ = { nom: 'nom', libelle: "Nom de l'association", type: 'texte', requis: true, prerempli: 'organisation.nom' };
const CHAMP_SIEGE: Champ = { nom: 'siege', libelle: 'Adresse du siège', type: 'texte', requis: true, prerempli: 'organisation.adresse', aide: 'Rue, code postal, ville.' };
const CHAMP_VILLE: Champ = { nom: 'ville', libelle: 'Ville où le document est signé', type: 'texte', requis: true, prerempli: 'organisation.commune' };
const CHAMP_DATE: Champ = { nom: 'date', libelle: 'Date', type: 'date', requis: true, prerempli: 'aujourdhui' };
const CHAMP_PRESIDENT: Champ = { nom: 'president', libelle: 'Président ou présidente', type: 'texte', requis: true, prerempli: 'bureau.president', aide: 'Prénom et nom.' };
const CHAMP_TRESORIER: Champ = { nom: 'tresorier', libelle: 'Trésorier ou trésorière', type: 'texte', requis: true, prerempli: 'bureau.tresorier' };
const CHAMP_SECRETAIRE: Champ = { nom: 'secretaire', libelle: 'Secrétaire', type: 'texte', requis: true, prerempli: 'bureau.secretaire' };

const COLONNES_ARGENT: SousChamp[] = [
  { nom: 'libelle', libelle: 'Quoi', type: 'texte', large: true },
  { nom: 'montant', libelle: 'Montant (€)', type: 'nombre' },
];

function tableauArgent(v: unknown): { lignes: string[][]; total: number } {
  const ls = lignes(v).filter((l) => t(l.libelle));
  const total = ls.reduce((s, l) => s + n(l.montant), 0);
  return { lignes: ls.map((l) => [t(l.libelle), euros(n(l.montant))]), total };
}

/* ---------------------------------------------------------------- modèles */

export const MODELES: Modele[] = [
  {
    code: 'statuts',
    titre: 'Les statuts',
    enUnMot: "La carte d'identité de l'association : son nom, son but, comment elle décide. Douze articles, prêts à signer.",
    piece: 'STATUTS',
    etapes: ['declarer-l-association'],
    pages: [{ titre: 'L’association', champs: ['nom', 'objet', 'siege'] }, { titre: 'Le bureau', champs: ['dureeMandat', 'president', 'secretaire'] }, { titre: 'Signature', champs: ['ville', 'date'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'objet', libelle: "Le but de l'association (l'objet)", type: 'long', requis: true, aide: 'Une ou deux phrases : ce que vous faites, pour qui, où.', prerempli: 'projet.quoi' },
      CHAMP_SIEGE,
      { nom: 'dureeMandat', libelle: 'Le bureau est élu pour combien d’années ?', type: 'nombre', requis: true, aide: '1 an est le plus simple.' },
      CHAMP_VILLE,
      CHAMP_DATE,
      CHAMP_PRESIDENT,
      CHAMP_SECRETAIRE,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const duree = Math.max(1, Math.round(n(v.dureeMandat) || 1));
      const art = (num: number, titre: string, texte: string): Bloc[] => [
        { type: 'titre', texte: `Article ${num} – ${titre}`, niveau: 2 },
        { type: 'para', texte },
      ];
      return {
        titre: `Statuts de l'association « ${nom} »`,
        sousTitre: 'Association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901',
        nomFichier: nomFichier('statuts', nom),
        blocs: [
          ...art(1, 'Nom', `Il est fondé entre les personnes qui adhèrent aux présents statuts une association ayant pour nom : « ${nom} ».`),
          ...art(2, 'But', `L'association a pour but : ${t(v.objet, '…')}`),
          ...art(3, 'Siège', `Le siège de l'association est fixé à : ${t(v.siege, '…')}. Il peut être déplacé par simple décision du bureau, confirmée à l'assemblée générale suivante.`),
          ...art(4, 'Durée', 'La durée de l’association est illimitée.'),
          ...art(5, 'Membres', "Peut devenir membre toute personne qui partage le but de l'association, qui en fait la demande et qui paie la cotisation. Le montant de la cotisation est décidé chaque année par l'assemblée générale. Les mineurs peuvent adhérer avec l'accord d'un parent."),
          ...art(6, 'Perte de la qualité de membre', "On cesse d'être membre par démission, par non-paiement de la cotisation, par décès, ou par exclusion décidée par le bureau pour motif grave, la personne ayant été invitée à s'expliquer."),
          ...art(7, 'Ressources', "Les ressources de l'association sont : les cotisations, les subventions de l'État et des collectivités, les dons, les recettes des activités et des manifestations, et toute ressource autorisée par la loi."),
          ...art(8, 'Assemblée générale', "L'assemblée générale réunit tous les membres à jour de cotisation, au moins une fois par an. Elle est convoquée par le président au moins quinze jours avant, avec l'ordre du jour. Elle entend le rapport moral et le rapport financier, approuve les comptes, vote le budget et la cotisation, et élit le bureau. Les décisions sont prises à la majorité des membres présents ou représentés. Chaque membre a une voix."),
          ...art(9, 'Le bureau', `L'association est dirigée par un bureau composé au moins d'un président ou d'une présidente, d'un trésorier ou d'une trésorière et d'un ou d'une secrétaire, élus par l'assemblée générale pour ${duree} an${duree > 1 ? 's' : ''}, rééligibles. Le président représente l'association, signe les contrats et agit en justice au nom de l'association. Le trésorier tient les comptes et prépare le rapport financier. Le secrétaire rédige les procès-verbaux et tient les registres.`),
          ...art(10, 'Assemblée générale extraordinaire', "Pour modifier les statuts ou dissoudre l'association, le président convoque une assemblée générale extraordinaire. Les décisions y sont prises à la majorité des deux tiers des membres présents ou représentés."),
          ...art(11, 'Règlement intérieur', "Le bureau peut établir un règlement intérieur pour préciser le fonctionnement de l'association. Il est présenté à l'assemblée générale."),
          ...art(12, 'Dissolution', "En cas de dissolution, l'assemblée générale extraordinaire nomme une ou plusieurs personnes chargées de la liquidation. Les biens restants sont donnés à une association poursuivant un but similaire, jamais aux membres."),
          { type: 'espace' },
          { type: 'para', texte: `Statuts adoptés par l'assemblée générale constitutive du ${dateFr(v.date)}.` },
          { type: 'signatures', lieu: t(v.ville, '…'), date: dateFr(v.date), noms: [`${t(v.president, '…')}, président·e`, `${t(v.secretaire, '…')}, secrétaire`] },
        ],
      };
    },
  },
  {
    code: 'pv-constitutive',
    titre: "Le procès-verbal de l'assemblée constitutive",
    enUnMot: 'Le compte rendu de la réunion où vous avez créé l’association : la préfecture le demande avec les statuts.',
    categorie: "Vie de l'association",
    etapes: ['declarer-l-association'],
    pages: [{ titre: 'La réunion', champs: ['nom', 'date', 'lieu', 'nbPresents'] }, { titre: 'Les décisions', champs: ['objet', 'siege', 'cotisation'] }, { titre: 'Le bureau élu', champs: ['president', 'tresorier', 'secretaire'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'date', libelle: 'Date de la réunion', type: 'date', requis: true, prerempli: 'aujourdhui' },
      { nom: 'lieu', libelle: 'Lieu de la réunion', type: 'texte', requis: true, prerempli: 'organisation.adresse' },
      { nom: 'nbPresents', libelle: 'Nombre de personnes présentes', type: 'nombre', requis: true },
      { nom: 'objet', libelle: "Le but de l'association, en une phrase", type: 'long', requis: true, prerempli: 'projet.quoi' },
      CHAMP_SIEGE,
      { nom: 'cotisation', libelle: 'Cotisation annuelle décidée (€)', type: 'nombre', aide: 'Laisse vide si vous ne l’avez pas encore fixée.' },
      CHAMP_PRESIDENT,
      CHAMP_TRESORIER,
      CHAMP_SECRETAIRE,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const cot = n(v.cotisation);
      return {
        titre: `Procès-verbal de l'assemblée générale constitutive`,
        sousTitre: `Association « ${nom} »`,
        nomFichier: nomFichier('pv-constitutive', nom),
        blocs: [
          { type: 'para', texte: `Le ${dateFr(v.date)}, à ${t(v.lieu, '…')}, les personnes fondatrices de l'association « ${nom} » se sont réunies en assemblée générale constitutive. ${t(v.nbPresents, '…')} personne(s) étaient présentes. La feuille de présence est jointe.` },
          { type: 'titre', texte: "Ordre du jour", niveau: 2 },
          { type: 'liste', items: ["Présentation du projet d'association", 'Lecture et adoption des statuts', 'Élection du bureau', 'Fixation de la cotisation', "Pouvoirs pour la déclaration en préfecture"] },
          { type: 'titre', texte: '1. Le projet', niveau: 2 },
          { type: 'para', texte: `Le projet est présenté aux personnes présentes : ${t(v.objet, '…')}` },
          { type: 'titre', texte: '2. Adoption des statuts', niveau: 2 },
          { type: 'para', texte: `Les statuts sont lus article par article, puis adoptés à l'unanimité des présents. Le siège de l'association est fixé à : ${t(v.siege, '…')}.` },
          { type: 'titre', texte: '3. Élection du bureau', niveau: 2 },
          { type: 'para', texte: 'Sont élus à l’unanimité des présents, pour la durée prévue par les statuts :' },
          { type: 'liste', items: [`Président·e : ${t(v.president, '…')}`, `Trésorier·ère : ${t(v.tresorier, '…')}`, `Secrétaire : ${t(v.secretaire, '…')}`] },
          { type: 'para', texte: 'Chaque personne élue déclare accepter sa fonction.' },
          { type: 'titre', texte: '4. Cotisation', niveau: 2 },
          { type: 'para', texte: cot > 0 ? `La cotisation annuelle est fixée à ${euros(cot)}.` : "Le montant de la cotisation sera fixé lors de la prochaine assemblée générale." },
          { type: 'titre', texte: '5. Déclaration', niveau: 2 },
          { type: 'para', texte: `L'assemblée donne tous pouvoirs à ${t(v.president, 'la présidence')} pour déclarer l'association en préfecture et demander sa publication au Journal officiel.` },
          { type: 'para', texte: "L'ordre du jour étant épuisé, la séance est levée." },
          { type: 'signatures', lieu: t(v.lieu, '…'), date: dateFr(v.date), noms: [`${t(v.president, '…')}, président·e`, `${t(v.secretaire, '…')}, secrétaire`] },
        ],
      };
    },
  },
  {
    code: 'liste-dirigeants',
    titre: 'La liste des dirigeants',
    enUnMot: 'Qui dirige l’association : la préfecture, la banque et les financeurs la demandent.',
    piece: 'LISTE_DIRIGEANTS',
    etapes: ['declarer-l-association', 'les-cinq-pieces-d-identite'],
    pages: [{ titre: 'Les personnes', champs: ['nom', 'dirigeants'] }, { titre: 'Signature', champs: ['ville', 'date', 'president'] }],
    champs: [
      CHAMP_NOM,
      CHAMP_DATE,
      {
        nom: 'dirigeants',
        libelle: 'Les personnes du bureau',
        type: 'liste',
        requis: true,
        lignesDepart: 3,
        prerempli: 'bureau.liste',
        colonnes: [
          { nom: 'prenom', libelle: 'Prénom', type: 'texte' },
          { nom: 'nom', libelle: 'Nom', type: 'texte' },
          { nom: 'fonction', libelle: 'Fonction', type: 'texte' },
          { nom: 'dateNaissance', libelle: 'Né·e le', type: 'date' },
          { nom: 'profession', libelle: 'Profession', type: 'texte' },
          { nom: 'adresse', libelle: 'Adresse', type: 'texte', large: true },
        ],
      },
      CHAMP_VILLE,
      CHAMP_PRESIDENT,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const ls = lignes(v.dirigeants).filter((l) => t(l.nom) || t(l.prenom));
      return {
        titre: 'Liste des personnes chargées de l’administration',
        sousTitre: `Association « ${nom} » — à jour au ${dateFr(v.date)}`,
        nomFichier: nomFichier('liste-dirigeants', nom),
        blocs: [
          {
            type: 'tableau',
            entetes: ['Prénom et nom', 'Fonction', 'Date de naissance', 'Profession', 'Adresse'],
            largeurs: [22, 16, 16, 16, 30],
            lignes: ls.map((l) => [`${t(l.prenom)} ${t(l.nom)}`.trim(), t(l.fonction), dateFr(l.dateNaissance), t(l.profession), t(l.adresse)]),
          },
          { type: 'para', texte: 'Je certifie exacte la présente liste.' },
          { type: 'signatures', lieu: t(v.ville, '…'), date: dateFr(v.date), noms: [`${t(v.president, '…')}, président·e`] },
        ],
      };
    },
  },
  {
    code: 'pv-ag',
    titre: "Le procès-verbal de l'assemblée générale",
    enUnMot: 'Le compte rendu de votre réunion annuelle : rapports approuvés, comptes votés, bureau élu.',
    piece: 'PV_DERNIERE_AG',
    etapes: ['la-premiere-assemblee-generale'],
    pages: [{ titre: 'La réunion', champs: ['nom', 'date', 'lieu', 'nbPresents', 'nbMembres'] }, { titre: 'Les rapports', champs: ['rapportMoral', 'recettes', 'depenses', 'cotisation', 'projets'] }, { titre: 'Le bureau', champs: ['president', 'tresorier', 'secretaire'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'date', libelle: "Date de l'assemblée", type: 'date', requis: true, prerempli: 'aujourdhui' },
      { nom: 'lieu', libelle: 'Lieu', type: 'texte', requis: true, prerempli: 'organisation.adresse' },
      { nom: 'nbPresents', libelle: 'Membres présents ou représentés', type: 'nombre', requis: true },
      { nom: 'nbMembres', libelle: 'Membres à jour de cotisation', type: 'nombre', requis: true, prerempli: 'repertoire.membresAJour' },
      { nom: 'rapportMoral', libelle: "Ce qu'on a fait cette année (rapport moral, en quelques phrases)", type: 'long', requis: true },
      { nom: 'recettes', libelle: "Recettes de l'année (€)", type: 'nombre', requis: true },
      { nom: 'depenses', libelle: "Dépenses de l'année (€)", type: 'nombre', requis: true },
      { nom: 'cotisation', libelle: "Cotisation votée pour l'année prochaine (€)", type: 'nombre' },
      { nom: 'projets', libelle: "Ce qu'on prévoit l'année prochaine", type: 'long', prerempli: 'projet.quoi' },
      CHAMP_PRESIDENT,
      CHAMP_TRESORIER,
      CHAMP_SECRETAIRE,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const rec = n(v.recettes);
      const dep = n(v.depenses);
      const solde = rec - dep;
      const cot = n(v.cotisation);
      return {
        titre: "Procès-verbal de l'assemblée générale ordinaire",
        sousTitre: `Association « ${nom} » — ${dateFr(v.date)}`,
        nomFichier: nomFichier('pv-ag', nom),
        blocs: [
          { type: 'para', texte: `Le ${dateFr(v.date)}, à ${t(v.lieu, '…')}, les membres de l'association « ${nom} » se sont réunis en assemblée générale ordinaire sur convocation du président. ${t(v.nbPresents, '…')} membres sont présents ou représentés sur ${t(v.nbMembres, '…')} membres à jour de cotisation. La feuille de présence est jointe. La séance est présidée par ${t(v.president, '…')} ; ${t(v.secretaire, '…')} est secrétaire de séance.` },
          { type: 'titre', texte: '1. Rapport moral', niveau: 2 },
          { type: 'para', texte: t(v.rapportMoral, '…') },
          { type: 'para', texte: 'Le rapport moral est approuvé à l’unanimité.', italique: true },
          { type: 'titre', texte: '2. Rapport financier', niveau: 2 },
          { type: 'tableau', entetes: ['', 'Montant'], largeurs: [70, 30], lignes: [['Recettes de l’année', euros(rec)], ['Dépenses de l’année', euros(dep)]], total: [solde >= 0 ? 'Résultat (excédent)' : 'Résultat (déficit)', euros(solde)] },
          { type: 'para', texte: `Les comptes présentés par ${t(v.tresorier, 'la trésorerie')} sont approuvés à l'unanimité et quitus est donné au trésorier.`, italique: true },
          { type: 'titre', texte: '3. Cotisation', niveau: 2 },
          { type: 'para', texte: cot > 0 ? `La cotisation annuelle est fixée à ${euros(cot)} pour l'année prochaine.` : 'La cotisation est maintenue à son montant actuel.' },
          { type: 'titre', texte: '4. Projets', niveau: 2 },
          { type: 'para', texte: t(v.projets, 'Les projets de l’année prochaine sont présentés et discutés.') },
          { type: 'titre', texte: '5. Bureau', niveau: 2 },
          { type: 'para', texte: 'Le bureau en exercice est composé de :' },
          { type: 'liste', items: [`Président·e : ${t(v.president, '…')}`, `Trésorier·ère : ${t(v.tresorier, '…')}`, `Secrétaire : ${t(v.secretaire, '…')}`] },
          { type: 'para', texte: "L'ordre du jour étant épuisé, la séance est levée." },
          { type: 'signatures', lieu: t(v.lieu, '…'), date: dateFr(v.date), noms: [`${t(v.president, '…')}, président·e`, `${t(v.secretaire, '…')}, secrétaire de séance`] },
        ],
      };
    },
  },
  {
    code: 'rapport-activite',
    titre: "Le rapport d'activité",
    enUnMot: 'Ce que vous avez fait dans l’année, avec des chiffres : les financeurs le lisent en premier.',
    piece: 'RAPPORT_ACTIVITE',
    etapes: ['la-premiere-assemblee-generale'],
    pages: [{ titre: 'L’association', champs: ['nom', 'annee', 'presentation'] }, { titre: 'Les actions', champs: ['actions', 'nbBenevoles', 'partenaires'] }, { titre: 'La suite', champs: ['suite', 'president'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'annee', libelle: 'Année', type: 'nombre', requis: true, prerempli: 'anneePassee' },
      { nom: 'presentation', libelle: "L'association en trois phrases", type: 'long', requis: true, prerempli: 'projet.texteCourt' },
      {
        nom: 'actions',
        libelle: 'Les actions de l’année',
        type: 'liste',
        requis: true,
        lignesDepart: 3,
        prerempli: 'actions.liste',
        colonnes: [
          { nom: 'titre', libelle: 'Action', type: 'texte', large: true },
          { nom: 'quand', libelle: 'Quand', type: 'texte' },
          { nom: 'personnes', libelle: 'Personnes touchées', type: 'nombre' },
        ],
      },
      { nom: 'nbBenevoles', libelle: 'Nombre de bénévoles', type: 'nombre', prerempli: 'repertoire.benevoles' },
      { nom: 'partenaires', libelle: 'Partenaires et financeurs de l’année', type: 'texte', aide: 'Mairie de …, école …, entreprise …' },
      { nom: 'suite', libelle: "Et l'année prochaine ?", type: 'long', prerempli: 'projet.quoi' },
      CHAMP_PRESIDENT,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const actions = lignes(v.actions).filter((l) => t(l.titre));
      const total = actions.reduce((s, l) => s + n(l.personnes), 0);
      return {
        titre: `Rapport d'activité ${t(v.annee, '')}`.trim(),
        sousTitre: `Association « ${nom} »`,
        nomFichier: nomFichier(`rapport-activite-${t(v.annee, '')}`, nom),
        blocs: [
          { type: 'titre', texte: "L'association", niveau: 2 },
          { type: 'para', texte: t(v.presentation, '…') },
          { type: 'titre', texte: "Ce que nous avons fait", niveau: 2 },
          { type: 'tableau', entetes: ['Action', 'Quand', 'Personnes touchées'], largeurs: [55, 25, 20], lignes: actions.map((l) => [t(l.titre), t(l.quand), t(l.personnes, '')]), total: ['Total', '', String(total)] },
          { type: 'titre', texte: 'En chiffres', niveau: 2 },
          { type: 'liste', items: [`${actions.length} action${actions.length > 1 ? 's' : ''} menée${actions.length > 1 ? 's' : ''}`, `${total} personne${total > 1 ? 's' : ''} touchée${total > 1 ? 's' : ''}`, `${t(v.nbBenevoles, '…')} bénévole(s) engagé(s)`, `Partenaires : ${t(v.partenaires, '—')}`] },
          { type: 'titre', texte: "L'année prochaine", niveau: 2 },
          { type: 'para', texte: t(v.suite, '…') },
          { type: 'para', texte: `Rapport présenté par ${t(v.president, 'la présidence')} et approuvé en assemblée générale.`, italique: true },
        ],
      };
    },
  },
  {
    code: 'budget-previsionnel',
    titre: 'Le budget prévisionnel',
    enUnMot: 'Ce que ça va coûter à gauche, d’où vient l’argent à droite. Les deux totaux doivent être égaux.',
    piece: 'BUDGET_PREVISIONNEL',
    etapes: ['le-premier-budget'],
    pages: [{ titre: 'Les dépenses', champs: ['nom', 'annee', 'depenses'] }, { titre: 'Les recettes', champs: ['recettes', 'tresorier'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'annee', libelle: 'Année (ou nom du projet)', type: 'texte', requis: true, prerempli: 'anneeProchaine' },
      { nom: 'depenses', libelle: 'Dépenses prévues', type: 'liste', requis: true, lignesDepart: 5, colonnes: COLONNES_ARGENT, aide: 'Matériel, salle, transport, assurance, communication, intervenants…' },
      { nom: 'recettes', libelle: 'Recettes prévues', type: 'liste', requis: true, lignesDepart: 4, colonnes: COLONNES_ARGENT, aide: 'Cotisations, subvention mairie, FDVA, dons, billets, apport de l’association…' },
      CHAMP_TRESORIER,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const d = tableauArgent(v.depenses);
      const r = tableauArgent(v.recettes);
      const ecart = r.total - d.total;
      return {
        titre: `Budget prévisionnel ${t(v.annee, '')}`.trim(),
        sousTitre: `Association « ${nom} »`,
        nomFichier: nomFichier('budget-previsionnel', nom),
        blocs: [
          { type: 'titre', texte: 'Dépenses', niveau: 2 },
          { type: 'tableau', entetes: ['Quoi', 'Montant'], largeurs: [70, 30], lignes: d.lignes, total: ['Total des dépenses', euros(d.total)] },
          { type: 'titre', texte: 'Recettes', niveau: 2 },
          { type: 'tableau', entetes: ['D’où vient l’argent', 'Montant'], largeurs: [70, 30], lignes: r.lignes, total: ['Total des recettes', euros(r.total)] },
          { type: 'para', texte: ecart === 0 ? 'Le budget est équilibré : les recettes couvrent exactement les dépenses.' : ecart > 0 ? `Attention : les recettes dépassent les dépenses de ${euros(ecart)}. Un budget prévisionnel doit être équilibré : ajoute une dépense ou baisse une recette.` : `Attention : il manque ${euros(-ecart)} de recettes. Un budget prévisionnel doit être équilibré : ajoute une recette (subvention, cotisations, apport) ou baisse une dépense.`, gras: ecart !== 0 },
          { type: 'para', texte: `Budget établi par ${t(v.tresorier, 'la trésorerie')}.`, italique: true },
        ],
      };
    },
  },
  {
    code: 'comptes-annuels',
    titre: "Les comptes de l'année",
    enUnMot: 'Ce qui est entré, ce qui est sorti, ce qu’il reste : le compte rendu financier de l’année passée.',
    piece: 'COMPTES_ANNUELS',
    etapes: ['tenir-des-comptes-simples', 'la-premiere-assemblee-generale'],
    pages: [{ titre: 'Les recettes', champs: ['nom', 'annee', 'soldeDebut', 'recettes'] }, { titre: 'Les dépenses', champs: ['depenses'] }, { titre: 'Approbation', champs: ['dateApprobation', 'tresorier', 'president'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'annee', libelle: 'Année', type: 'nombre', requis: true, prerempli: 'anneePassee' },
      { nom: 'soldeDebut', libelle: 'Argent sur le compte au 1er janvier (€)', type: 'nombre', requis: true },
      { nom: 'recettes', libelle: "Recettes de l'année", type: 'liste', requis: true, lignesDepart: 4, colonnes: COLONNES_ARGENT },
      { nom: 'depenses', libelle: "Dépenses de l'année", type: 'liste', requis: true, lignesDepart: 5, colonnes: COLONNES_ARGENT },
      { nom: 'dateApprobation', libelle: "Date de l'assemblée qui approuve les comptes", type: 'date', prerempli: 'aujourdhui' },
      CHAMP_TRESORIER,
      CHAMP_PRESIDENT,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const r = tableauArgent(v.recettes);
      const d = tableauArgent(v.depenses);
      const debut = n(v.soldeDebut);
      const resultat = r.total - d.total;
      const fin = debut + resultat;
      return {
        titre: `Comptes de l'année ${t(v.annee, '')}`.trim(),
        sousTitre: `Association « ${nom} »`,
        nomFichier: nomFichier(`comptes-${t(v.annee, '')}`, nom),
        blocs: [
          { type: 'titre', texte: 'Recettes', niveau: 2 },
          { type: 'tableau', entetes: ['Quoi', 'Montant'], largeurs: [70, 30], lignes: r.lignes, total: ['Total des recettes', euros(r.total)] },
          { type: 'titre', texte: 'Dépenses', niveau: 2 },
          { type: 'tableau', entetes: ['Quoi', 'Montant'], largeurs: [70, 30], lignes: d.lignes, total: ['Total des dépenses', euros(d.total)] },
          { type: 'titre', texte: 'Résultat', niveau: 2 },
          { type: 'tableau', entetes: ['', 'Montant'], largeurs: [70, 30], lignes: [['Argent au 1er janvier', euros(debut)], [resultat >= 0 ? "Excédent de l'année" : "Déficit de l'année", euros(resultat)]], total: ['Argent au 31 décembre', euros(fin)] },
          { type: 'para', texte: `Comptes établis par ${t(v.tresorier, 'la trésorerie')}${t(v.dateApprobation) ? ` et approuvés par l'assemblée générale du ${dateFr(v.dateApprobation)}` : ''}.`, italique: true },
          { type: 'signatures', lieu: '', date: '', noms: [`${t(v.tresorier, '…')}, trésorier·ère`, `${t(v.president, '…')}, président·e`] },
        ],
      };
    },
  },
  {
    code: 'projet-en-une-page',
    titre: 'Le projet en une page',
    enUnMot: 'Pour qui, quoi, comment, et après : la page que tout financeur lit en premier.',
    categorie: 'Projet',
    etapes: ['le-projet-en-une-page'],
    pages: [{ titre: 'Le projet', champs: ['nom', 'titreProjet', 'pourQui', 'quoi'] }, { titre: 'Comment et après', champs: ['comment', 'apres'] }, { titre: 'La demande', champs: ['demande', 'president'] }],
    champs: [
      CHAMP_NOM,
      { nom: 'titreProjet', libelle: 'Le nom du projet', type: 'texte', requis: true, aide: 'Court et concret : « Ateliers devoirs du mercredi ».' },
      { nom: 'pourQui', libelle: 'Pour qui ?', type: 'long', requis: true, prerempli: 'projet.pourQui', aide: 'Qui sont les gens, combien, où, et quel est leur problème.' },
      { nom: 'quoi', libelle: 'Quoi ?', type: 'long', requis: true, prerempli: 'projet.quoi', aide: 'Ce que vous allez faire, concrètement.' },
      { nom: 'comment', libelle: 'Comment ?', type: 'long', requis: true, prerempli: 'projet.comment', aide: 'Quand, où, avec qui, avec quel matériel.' },
      { nom: 'apres', libelle: 'Et après ?', type: 'long', requis: true, prerempli: 'projet.apres', aide: 'Ce qui aura changé, et comment vous le saurez.' },
      { nom: 'demande', libelle: 'Ce que vous demandez', type: 'texte', requis: true, prerempli: 'projet.demande', aide: '« 1 500 € à la mairie pour le matériel et la salle. »' },
      CHAMP_PRESIDENT,
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      return {
        titre: t(v.titreProjet, 'Notre projet'),
        sousTitre: `Un projet de l'association « ${nom} »`,
        nomFichier: nomFichier('projet', t(v.titreProjet, nom)),
        blocs: [
          { type: 'titre', texte: 'Pour qui ?', niveau: 2 },
          { type: 'para', texte: t(v.pourQui, '…') },
          { type: 'titre', texte: 'Quoi ?', niveau: 2 },
          { type: 'para', texte: t(v.quoi, '…') },
          { type: 'titre', texte: 'Comment ?', niveau: 2 },
          { type: 'para', texte: t(v.comment, '…') },
          { type: 'titre', texte: 'Et après ?', niveau: 2 },
          { type: 'para', texte: t(v.apres, '…') },
          { type: 'titre', texte: 'Ce que nous demandons', niveau: 2 },
          { type: 'para', texte: t(v.demande, '…'), gras: true },
          { type: 'para', texte: `Contact : ${t(v.president, '…')}, président·e.`, italique: true },
        ],
      };
    },
  },
  {
    code: 'lettre-mairie',
    titre: 'La lettre de demande à la mairie',
    enUnMot: 'Une page pour accompagner ton dossier : qui vous êtes, ce que vous faites, ce que vous demandez.',
    categorie: 'Courriers',
    etapes: ['trouver-le-premier-financeur', 'constituer-et-deposer-le-dossier'],
    pages: [{ titre: 'Qui écrit à qui', champs: ['nom', 'siege', 'commune', 'president', 'telephone', 'email'] }, { titre: 'Le projet', champs: ['titreProjet', 'resume', 'montant', 'budgetTotal', 'date'] }],
    champs: [
      CHAMP_NOM,
      CHAMP_SIEGE,
      { nom: 'commune', libelle: 'La commune à qui tu écris', type: 'texte', requis: true, prerempli: 'organisation.commune' },
      { nom: 'titreProjet', libelle: 'Le nom du projet', type: 'texte', requis: true },
      { nom: 'resume', libelle: 'Le projet en trois phrases', type: 'long', requis: true, prerempli: 'projet.texteCourt' },
      { nom: 'montant', libelle: 'Montant demandé (€)', type: 'nombre', requis: true },
      { nom: 'budgetTotal', libelle: 'Coût total du projet (€)', type: 'nombre', requis: true },
      CHAMP_DATE,
      CHAMP_PRESIDENT,
      { nom: 'telephone', libelle: 'Téléphone', type: 'texte' },
      { nom: 'email', libelle: 'E-mail', type: 'texte' },
    ],
    construire: (v) => {
      const nom = t(v.nom, "l'association");
      const montant = n(v.montant);
      const total = n(v.budgetTotal);
      const part = total > 0 ? Math.round((montant / total) * 100) : 0;
      return {
        titre: `Demande de subvention – ${t(v.titreProjet, 'notre projet')}`,
        nomFichier: nomFichier('lettre-mairie', nom),
        blocs: [
          { type: 'para', texte: `${nom}\n${t(v.siege, '')}\n${[t(v.telephone), t(v.email)].filter(Boolean).join(' · ')}`.trim() },
          { type: 'espace' },
          { type: 'para', texte: `Madame la Maire, Monsieur le Maire,\nMairie de ${t(v.commune, '…')}` },
          { type: 'para', texte: `${t(v.commune, '…')}, le ${dateFr(v.date)}` },
          { type: 'para', texte: `Objet : demande de subvention pour le projet « ${t(v.titreProjet, '…')} »`, gras: true },
          { type: 'espace' },
          { type: 'para', texte: 'Madame la Maire, Monsieur le Maire,' },
          { type: 'para', texte: `L'association « ${nom} » sollicite le soutien de la commune pour le projet « ${t(v.titreProjet, '…')} ». ${t(v.resume, '…')}` },
          { type: 'para', texte: `Le coût total du projet est de ${euros(total)}. Nous sollicitons une subvention de ${euros(montant)}${part ? ` (${part} % du budget)` : ''} ; le reste est couvert par nos cotisations, nos autres partenaires et nos fonds propres. Vous trouverez ci-joint le dossier de demande (formulaire CERFA 12156), le projet en une page, le budget prévisionnel et les pièces de l'association.` },
          { type: 'para', texte: "Nous restons à votre disposition pour vous présenter le projet de vive voix, et nous vous remercions de l'attention que vous porterez à notre demande." },
          { type: 'para', texte: 'Veuillez agréer, Madame la Maire, Monsieur le Maire, l’expression de nos salutations respectueuses.' },
          { type: 'signatures', lieu: '', date: '', noms: [`${t(v.president, '…')}, président·e de « ${nom} »`] },
        ],
      };
    },
  },
];

export function trouverModele(code: string): Modele | undefined {
  return MODELES.find((m) => m.code === code.toLowerCase());
}

/** Ce que le site affiche : tout sauf la fonction de construction. */
export function catalogueModeles() {
  return MODELES.map(({ construire: _c, ...reste }) => reste);
}

/** Les champs obligatoires manquants, pour un message clair. */
export function champsManquants(modele: Modele, valeurs: Valeurs): string[] {
  return modele.champs
    .filter((c) => c.requis)
    .filter((c) => {
      const v = valeurs[c.nom];
      if (c.type === 'liste') return lignes(v).filter((l) => Object.values(l).some((x) => t(x))).length === 0;
      return !t(v);
    })
    .map((c) => c.libelle);
}
