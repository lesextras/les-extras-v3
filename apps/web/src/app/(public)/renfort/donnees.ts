// Pages de référencement local : un métier, une ville.
//
// Attention au piège : générer mécaniquement métier × ville produit des
// centaines de pages qui se ressemblent, et Google sanctionne. On génère donc
// des pages métier ET des pages ville, jamais leur produit, et chacune porte un
// contenu qui lui est propre — ce qu'un éducateur spécialisé fait la nuit n'est
// pas ce que fait un AES, et Melun n'est pas Créteil.

export interface Metier {
  slug: string;
  nom: string;
  /** Pluriel, pour les titres. */
  pluriel: string;
  accroche: string;
  /** Ce que le renfort couvre concrètement pour ce métier. */
  missions: string[];
  /** Diplômes et pièces vérifiés avant mise en relation. */
  verifications: string[];
  /** Structures qui recrutent le plus ce profil. */
  structures: string;
}

export const METIERS: Metier[] = [
  {
    slug: "educateur-specialise",
    nom: "Éducateur spécialisé",
    pluriel: "Éducateurs spécialisés",
    accroche:
      "Un poste d'éducateur spécialisé à couvrir, ce soir ou sur trois semaines. Le besoin descend en cascade et s'arrête dès qu'il est pourvu.",
    missions: [
      "Remplacement d'internat, journée ou nuit",
      "Renfort sur une période de tension : arrêt maladie, congés, surcroît",
      "Accompagnement individuel sur une situation complexe",
      "Relais éducatif pendant une vacance de poste",
    ],
    verifications: [
      "Diplôme d'État d'éducateur spécialisé",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "MECS, ITEP, IME, foyers de vie, SESSAD, prévention spécialisée",
  },
  {
    slug: "moniteur-educateur",
    nom: "Moniteur-éducateur",
    pluriel: "Moniteurs-éducateurs",
    accroche:
      "Un moniteur-éducateur en renfort sur le quotidien de l'unité, sans passer par une agence.",
    missions: [
      "Accompagnement du quotidien : lever, repas, coucher",
      "Animation d'activités éducatives sur la période",
      "Renfort de nuit ou de week-end",
      "Doublure pendant une formation d'un membre de l'équipe",
    ],
    verifications: [
      "Diplôme d'État de moniteur-éducateur",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "MECS, IME, ITEP, foyers d'hébergement, accueils de jour",
  },
  {
    slug: "aes-amp",
    nom: "AES / AMP",
    pluriel: "Accompagnants éducatifs et sociaux",
    accroche:
      "Un accompagnant éducatif et social pour tenir le quotidien quand l'effectif manque.",
    missions: [
      "Aide aux actes de la vie quotidienne",
      "Renfort en EHPAD, FAM ou MAS sur une période de tension",
      "Accompagnement à la vie sociale et aux activités",
      "Remplacement sur des cycles longs",
    ],
    verifications: [
      "Diplôme d'État d'accompagnant éducatif et social",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "EHPAD, FAM, MAS, foyers de vie, SAVS",
  },
  {
    slug: "educateur-jeunes-enfants",
    nom: "Éducateur de jeunes enfants",
    pluriel: "Éducateurs de jeunes enfants",
    accroche:
      "Un éducateur de jeunes enfants sur un remplacement, avec un profil vérifié avant la mise en relation.",
    missions: [
      "Remplacement en pouponnière ou en crèche associative",
      "Accompagnement du très jeune enfant en protection de l'enfance",
      "Renfort sur un projet d'éveil ou de soutien à la parentalité",
    ],
    verifications: [
      "Diplôme d'État d'éducateur de jeunes enfants",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "Pouponnières, crèches, MECS petite enfance, SESSAD",
  },
  {
    slug: "psychologue",
    nom: "Psychologue",
    pluriel: "Psychologues",
    accroche:
      "Un psychologue en vacation, pour des entretiens, de l'analyse de pratique ou un appui à l'équipe.",
    missions: [
      "Entretiens individuels auprès du public accueilli",
      "Animation d'analyse de pratique auprès de l'équipe",
      "Appui à l'élaboration des projets personnalisés",
      "Soutien après un événement difficile",
    ],
    verifications: [
      "Master de psychologie et numéro ADELI",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "MECS, ITEP, IME, EHPAD, SESSAD, services de prévention",
  },
  {
    slug: "chef-de-service",
    nom: "Chef de service",
    pluriel: "Chefs de service",
    accroche:
      "Un cadre intermédiaire pour tenir l'intérim d'un poste d'encadrement, le temps d'un recrutement.",
    missions: [
      "Intérim de direction d'unité pendant une vacance de poste",
      "Appui à la réorganisation d'un service",
      "Encadrement d'équipe sur une période de tension",
    ],
    verifications: [
      "CAFERUIS ou équivalent, et expérience d'encadrement",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "MECS, IME, ITEP, EHPAD, sièges associatifs",
  },
  {
    slug: "animateur",
    nom: "Animateur",
    pluriel: "Animateurs",
    accroche:
      "Un animateur pour tenir les temps collectifs, les vacances scolaires ou un projet ponctuel.",
    missions: [
      "Animation des temps collectifs et des vacances scolaires",
      "Projets d'expression : sport, création, médiation",
      "Renfort sur les temps forts de l'année",
    ],
    verifications: [
      "BPJEPS, BAFA ou diplôme équivalent",
      "Extrait de casier judiciaire n° 3",
      "Attestation de vigilance URSSAF",
      "Pièce d'identité et assurance",
    ],
    structures: "MECS, IME, accueils de loisirs, foyers, prévention spécialisée",
  },
];

export interface Ville {
  slug: string;
  nom: string;
  departement: string;
  /** Ce qui caractérise le tissu médico-social local, sans chiffre inventé. */
  contexte: string;
  /** Communes couvertes depuis cette base. */
  autour: string[];
}

export const VILLES: Ville[] = [
  {
    slug: "melun",
    nom: "Melun",
    departement: "Seine-et-Marne",
    contexte:
      "Melun est la ville où l'association est implantée depuis 2012. C'est le secteur où le réseau d'intervenants est le plus dense et où les délais de mise en relation sont les plus courts.",
    autour: ["Dammarie-lès-Lys", "Le Mée-sur-Seine", "Vaux-le-Pénil", "Savigny-le-Temple"],
  },
  {
    slug: "seine-et-marne",
    nom: "Seine-et-Marne",
    departement: "Seine-et-Marne",
    contexte:
      "Un département étendu, où la distance entre structures allonge les délais de remplacement. La diffusion par palier commence par les intervenants déjà venus chez vous, donc les plus proches.",
    autour: ["Melun", "Meaux", "Chelles", "Fontainebleau", "Provins", "Coulommiers"],
  },
  {
    slug: "essonne",
    nom: "Essonne",
    departement: "Essonne",
    contexte:
      "L'Essonne concentre de nombreux établissements de protection de l'enfance et du handicap, avec des besoins de renfort récurrents sur les internats.",
    autour: ["Évry-Courcouronnes", "Corbeil-Essonnes", "Massy", "Étampes", "Palaiseau"],
  },
  {
    slug: "val-de-marne",
    nom: "Val-de-Marne",
    departement: "Val-de-Marne",
    contexte:
      "Un territoire dense, bien desservi par les transports : un intervenant peut couvrir plusieurs communes dans la même semaine.",
    autour: ["Créteil", "Vitry-sur-Seine", "Champigny-sur-Marne", "Ivry-sur-Seine"],
  },
  {
    slug: "paris",
    nom: "Paris",
    departement: "Paris",
    contexte:
      "À Paris, la tension sur les postes éducatifs est constante et les remplacements se décident souvent la veille. Les notifications sur téléphone y font la différence.",
    autour: ["Paris 12e", "Paris 13e", "Paris 18e", "Paris 19e", "Paris 20e"],
  },
  {
    slug: "seine-saint-denis",
    nom: "Seine-Saint-Denis",
    departement: "Seine-Saint-Denis",
    contexte:
      "Un département où la protection de l'enfance et la prévention spécialisée sont très présentes, avec des équipes souvent en sous-effectif.",
    autour: ["Bobigny", "Saint-Denis", "Montreuil", "Aulnay-sous-Bois", "Aubervilliers"],
  },
];

export function trouverMetier(slug: string): Metier | undefined {
  return METIERS.find((m) => m.slug === slug);
}

export function trouverVille(slug: string): Ville | undefined {
  return VILLES.find((v) => v.slug === slug);
}
