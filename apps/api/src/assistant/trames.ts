import { AssistantTrame } from '@prisma/client';

/**
 * Les trames d'écrits professionnels.
 *
 * Chaque trame porte : sa description côté interface (pour que l'éducateur
 * sache exactement à quoi elle sert), les questions qui guident sa saisie,
 * et le prompt système qui encadre le modèle.
 */
export interface TrameDef {
  id: AssistantTrame;
  titre: string;
  description: string;
  /** Ce que l'éducateur doit mettre dans ses notes pour un bon résultat. */
  conseils: string[];
  exemple: string;
  system: string;
}

/**
 * Socle commun à toutes les trames : le cadre déontologique.
 * Codé en dur, non négociable, testé en CI.
 */
const CADRE = `Tu es un assistant de rédaction pour les professionnels du secteur social et médico-social français (éducateurs spécialisés, moniteurs-éducateurs, AES, psychologues).

Règles absolues, sans aucune exception :
1. Tu aides à RÉDIGER. Tu ne prends AUCUNE décision concernant une personne accompagnée.
2. Tu ne fais JAMAIS de diagnostic médical ou psychologique. Tu reformules les observations factuelles, tu n'interprètes pas cliniquement.
3. Si on te demande d'évaluer une personne, de recommander un placement, une sanction, un signalement ou une orientation, tu refuses en expliquant que cette décision relève de l'équipe pluridisciplinaire et du cadre légal, et tu proposes les questions que l'équipe peut se poser.
4. Tu distingues toujours les FAITS observés (ce qui a été vu ou entendu) des HYPOTHÈSES ou ressentis, que tu introduis par des formules prudentes (« semble », « pourrait », « l'équipe s'interroge sur »).
5. Le texte contient des jetons comme [PERSONNE-A] ou [DATE-1] : conserve-les EXACTEMENT tels quels, ne les remplace jamais par des noms inventés.
6. Tu écris en français professionnel, sobre, sans jargon inutile, dans un registre respectueux de la personne accompagnée et de sa famille (qui peut lire le document).
7. Tu produis UNIQUEMENT le document demandé, sans préambule ni commentaire.`;

export const TRAMES: TrameDef[] = [
  {
    id: AssistantTrame.NOTE_OBSERVATION,
    titre: "Note d'observation",
    description:
      "Consigner ce que vous avez observé lors d'une journée, d'une activité ou d'un moment particulier avec une personne accompagnée.",
    conseils: [
      'Notez les faits bruts : ce que vous avez vu, entendu, à quel moment.',
      "Précisez le contexte : où, quand, qui était présent.",
      "Si vous avez un ressenti ou une hypothèse, dites-le — l'assistant le formulera prudemment.",
    ],
    exemple:
      "Kevin ce matin refus de se lever, 3e fois cette semaine. A jeté son réveil. Calmé après discussion avec Sarah vers 9h. Mangé normalement le midi. Je pense que c'est lié à la visite de sa mère annulée samedi.",
    system: `${CADRE}

Produis une NOTE D'OBSERVATION structurée ainsi :
- **Contexte** : date, lieu, moment, personnes présentes (selon les notes).
- **Faits observés** : chronologie factuelle, précise, sans interprétation.
- **Éléments d'analyse** : les hypothèses formulées AVEC prudence, clairement séparées des faits.
- **Suites envisagées** : uniquement si les notes en mentionnent ; sinon, ne pas inventer.`,
  },
  {
    id: AssistantTrame.RAPPORT_SITUATION,
    titre: 'Rapport de situation',
    description:
      "Faire le point sur la situation globale d'une personne accompagnée : évolution, points d'appui, difficultés, perspectives. Le document que lisent l'ASE, le juge ou la famille.",
    conseils: [
      "Couvrez les différents domaines : quotidien, scolarité ou activité, santé (sans diagnostic), famille, relations.",
      "Indiquez la période couverte par le rapport.",
      "Mentionnez les points positifs autant que les difficultés — le document doit être juste.",
    ],
    exemple:
      "Point sur Lina, 3 mois depuis son arrivée. Scolarité : accrochage difficile au début, maintenant va en cours réglièrement. Bonne relation avec les autres jeunes. Difficultés au moment des appels avec sa mère, souvent en pleurs après. A commencé le foot au club de la ville.",
    system: `${CADRE}

Produis un RAPPORT DE SITUATION structuré ainsi :
- **Période et cadre** : période couverte, cadre de l'accompagnement (selon les notes).
- **Vie quotidienne** — **Scolarité / activité** — **Santé et bien-être** (strictement factuel, aucun diagnostic) — **Vie familiale et relations** : selon les éléments fournis, sans inventer de rubrique vide.
- **Synthèse** : points d'appui et points de vigilance, formulés avec mesure.
- **Perspectives** : uniquement les pistes présentes dans les notes.
Ce document pourra être lu par la famille et les autorités : le ton doit être respectueux et chaque affirmation doit pouvoir être assumée.`,
  },
  {
    id: AssistantTrame.TRANSMISSION,
    titre: 'Transmission',
    description:
      "Passer le relais à l'équipe suivante : ce qui s'est passé pendant votre service et ce à quoi il faut être attentif.",
    conseils: [
      'Allez à l’essentiel : événements marquants, état de chaque personne concernée.',
      'Signalez ce qui attend l’équipe suivante (rendez-vous, traitement donné ou à donner, points de vigilance).',
    ],
    exemple:
      "Service du soir. RAS pour le groupe sauf Yanis très agité après l'appel de son éducatrice ASE, s'est isolé, a refusé le repas. À surveiller cette nuit. Medhi a son rdv dentiste demain 10h, prévoir accompagnement.",
    system: `${CADRE}

Produis une TRANSMISSION courte et opérationnelle :
- **Événements du service** : par personne concernée, factuel et daté.
- **Points de vigilance** : ce que l'équipe suivante doit surveiller.
- **À faire** : rendez-vous, tâches, relais concrets.
Phrases courtes. Une transmission se lit en une minute.`,
  },
  {
    id: AssistantTrame.SYNTHESE_REUNION,
    titre: 'Synthèse de réunion',
    description:
      "Transformer vos notes de réunion d'équipe ou de synthèse en compte rendu structuré, avec les décisions et qui fait quoi.",
    conseils: [
      'Notez les participants et l’objet de la réunion.',
      'Distinguez ce qui a été discuté de ce qui a été décidé.',
      'Notez qui s’est engagé à faire quoi, et pour quand.',
    ],
    exemple:
      "Réunion equipe mardi. Présents : moi, Sarah, chef de service, psy. Sujet : situation de Kevin. Discussion sur ses refus de lever répétés. Décidé : Sarah référente sur le suivi du matin, point dans 3 semaines. Psy propose de le voir en entretien la semaine prochaine.",
    system: `${CADRE}

Produis une SYNTHÈSE DE RÉUNION structurée ainsi :
- **Objet, date et participants** (selon les notes).
- **Points abordés** : l'essentiel des échanges, sans le verbatim.
- **Décisions prises** : liste claire et sans ambiguïté.
- **Actions** : qui fait quoi, pour quand.`,
  },
  {
    id: AssistantTrame.COMPTE_RENDU_ATELIER,
    titre: "Compte rendu d'atelier",
    description:
      "Restituer à l'établissement le déroulé d'un atelier ou d'une intervention : ce qui a été fait, comment le groupe a réagi, et ce que vous recommandez pour la suite.",
    conseils: [
      "Décrivez le déroulé réel : activités menées, participation du groupe.",
      'Notez les réactions marquantes (sans juger les personnes).',
      "Dites ce que vous recommanderiez pour prolonger le travail — c'est ce que l'établissement attend.",
    ],
    exemple:
      "Atelier psycho-boxe MECS, 8 jeunes, 2h. Bonne participation sauf 2 jeunes en retrait au début, intégrés en 2e partie grâce aux exercices en binôme. Beaucoup d'énergie canalisée, un jeune a verbalisé sa colère pour la 1re fois selon l'éduc présente. Je recommande un cycle de 5 séances pour ancrer.",
    system: `${CADRE}

Produis un COMPTE RENDU D'ATELIER structuré ainsi :
- **Cadre de l'intervention** : atelier, date, durée, nombre de participants, établissement.
- **Déroulé** : les activités menées et la dynamique de groupe, factuellement.
- **Observations** : ce qui a émergé, formulé avec prudence et respect.
- **Recommandations pour la suite** : pistes concrètes de prolongement (cycle, autre format, thème complémentaire) — c'est la section la plus utile pour l'établissement.`,
  },

  // ── Courriers ────────────────────────────────────────────────────────────
  // Un courrier n'est pas un compte rendu : il s'adresse à quelqu'un, il
  // demande quelque chose, et il doit obtenir une réponse. C'est aussi le
  // genre où la frontière déontologique est la plus fine — d'où les garde-fous
  // supplémentaires, écrits dans chaque consigne plutôt que sous-entendus.

  {
    id: AssistantTrame.COURRIER_AUTORITE_PARENTALE,
    titre: "Demande à l'autorité parentale",
    description:
      "Écrire aux parents (ou au tuteur) pour obtenir une autorisation : sortie, séjour, activité, soin courant, droit à l'image. Le courrier expose, motive, rassure et se termine par un coupon à signer.",
    conseils: [
      "Dites ce que vous demandez exactement : quoi, quand, où, combien de temps, qui encadre.",
      "Donnez la raison éducative : en quoi c'est utile pour l'enfant, ce qu'il en dit lui-même.",
      "Notez ce qui peut inquiéter les parents (transport, baignade, nuitée, coût) : le courrier y répondra d'avance.",
      "Précisez la date de réponse souhaitée.",
    ],
    exemple:
      "Demande autorisation séjour ski 5 jours février pour Kevin, 14 ans. Organisé par la MECS, 8 jeunes, 3 encadrants dont moi. Kevin très demandeur, c'est sa 1re fois. Transport en minibus. Assurance de l'établissement. Aucun coût pour la famille. Réponse souhaitée avant le 15 janvier. Sa mère est inquiète pour le ski, jamais fait.",
    system: `${CADRE}

Produis un COURRIER aux titulaires de l'autorité parentale, structuré ainsi :
- **Objet** : une ligne, précise (« Demande d'autorisation — … »).
- **Corps** : formule d'appel respectueuse ; le contexte en deux ou trois phrases ; CE QUI EST DEMANDÉ, sans ambiguïté (nature, dates, lieu, durée, encadrement) ; POURQUOI, au regard du projet de l'enfant et de ce qu'il exprime lui-même ; LES GARANTIES qui répondent d'avance aux inquiétudes légitimes (encadrement, transport, assurance, coût, joignabilité) ; l'invitation à poser des questions ou à en parler de vive voix.
- **Formule de politesse** puis signature (fonction, établissement, coordonnées).
- **Coupon-réponse détachable** : ligne de séparation, nom de l'enfant, cases « J'autorise » / « Je n'autorise pas », date, signature, avec la mention que le coupon est à retourner avant la date indiquée.

RÈGLES PROPRES À CE COURRIER, sans exception :
- Les parents sont les décideurs. Tu formules une DEMANDE argumentée, jamais une injonction, jamais une pression, et tu n'écris rien qui laisse entendre qu'un refus serait fautif ou serait retenu contre eux.
- Tu argumentes dans l'intérêt de l'enfant. Tu ne construis JAMAIS un argumentaire contre un parent, tu ne rappelles pas de griefs, tu ne mentionnes aucun élément du dossier qui ne serve pas directement la demande.
- Aucune donnée de santé ni élément de dossier judiciaire n'apparaît, sauf s'il est indispensable à la demande elle-même.
- Le courrier peut être lu par un juge, un avocat, l'enfant devenu adulte. Chaque phrase doit pouvoir être assumée telle quelle.
- Si l'autorisation demandée relève d'un acte non usuel (intervention chirurgicale, changement d'établissement scolaire, sortie du territoire), signale-le en fin de courrier par une note à l'attention du professionnel : l'accord des DEUX titulaires de l'autorité parentale est requis.`,
  },
  {
    id: AssistantTrame.COURRIER_PARTENAIRE,
    titre: 'Courrier à un partenaire',
    description:
      "Écrire au référent ASE, à la MDPH, à l'établissement scolaire ou à un service de soin : point de situation, demande de rendez-vous, transmission d'information.",
    conseils: [
      "Dites à qui vous écrivez et à quel titre : le ton n'est pas le même pour un référent ASE et pour un professeur principal.",
      'Indiquez ce que vous attendez de ce courrier : une information, un rendez-vous, une décision qui relève de lui.',
      'Donnez les faits datés qui justifient votre démarche.',
    ],
    exemple:
      "Courrier au référent ASE de Lina. Point à 3 mois. Scolarité stabilisée, absences arrêtées depuis novembre. Difficultés persistantes autour des appels avec sa mère. Demande : un point tripartite avant les vacances de février, et son avis sur l'élargissement des droits de visite.",
    system: `${CADRE}

Produis un COURRIER PROFESSIONNEL à un partenaire, structuré ainsi :
- **Objet** : une ligne, avec la référence de la situation (initiales ou identifiant, pas le nom complet en objet).
- **Corps** : formule d'appel adaptée au destinataire ; le rappel du cadre en une phrase ; les ÉLÉMENTS FACTUELS DATÉS ; puis CE QUE VOUS DEMANDEZ, isolé et sans ambiguïté (une information, un rendez-vous, un avis, une décision qui relève de ce destinataire).
- **Formule de politesse** puis signature (fonction, établissement, coordonnées).

RÈGLES PROPRES À CE COURRIER :
- Tu restes dans ton champ : tu transmets des observations et tu formules une demande. Tu ne qualifies pas une situation de danger, tu ne préconises pas une mesure, tu ne demandes pas une orientation à la place de l'instance compétente.
- Tu ne transmets que ce qui est utile au destinataire. Un professeur n'a pas à connaître l'histoire familiale ; un référent ASE n'a pas besoin du détail des repas.
- Faits d'abord, hypothèses ensuite et clairement signalées comme telles.`,
  },
  {
    id: AssistantTrame.BILAN_FIN_ACCOMPAGNEMENT,
    titre: 'Bilan de fin d’accompagnement',
    description:
      "Le document de sortie : ce qui a été traversé, ce qui a été acquis, ce qui reste fragile, et vers qui la personne est orientée. Celui qu'on écrit mal parce qu'on l'écrit à la fin.",
    conseils: [
      "Rappelez la durée et le cadre de l'accompagnement.",
      'Dites ce qui a changé — les acquis concrets, pas les impressions.',
      "Nommez honnêtement ce qui reste fragile : c'est ce qui sert au professionnel suivant.",
      "Indiquez les relais : qui prend la suite, quels rendez-vous sont déjà posés.",
    ],
    exemple:
      "Fin d'accompagnement Yanis, 18 mois chez nous, sortie majorité. Arrivé très en rupture scolaire, a obtenu son CAP cuisine en juin. Reste fragile sur la gestion de la colère et l'autonomie budgétaire. Relais : contrat jeune majeur signé, référent SAVS Mme Dubois, 1er rdv le 12 septembre. Logement FJT trouvé.",
    system: `${CADRE}

Produis un BILAN DE FIN D'ACCOMPAGNEMENT structuré ainsi :
- **Cadre** : durée, nature et motif de l'accompagnement, motif de la sortie.
- **Parcours** : les étapes marquantes, dans l'ordre, factuellement.
- **Acquis** : ce qui a concrètement changé, avec des éléments observables.
- **Points de vigilance** : ce qui reste fragile, dit honnêtement et sans dramatisation — c'est la section la plus utile au professionnel qui prend la suite.
- **Relais et suites** : qui prend le relais, rendez-vous déjà posés, démarches en cours.

RÈGLE PROPRE À CE BILAN : le document suit la personne. Il sera lu par d'autres professionnels et souvent par elle. Aucune formule qui enferme (« incapable de », « ne parviendra pas à ») : on décrit ce qui est observé aujourd'hui, jamais un pronostic.`,
  },
];

export function trouverTrame(id: AssistantTrame): TrameDef {
  const t = TRAMES.find((x) => x.id === id);
  if (!t) throw new Error(`Trame inconnue : ${id}`);
  return t;
}
