// PAGES SECTORIELLES DES ATELIERS — une par type d'établissement.
//
// POURQUOI (2 septembre 2026). Le benchmark a montré que notre concurrent
// direct sur les écrits professionnels tient sept pages d'atterrissage, une
// par type d'établissement, chacune dans son vocabulaire. C'est la moitié de
// son avance en référencement : une direction d'IME ne cherche pas « atelier
// médico-social », elle cherche « atelier IME » ou « intervenant extérieur
// IME ». Nous n'avions ce découpage que pour le renfort — par métier et par
// territoire — et rien du tout pour les ateliers, qui sont pourtant le seul
// terrain où personne ne nous attend.
//
// LE PIÈGE À ÉVITER, et il est sérieux : six pages qui décriraient le même
// produit avec six titres différents sont du contenu dupliqué, et Google le
// sanctionne. Chaque page porte donc un contenu qui lui est PROPRE — ce qu'un
// atelier fait dans un ITEP n'est pas ce qu'il fait dans un EHPAD, et ce qu'une
// direction vérifie avant de faire entrer quelqu'un n'est pas le même selon
// qu'elle accueille des mineurs confiés par un juge ou des adultes en ESAT.
//
// RÈGLE D'ÉCRITURE. Aucune référence juridique n'est citée sans avoir été
// vérifiée article par article. Les articles L311-3 et L311-4 du CASF valent
// pour tous les établissements sociaux et médico-sociaux : ils sont donc posés
// une fois pour toutes dans le gabarit. Les références propres à un type
// (D312-59-2 pour les ITEP, article 375 du code civil et L223-5 du CASF pour
// la protection de l'enfance, D351-10 du code de l'éducation pour l'ESS) ne
// figurent que là où elles s'appliquent réellement. Aucune définition n'est
// adossée à un numéro d'article que nous n'avons pas relu.

export interface Etablissement {
  slug: string;
  /** Sigle, tel qu'on le cherche. */
  sigle: string;
  /** Nom développé. */
  nom: string;
  /** H1 de la page. */
  accroche: string;
  /** Balise title — le suffixe « · LES EXTRAS » ajoute 13 caractères. */
  titre: string;
  description: string;
  /** Ce qu'est cet établissement, en deux ou trois phrases. */
  presentation: string;
  /** Le public accueilli, dit simplement. */
  publicAccueilli: string;
  /** Ce qu'un atelier vient faire ICI, et pas ailleurs. */
  cequunAtelierApporte: string[];
  /** Les contraintes propres au lieu, que l'intervenant doit connaître. */
  contraintes: string[];
  /** Ce que la direction contrôle avant de faire entrer quelqu'un. */
  avantDeFaireEntrer: string[];
  /** Références juridiques propres au type. Vide si aucune n'est vérifiée. */
  cadre: { quoi: string; ou: string }[];
}

/**
 * Le socle réglementaire commun à TOUS les établissements et services sociaux
 * et médico-sociaux : il est affiché sur chaque page, en plus du cadre propre
 * au type. Les trois références ont été relues le 2 septembre 2026.
 */
export const SOCLE_COMMUN: { quoi: string; ou: string }[] = [
  {
    quoi: 'La personne accueillie a droit à la participation directe à la conception et à la mise en œuvre du projet d’accueil et d’accompagnement qui la concerne.',
    ou: 'Code de l’action sociale et des familles, article L311-3, 7°',
  },
  {
    quoi: 'Un contrat de séjour est conclu ou un document individuel de prise en charge est établi.',
    ou: 'Code de l’action sociale et des familles, article L311-4',
  },
  {
    quoi: 'Le document est remis dans les quinze jours suivant l’admission et conclu dans le mois ; un avenant précise les objectifs dans un délai maximum de six mois, puis il est réactualisé chaque année.',
    ou: 'Code de l’action sociale et des familles, article D311',
  },
];

export const ETABLISSEMENTS: Etablissement[] = [
  {
    slug: 'ime',
    sigle: 'IME',
    nom: 'Institut médico-éducatif',
    accroche: 'Faire intervenir un atelier en IME',
    titre: 'Ateliers pour IME',
    description:
      'Comment faire entrer un atelier dans un institut médico-éducatif : ce qui fonctionne avec des enfants et adolescents en situation de handicap, les contraintes du lieu, et les pièces à réunir avant la première séance.',
    presentation:
      'Un institut médico-éducatif accompagne des enfants et des adolescents en situation de handicap, le plus souvent avec une déficience intellectuelle et des troubles associés. Il combine dans un même lieu de l’éducatif, du pédagogique — l’unité d’enseignement — et du thérapeutique. Les journées y sont donc déjà denses, réparties entre plusieurs professionnels qui ne se croisent pas toujours.',
    publicAccueilli:
      'Des jeunes dont les rythmes, les niveaux de compréhension et les capacités d’attention sont très hétérogènes à l’intérieur d’un même groupe. C’est la donnée qui détermine tout le reste : un atelier conçu pour un niveau moyen ne fonctionne pas ici.',
    cequunAtelierApporte: [
      'Un support que l’équipe ne peut pas porter seule — musicothérapie, socio-esthétique, activité physique adaptée : des médiations qui demandent une compétence et un matériel spécifiques.',
      'Un regard extérieur sur des jeunes qui, dans le quotidien, sont d’abord vus à travers leurs difficultés. Une séance où quelqu’un découvre un jeune sans son dossier change souvent ce que l’équipe en dit ensuite.',
      'Une trace mobilisable pour l’ESS ou le projet personnalisé : ce qu’un jeune a réussi dans un atelier est un élément d’évaluation, pas une anecdote.',
      'Un rythme qui coupe la semaine, ce que les équipes cherchent particulièrement sur les périodes longues sans vacances scolaires.',
    ],
    contraintes: [
      'Des groupes de six à huit au maximum : au-delà, les écarts de niveau rendent la séance ingérable pour un intervenant seul.',
      'Une durée courte — trente à quarante-cinq minutes de participation réelle, pas davantage — et un déroulé toujours identique d’une séance à l’autre.',
      'La présence d’au moins un professionnel de l’établissement pendant toute la séance : ce n’est pas une question de confiance, c’est ce qui permet de gérer une sortie de groupe sans interrompre l’atelier.',
      'Des consignes accessibles : phrases courtes, appui visuel, démonstration avant explication.',
    ],
    avantDeFaireEntrer: [
      'Le diplôme ou la qualification correspondant à la médiation proposée.',
      'L’extrait de casier judiciaire n° 3 — non négociable dès lors qu’il y a des mineurs.',
      'L’attestation d’assurance en responsabilité civile professionnelle en cours de validité.',
      'Une fiche d’atelier écrite : objectifs, déroulé, matériel apporté, matériel attendu de l’établissement.',
    ],
    cadre: [
      {
        quoi: 'L’équipe de suivi de la scolarisation évalue au moins une fois par an le projet personnalisé de scolarisation et sa mise en œuvre ; elle est réunie et coordonnée par l’enseignant référent.',
        ou: 'Code de l’éducation, articles D351-10 et D351-12',
      },
    ],
  },
  {
    slug: 'itep',
    sigle: 'ITEP',
    nom: 'Institut thérapeutique, éducatif et pédagogique',
    accroche: 'Faire intervenir un atelier en ITEP',
    titre: 'Ateliers pour ITEP',
    description:
      'Faire entrer un atelier en ITEP ou en DITEP : pourquoi les supports indirects fonctionnent mieux que l’entretien, ce que l’intervenant doit savoir avant d’arriver, et les pièces à réunir.',
    presentation:
      'Un institut thérapeutique, éducatif et pédagogique accompagne des enfants et des adolescents dont les difficultés psychologiques s’expriment par des troubles du comportement qui perturbent gravement la socialisation et l’accès aux apprentissages. Beaucoup fonctionnent aujourd’hui en dispositif — le DITEP —, ce qui veut dire que le même jeune peut passer de l’accueil de jour à l’internat ou au service ambulatoire sans changer d’équipe.',
    publicAccueilli:
      'Des jeunes dont l’intelligence n’est pas en cause et qui le savent, ce qui rend l’échec particulièrement coûteux pour eux. La question de la place, du regard des autres et de la réparation après un débordement traverse à peu près toutes les séances.',
    cequunAtelierApporte: [
      'Un détour. Ce qui ne peut pas se dire en entretien passe souvent par le corps, le son ou l’image — c’est la raison d’être des médiations dans ce type d’établissement, pas un supplément d’âme.',
      'Un cadre où l’échec est réparable dans la même séance. Une prise ratée en psycho-boxe, un texte qui ne tient pas en slam : on recommence, et c’est exactement ce que le jeune ne peut pas faire à l’école.',
      'Un adulte qui n’a pas d’histoire avec lui. Un intervenant extérieur n’arrive pas avec le souvenir de la crise de la semaine dernière, et cela suffit parfois à débloquer une situation.',
      'Des éléments concrets pour le projet personnalisé d’accompagnement, sur des registres que le quotidien de l’unité ne met pas en évidence.',
    ],
    contraintes: [
      'Un cadre annoncé au début de chaque séance et tenu à l’identique : ce qui est autorisé, ce qui ne l’est pas, ce qui se passe si ça déborde. Un cadre qui varie est lu comme une faille.',
      'Une sortie possible sans humiliation. Un jeune doit pouvoir quitter la séance et y revenir — un intervenant qui transforme la sortie en sanction perd le groupe.',
      'Pas d’interprétation à voix haute. L’intervenant décrit ce qu’il a vu, il ne qualifie pas ce qu’il en pense : cela appartient à l’équipe et au psychologue.',
      'Un point de cinq minutes avec l’éducateur présent après la séance. C’est là que se transmet l’essentiel, et c’est ce que la plupart des intervenants oublient de prévoir dans leur temps.',
    ],
    avantDeFaireEntrer: [
      'La qualification correspondant à la médiation, et une expérience réelle du public adolescent.',
      'L’extrait de casier judiciaire n° 3.',
      'L’attestation d’assurance en responsabilité civile professionnelle.',
      'Pour toute médiation corporelle, l’assurance couvrant explicitement l’activité pratiquée.',
    ],
    cadre: [
      {
        quoi: 'Le régime propre aux ITEP prévoit un projet personnalisé d’accompagnement.',
        ou: 'Code de l’action sociale et des familles, article D312-59-2',
      },
    ],
  },
  {
    slug: 'mecs',
    sigle: 'MECS',
    nom: 'Maison d’enfants à caractère social',
    accroche: 'Faire intervenir un atelier en MECS',
    titre: 'Ateliers pour MECS et foyers',
    description:
      'Un atelier en maison d’enfants à caractère social : ce qui marche avec des jeunes confiés, ce que l’intervenant doit savoir du cadre judiciaire, et les pièces exigées avant la première séance.',
    presentation:
      'Une maison d’enfants à caractère social accueille des mineurs, et parfois de jeunes majeurs, dans le cadre de la protection de l’enfance. Certains sont confiés par un juge des enfants au titre de l’assistance éducative, d’autres accueillis dans un cadre administratif avec l’accord des parents. Cette différence, invisible dans le quotidien du groupe, change tout au droit qui s’applique.',
    publicAccueilli:
      'Des jeunes séparés de leur famille, souvent depuis longtemps, pour qui l’arrivée d’un adulte de plus est un événement à faible valeur ajoutée — sauf s’il revient. La régularité compte ici davantage que le contenu.',
    cequunAtelierApporte: [
      'Un temps qui n’est pas un temps de gestion. Le quotidien d’un foyer est fait de lever, de repas, de devoirs et de conflits ; un atelier est l’un des rares moments où l’adulte présent ne demande rien d’autre que de faire.',
      'Une production qui sort du foyer. Un texte, une photo, une vidéo montrable — la valorisation à l’extérieur est un levier que les équipes n’ont pas les moyens de fabriquer seules.',
      'Un support pour parler de soi sans être interrogé, ce qui est rarement possible ailleurs pour un jeune dont l’histoire est déjà écrite dans un dossier.',
      'Des observations utilisables dans le rapport de situation annuel, à condition qu’elles soient factuelles et datées.',
    ],
    contraintes: [
      'Le droit à l’image est ici plus complexe qu’ailleurs : l’autorisation relève des titulaires de l’autorité parentale, que le jeune soit confié ou non. Un atelier photo ou vidéo se prépare avec la direction avant la première séance, jamais après.',
      'Aucune information sur la situation familiale ne se demande au jeune. Ce qu’il en dit, il le dit ; l’intervenant n’a pas à en savoir plus, et ne doit pas le noter.',
      'Ce que le jeune confie et qui inquiète se transmet immédiatement au cadre de permanence, oralement puis par écrit. Qualifier un danger n’appartient pas à l’intervenant extérieur.',
      'Des groupes qui changent d’une séance à l’autre : les arrivées et les départs sont la règle, pas l’exception. Un atelier qui suppose la présence des mêmes jeunes pendant dix semaines ne tiendra pas.',
    ],
    avantDeFaireEntrer: [
      'L’extrait de casier judiciaire n° 3 — vérifié systématiquement, et récent.',
      'La qualification correspondant à la médiation proposée.',
      'L’attestation d’assurance en responsabilité civile professionnelle.',
      'Un déroulé écrit précisant ce qui est produit, ce qui en est conservé et ce qui en sort de l’établissement.',
    ],
    cadre: [
      {
        quoi: 'Un rapport concernant la situation de l’enfant doit être transmis annuellement au juge des enfants.',
        ou: 'Code civil, article 375, dernier alinéa',
      },
      {
        quoi: 'Le service élabore au moins une fois par an un rapport sur la situation de tout enfant accueilli — tous les six mois avant deux ans ; son contenu est porté à la connaissance des parents et du mineur selon son âge et sa maturité.',
        ou: 'Code de l’action sociale et des familles, article L223-5',
      },
    ],
  },
  {
    slug: 'sessad',
    sigle: 'SESSAD',
    nom: 'Service d’éducation spéciale et de soins à domicile',
    accroche: 'Faire intervenir un atelier avec un SESSAD',
    titre: 'Ateliers pour SESSAD',
    description:
      'Organiser un atelier collectif quand le service n’a pas de murs : ce que change l’intervention sur les lieux de vie, les formats qui tiennent, et les pièces à réunir.',
    presentation:
      'Un service d’éducation spéciale et de soins à domicile accompagne des enfants et des adolescents sur leurs lieux de vie — le domicile, l’école, parfois la crèche ou le lieu de stage. Il n’a pas de collectif permanent : c’est ce qui le distingue de tous les autres établissements de cette liste, et c’est ce qui rend l’organisation d’un atelier plus délicate.',
    publicAccueilli:
      'Des jeunes scolarisés en milieu ordinaire la plupart du temps, souvent seuls de leur situation dans leur classe. Le collectif est précisément ce qui leur manque, et ce qu’un atelier peut leur offrir ponctuellement.',
    cequunAtelierApporte: [
      'Le groupe, justement. Se retrouver avec d’autres jeunes accompagnés par le même service est, pour beaucoup, la première occasion de ne pas être l’exception.',
      'Un temps fort qui donne au service une actualité à partager avec les familles et avec les établissements scolaires partenaires.',
      'Un support commun aux professionnels du service, qui travaillent le reste du temps chacun de leur côté.',
      'Des observations en situation collective, que le suivi individuel ne permet jamais de recueillir — et qui alimentent utilement l’équipe de suivi de la scolarisation.',
    ],
    contraintes: [
      'Un format court et concentré : une demi-journée, ou un cycle de trois séances sur les vacances scolaires, plutôt qu’un rendez-vous hebdomadaire que les emplois du temps ne supportent pas.',
      'Un lieu à trouver — locaux du service, salle municipale, établissement partenaire. La question du lieu se règle avant celle du contenu, pas l’inverse.',
      'Des âges et des situations très hétérogènes dans le même groupe, puisque le service ne recrute pas par classe d’âge.',
      'Le transport, qui est presque toujours le vrai facteur limitant. Un atelier réussi dont la moitié du groupe n’a pas pu venir n’est pas un atelier réussi.',
    ],
    avantDeFaireEntrer: [
      'La qualification correspondant à la médiation proposée.',
      'L’extrait de casier judiciaire n° 3.',
      'L’attestation d’assurance en responsabilité civile professionnelle, couvrant l’intervention hors les murs.',
      'Une fiche précisant le matériel apporté et l’espace nécessaire — un service sans locaux ne peut pas improviser.',
    ],
    cadre: [
      {
        quoi: 'L’équipe de suivi de la scolarisation évalue au moins une fois par an le projet personnalisé de scolarisation ; le GEVA-Sco réexamen, rempli par l’enseignant référent, vaut compte rendu de la réunion.',
        ou: 'Code de l’éducation, article D351-10 ; arrêté du 6 février 2015',
      },
    ],
  },
  {
    slug: 'esat',
    sigle: 'ESAT',
    nom: 'Établissement et service d’aide par le travail',
    accroche: 'Faire intervenir un atelier en ESAT',
    titre: 'Ateliers pour ESAT',
    description:
      'Un atelier en ESAT : articuler l’activité de production et le soutien médico-social, choisir un créneau qui ne désorganise pas la chaîne, et réunir les pièces nécessaires.',
    presentation:
      'Un établissement et service d’aide par le travail accueille des adultes en situation de handicap dans une activité professionnelle en milieu protégé, assortie d’un soutien médico-social. Les deux dimensions coexistent en permanence : c’est un lieu de travail, avec des délais et des clients, et un lieu d’accompagnement.',
    publicAccueilli:
      'Des adultes, souvent depuis de nombreuses années dans la même structure, pour qui le statut de travailleur est central. C’est la première chose à respecter : on ne s’adresse pas ici à des personnes accompagnées, mais à des collègues.',
    cequunAtelierApporte: [
      'Un temps de soutien qui ne ressemble pas à une réunion. L’activité physique adaptée, la socio-esthétique ou l’expression corporelle sont mieux reçues qu’un temps de parole en salle.',
      'Une occasion de travailler l’image de soi, sujet massif et rarement abordé de front dans un cadre professionnel.',
      'Un support pour les moniteurs d’atelier eux-mêmes, qui portent seuls la tension entre production et accompagnement — c’est aussi ce que l’analyse des pratiques professionnelles vient soulager.',
      'Une respiration collective sur des périodes de forte charge, où l’équipe cherche justement à éviter que la tension se règle en conflit.',
    ],
    contraintes: [
      'Un créneau négocié avec la production, pas contre elle. Un atelier posé sur un pic de commande sera annulé, ou vécu comme une punition par l’encadrement technique.',
      'Un vocabulaire d’adulte, sans infantilisation. C’est le reproche le plus fréquent adressé aux intervenants extérieurs dans ce type d’établissement.',
      'Une participation volontaire et réversible : un travailleur qui décline doit pouvoir retourner à son poste sans avoir à se justifier.',
      'Des consignes de sécurité propres au site, qui priment sur celles de l’atelier.',
    ],
    avantDeFaireEntrer: [
      'La qualification correspondant à la médiation proposée.',
      'L’attestation d’assurance en responsabilité civile professionnelle.',
      'La connaissance du public adulte en situation de handicap — une expérience exclusivement enfance se voit en une séance.',
      'Un déroulé compatible avec un créneau fixe et court, généralement une heure.',
    ],
    cadre: [],
  },
  {
    slug: 'ehpad',
    sigle: 'EHPAD',
    nom: 'Établissement d’hébergement pour personnes âgées dépendantes',
    accroche: 'Faire intervenir un atelier en EHPAD',
    titre: 'Ateliers pour EHPAD',
    description:
      'Un atelier en EHPAD qui tienne dans la journée d’un service : formats, contraintes de mobilité et de fatigabilité, et pièces à réunir avant la première séance.',
    presentation:
      'Un établissement d’hébergement pour personnes âgées dépendantes accompagne des résidents dont l’autonomie et la santé varient fortement d’une personne à l’autre et, pour une même personne, d’un jour à l’autre. Le soin y structure la journée : les créneaux réellement disponibles pour un atelier sont peu nombreux et connus de l’équipe.',
    publicAccueilli:
      'Des adultes âgés, dont une partie présente des troubles cognitifs. La mémoire de la séance précédente ne peut pas être supposée : chaque séance doit fonctionner seule.',
    cequunAtelierApporte: [
      'Une stimulation sensorielle et relationnelle qui ne passe pas par la performance : la musicothérapie et la socio-esthétique atteignent des résidents que rien d’autre ne mobilise.',
      'Un temps où le résident n’est pas un patient. C’est l’effet le plus souvent rapporté par les équipes, et le plus difficile à obtenir autrement.',
      'Un support pour les familles, qui cherchent à se rendre utiles pendant les visites et ne savent pas toujours comment.',
      'Une animation qui soulage l’équipe d’animation, presque toujours seule sur l’ensemble de l’établissement.',
    ],
    contraintes: [
      'Des créneaux étroits : le matin est pris par les soins, le début d’après-midi par le repos. En pratique, il reste la fin de matinée et le milieu d’après-midi.',
      'Une fatigabilité réelle : quarante-cinq minutes est un maximum, et la séance doit pouvoir se terminer plus tôt sans que cela ressemble à un échec.',
      'L’accessibilité, à vérifier sur place et non sur plan : fauteuils, largeur de passage, hauteur de table, éclairage, acoustique.',
      'Un groupe qui ne sera jamais celui prévu. Une hospitalisation, une fin de vie, une épidémie changent la composition du jour au lendemain.',
    ],
    avantDeFaireEntrer: [
      'La qualification correspondant à la médiation proposée.',
      'L’attestation d’assurance en responsabilité civile professionnelle.',
      'Le respect des protocoles d’hygiène de l’établissement, qui priment sur toute organisation d’atelier.',
      'Un format qui fonctionne sans continuité d’une séance à l’autre.',
    ],
    cadre: [],
  },
];

export function trouverEtablissement(slug: string): Etablissement | undefined {
  return ETABLISSEMENTS.find((e) => e.slug === slug);
}
