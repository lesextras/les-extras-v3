/**
 * LE RÉFÉRENTIEL NATIONAL QUALITÉ (Qualiopi) : 7 critères, 32 indicateurs.
 *
 * ⚠ LA NUMÉROTATION EST CELLE DU GUIDE DE LECTURE OFFICIEL, et elle ne se
 * réinvente pas. La première version de ce fichier (jusqu'au 29/09/2026)
 * rangeait cinq indicateurs au critère 4, trois au critère 5, trois au
 * critère 6 et mettait le handicap en 21 et en 32 : un organisme qui s'en
 * servait pour préparer son audit classait ses preuves sous les mauvais
 * numéros. Répartition officielle :
 *   critère 1 : 1 à 3 · critère 2 : 4 à 8 · critère 3 : 9 à 16 ·
 *   critère 4 : 17 à 20 · critère 5 : 21 et 22 · critère 6 : 23 à 29 ·
 *   critère 7 : 30 à 32.
 * Repères : 26 = handicap, 30 = appréciations, 31 = difficultés et
 * réclamations, 32 = amélioration continue.
 * Source : travail-emploi.gouv.fr, « Référentiel national qualité, guide de lecture ».
 *
 * Les libellés sont des RÉSUMÉS, un support de suivi : ils ne remplacent pas
 * le texte officiel. Ils intègrent les précisions du décret n° 2026-728 du
 * 1er août 2026 (en vigueur le 1er novembre 2026) sur les indicateurs 1, 2,
 * 12, 19, 27 et 32.
 *
 * ⚠ L'INDICATEUR 33 créé par ce décret (évaluation des enseignements par les
 * apprentis, CFA seulement) n'est PAS encore ici : son critère de
 * rattachement n'a pas pu être lu dans le texte. Il ne concerne que les CFA ;
 * l'ajouter sous un critère deviné classerait mal les preuves des CFA qui s'en
 * serviraient. À ajouter une fois le texte lu.
 */
export const RNQ: { c: number; title: string; indicators: { n: number; label: string }[] }[] = [
  {
    c: 1,
    title: 'Conditions d’information du public sur les prestations, les délais d’accès et les résultats obtenus',
    indicators: [
      { n: 1, label: 'Information accessible, détaillée et vérifiable sur les prestations (prérequis, objectifs, durée, modalités et délais d’accès, tarifs, contacts, méthodes, évaluation, accessibilité)' },
      { n: 2, label: 'Diffusion d’indicateurs de résultats adaptés, avec une méthode de calcul transparente' },
      { n: 3, label: 'Taux d’obtention des certifications, blocs de compétences, équivalences, passerelles, suites de parcours et débouchés' },
    ],
  },
  {
    c: 2,
    title: 'Identification des objectifs des prestations et adaptation aux publics, lors de la conception',
    indicators: [
      { n: 4, label: 'Analyse du besoin du bénéficiaire, en lien avec l’entreprise ou le financeur' },
      { n: 5, label: 'Objectifs opérationnels et évaluables de la prestation' },
      { n: 6, label: 'Contenus et modalités de mise en œuvre adaptés aux objectifs et aux publics' },
      { n: 7, label: 'Adéquation du contenu aux exigences de la certification visée' },
      { n: 8, label: 'Positionnement à l’entrée de la prestation' },
    ],
  },
  {
    c: 3,
    title: 'Adaptation aux publics des modalités d’accueil, d’accompagnement, de suivi et d’évaluation',
    indicators: [
      { n: 9, label: 'Information des publics sur les conditions de déroulement de la prestation' },
      { n: 10, label: 'Adaptation de la prestation, de l’accompagnement et du suivi aux publics' },
      { n: 11, label: 'Évaluation de l’atteinte des objectifs par les bénéficiaires' },
      { n: 12, label: 'Engagement des bénéficiaires, prévention des ruptures de parcours et des violences, du harcèlement et des discriminations' },
      { n: 13, label: 'Coordination avec l’entreprise pour les formations en alternance' },
      { n: 14, label: 'Exercice de la citoyenneté des apprentis (CFA)' },
      { n: 15, label: 'Information des apprentis sur leurs droits et devoirs (CFA)' },
      { n: 16, label: 'Conditions de présentation des bénéficiaires à la certification' },
    ],
  },
  {
    c: 4,
    title: 'Adéquation des moyens pédagogiques, techniques et d’encadrement',
    indicators: [
      { n: 17, label: 'Moyens humains et techniques adaptés, environnement approprié' },
      { n: 18, label: 'Coordination des intervenants internes et externes' },
      { n: 19, label: 'Ressources pédagogiques à disposition, et suivi effectif des bénéficiaires à distance' },
      { n: 20, label: 'Personnels dédiés à l’appui à la mobilité, au handicap, aux relations entreprises et à la prévention des ruptures (CFA)' },
    ],
  },
  {
    c: 5,
    title: 'Qualification et développement des connaissances et compétences des personnels',
    indicators: [
      { n: 21, label: 'Compétences des personnels chargés de la prestation' },
      { n: 22, label: 'Développement des compétences des salariés' },
    ],
  },
  {
    c: 6,
    title: 'Inscription et investissement dans l’environnement professionnel',
    indicators: [
      { n: 23, label: 'Veille légale et réglementaire' },
      { n: 24, label: 'Veille sur les emplois, les métiers et les compétences' },
      { n: 25, label: 'Veille sur les innovations pédagogiques et technologiques' },
      { n: 26, label: 'Mobilisation d’expertises, d’outils et de réseaux pour accueillir, accompagner, former ou orienter les publics en situation de handicap' },
      { n: 27, label: 'Sous-traitance ou portage salarial : conformité au référentiel tracée au contrat' },
      { n: 28, label: 'Réseau de partenaires socio-économiques pour les formations en situation de travail' },
      { n: 29, label: 'Insertion professionnelle ou poursuite d’études (CFA)' },
    ],
  },
  {
    c: 7,
    title: 'Recueil et prise en compte des appréciations et des réclamations',
    indicators: [
      { n: 30, label: 'Recueil des appréciations des parties prenantes' },
      { n: 31, label: 'Traitement des difficultés rencontrées et des réclamations' },
      { n: 32, label: 'Mesures d’amélioration continue, dont l’analyse des risques qualité' },
    ],
  },
];

/**
 * LE REPORT DES PREUVES DÉJÀ DÉPOSÉES.
 *
 * Une preuve est accrochée à une LIGNE d'indicateur (son numéro). Corriger les
 * libellés sans déplacer les preuves ferait passer, par exemple, une preuve
 * « accueil du handicap » (ancien n° 21) sous « compétences des personnels »
 * (vrai n° 21). On reporte donc chaque preuve sur le numéro qui porte
 * vraiment SON sens.
 *
 * `SUR` : l'ancien sens a un seul équivalent officiel, sans doute possible.
 * `PROBABLE` : l'équivalent est le plus proche, mais un humain doit relire ;
 * la preuve reportée porte la mention « à vérifier ».
 */
export const REPORT_SUR: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 13: 13, 15: 15,
  16: 12, // accompagnement et prévention des ruptures → 12
  18: 19, // ressources pédagogiques → 19
  19: 20, // personnels dédiés à l'accompagnement → 20
  20: 28, // réseau de partenaires socio-économiques → 28
  21: 26, // accueil des personnes en situation de handicap → 26
  22: 21, // qualification et compétences des intervenants → 21
  23: 22, // développement continu des compétences des personnels → 22
  25: 23, // veille légale et réglementaire → 23
  26: 25, // veille sur les innovations pédagogiques → 25
  27: 27, // expertises et sous-traitance → 27
  28: 30, // appréciations → 30
  30: 31, // réclamations → 31
  31: 32, // amélioration continue → 32
};

export const REPORT_PROBABLE: Record<number, number> = {
  12: 10, // « besoins d'adaptation » → adaptation de la prestation (10)
  14: 13, // « fonction tutorale / maître d'apprentissage » → coordination alternance (13)
  17: 17, // « moyens + coordination » : moyens (17) ; la coordination est désormais en 18
  24: 22, // « actualisation des compétences des équipes » → développement des compétences (22)
  29: 31, // « aléas et difficultés » → difficultés et réclamations (31)
  32: 26, // « handicap dans l'amélioration continue » → handicap (26)
};

/** Les anciens libellés, pour dire d'où vient une preuve reportée. */
export const ANCIENS_LIBELLES: Record<number, string> = {
  12: 'Prise en compte des besoins d’adaptation',
  14: 'Exercice de la fonction tutorale / maître d’apprentissage',
  17: 'Moyens humains et techniques adaptés + coordination',
  24: 'Actualisation des compétences des équipes pédagogiques',
  29: 'Traitement des aléas et difficultés rencontrés',
  32: 'Prise en compte du handicap dans l’amélioration continue',
};

export interface PreuveAReporter {
  id: string;
  ofAccountId: string;
  ancienNumero: number;
  status: string;
  label: string | null;
  documentUrl: string | null;
  updatedAt: Date;
}

export interface PreuveReportee {
  ofAccountId: string;
  numero: number;
  status: string;
  label: string | null;
  documentUrl: string | null;
  depuis: string[];
}

const RANG: Record<string, number> = { VALIDATED: 3, UPLOADED: 2, REJECTED: 1, TODO: 0 };

/**
 * Où va chaque preuve. Rien ne se perd : quand deux preuves d'un même compte
 * tombent sur le même numéro, la plus avancée garde la place et le libellé et
 * le lien de l'autre sont recopiés dans son intitulé, avec leur origine.
 */
export function planifierReport(preuves: PreuveAReporter[]): PreuveReportee[] {
  const places = new Map<string, PreuveReportee>();
  const ordre = [...preuves].sort((a, b) => {
    const sur = Number(b.ancienNumero in REPORT_SUR) - Number(a.ancienNumero in REPORT_SUR);
    return sur || (RANG[b.status] ?? 0) - (RANG[a.status] ?? 0) || b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  for (const p of ordre) {
    const probable = !(p.ancienNumero in REPORT_SUR);
    const numero = REPORT_SUR[p.ancienNumero] ?? REPORT_PROBABLE[p.ancienNumero] ?? p.ancienNumero;
    const cle = `${p.ofAccountId}:${numero}`;
    const mention = probable ? `[À vérifier : reportée depuis l’ancien n° ${p.ancienNumero} « ${ANCIENS_LIBELLES[p.ancienNumero] ?? ''} »] ` : '';
    const deja = places.get(cle);
    if (!deja) {
      places.set(cle, { ofAccountId: p.ofAccountId, numero, status: p.status, label: p.label || mention ? `${mention}${p.label ?? ''}`.trim() || null : null, documentUrl: p.documentUrl, depuis: [p.id] });
      continue;
    }
    // Collision : on garde la première (la plus sûre, puis la plus avancée), on recopie la seconde.
    const ajout = [`Aussi déposé sous l’ancien n° ${p.ancienNumero}`, p.label, p.documentUrl].filter(Boolean).join(' : ');
    deja.label = [deja.label, `[${ajout}]`].filter(Boolean).join(' ').slice(0, 2000);
    deja.depuis.push(p.id);
  }
  return [...places.values()];
}
