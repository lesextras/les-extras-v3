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
];

export function trouverTrame(id: AssistantTrame): TrameDef {
  const t = TRAMES.find((x) => x.id === id);
  if (!t) throw new Error(`Trame inconnue : ${id}`);
  return t;
}
