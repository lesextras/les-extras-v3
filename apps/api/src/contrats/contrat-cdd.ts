/**
 * CONTRAT À DURÉE DÉTERMINÉE — les règles, calculées hors base.
 *
 * POURQUOI CE MODULE EXISTE, ET CE QU'IL N'EST PAS.
 *
 * Le pivot du produit tient en une phrase : Les-Extras ne fournit personne.
 * L'établissement recrute lui-même son remplaçant, en CDD, et devient son
 * employeur ; la plateforme vend l'outil qui rend ce recrutement rapide et
 * conforme. C'est ce montage — et lui seul — qui place l'activité hors du
 * champ du prêt de main-d'œuvre à but lucratif (art. L. 8241-1) et hors du
 * statut d'entreprise de travail temporaire.
 *
 * Ce module produit donc un **projet de contrat**, pas un contrat validé par
 * un juriste. Il applique les règles du code du travail qui sont chiffrées et
 * vérifiables — mentions obligatoires, période d'essai, indemnité de fin de
 * contrat, délai de carence — et il refuse d'émettre un document auquel il
 * manque une mention légale. Il ne remplace pas la lecture d'un avocat, et le
 * produit doit le dire à l'écran, pas seulement dans ce commentaire.
 *
 * Deux pièges que le code doit tenir, parce qu'ils sont invisibles à l'œil nu :
 *
 *  1. L'absence de définition précise du motif de recours ne rend pas le
 *     contrat irrégulier — elle le **requalifie en CDI** (art. L. 1242-12).
 *     D'où le contrôle bloquant sur les mentions.
 *  2. Le délai de carence entre deux CDD sur le même poste se compte en
 *     **jours d'ouverture de l'établissement**, pas en jours calendaires
 *     (art. L. 1244-3). Un calcul en jours calendaires sous-estime le délai
 *     et expose l'établissement.
 *
 * Références :
 *  - cas de recours et interdictions — art. L. 1242-1 à L. 1242-6
 *  - mentions obligatoires et forme écrite — art. L. 1242-12
 *  - transmission au salarié — art. L. 1242-13
 *  - période d'essai — art. L. 1242-10
 *  - indemnité de fin de contrat — art. L. 1243-8, exclusions art. L. 1243-10
 *  - délai de carence — art. L. 1244-3, calcul supplétif art. L. 1244-3-1
 *
 * La CCN 66 et la CCN 51 peuvent être plus favorables au salarié que ces
 * planchers légaux. Les constantes sont regroupées en tête pour qu'un
 * paramétrage par convention reste une modification d'une ligne.
 */

export const REGLES_CDD = {
  /** Période d'essai : 1 jour par semaine de contrat (art. L. 1242-10). */
  essaiJoursParSemaine: 1,
  /** Plafond d'essai pour un contrat d'au plus 6 mois : 2 semaines. */
  essaiPlafondCourtJours: 14,
  /** Plafond d'essai au-delà de 6 mois : 1 mois. */
  essaiPlafondLongJours: 30,
  /** Seuil de bascule entre les deux plafonds, en jours. */
  essaiSeuilJours: 183,
  /** Indemnité de fin de contrat : 10 % du brut total (art. L. 1243-8). */
  tauxIndemnitePrecarite: 0.1,
  /** Carence : 1/3 de la durée pour un contrat d'au moins 14 jours. */
  carenceFractionLongue: 1 / 3,
  /** Carence : 1/2 de la durée pour un contrat de moins de 14 jours. */
  carenceFractionCourte: 1 / 2,
  /** Seuil de bascule du délai de carence, en jours (art. L. 1244-3-1). */
  carenceSeuilJours: 14,
  /** Transmission du contrat écrit au salarié (art. L. 1242-13). */
  transmissionJoursOuvrables: 2,
  /** DPAE : au plus tôt 8 jours avant l'embauche. */
  dpaeAnticipationMaxJours: 8,
} as const;

/**
 * Cas de recours au CDD retenus pour le médico-social. La liste légale est
 * plus large (art. L. 1242-2) ; on n'expose que ceux qui ont un sens ici,
 * parce qu'un menu déroulant de quinze motifs pousse à en choisir un au
 * hasard — et le motif est précisément ce qui fait tomber le contrat.
 */
export const MOTIFS_RECOURS = {
  REMPLACEMENT_SALARIE_ABSENT: {
    libelle: "Remplacement d'un salarié absent",
    aide: "Maladie, congé, congé maternité, absence temporaire. Le contrat doit nommer la personne remplacée et sa qualification.",
    exigeSalarieRemplace: true,
    ouvreIndemnitePrecarite: true,
    article: 'art. L. 1242-2, 1° du code du travail',
  },
  REMPLACEMENT_ATTENTE_ENTREE: {
    libelle: "Attente de l'entrée en service d'un salarié recruté en CDI",
    aide: "Le poste est pourvu en CDI mais la personne n'a pas encore pris ses fonctions.",
    exigeSalarieRemplace: false,
    ouvreIndemnitePrecarite: true,
    article: 'art. L. 1242-2, 1° du code du travail',
  },
  REMPLACEMENT_POSTE_SUPPRIME: {
    libelle: "Attente de la suppression définitive du poste",
    aide: 'Le poste doit être supprimé : le CDD couvre la période intermédiaire.',
    exigeSalarieRemplace: false,
    ouvreIndemnitePrecarite: true,
    article: 'art. L. 1242-2, 1° du code du travail',
  },
  ACCROISSEMENT_TEMPORAIRE: {
    libelle: "Accroissement temporaire d'activité",
    aide: "Surcroît ponctuel : ouverture d'une unité, période de forte charge, projet daté.",
    exigeSalarieRemplace: false,
    ouvreIndemnitePrecarite: true,
    article: 'art. L. 1242-2, 2° du code du travail',
  },
} as const;

export type MotifRecours = keyof typeof MOTIFS_RECOURS;

export interface ProjetContrat {
  motif: MotifRecours;
  /** Nom de la personne remplacée — obligatoire si le motif l'exige. */
  salarieRemplaceNom?: string | null;
  /** Qualification de la personne remplacée — obligatoire de même. */
  salarieRemplaceQualification?: string | null;
  dateDebut: Date;
  /** Terme précis. Absent quand le contrat est à terme imprécis. */
  dateFin?: Date | null;
  /** Durée minimale, obligatoire quand le terme est imprécis. */
  dureeMinimaleJours?: number | null;
  poste?: string | null;
  qualification?: string | null;
  conventionCollective?: string | null;
  /** Rémunération brute et ses composantes, primes comprises. */
  remunerationBrute?: number | null;
  remunerationDetail?: string | null;
  caisseRetraiteComplementaire?: string | null;
  organismePrevoyance?: string | null;
  /** Le poste figure-t-il sur la liste des postes à risques particuliers ? */
  posteARisques?: boolean | null;
}

export interface MentionManquante {
  champ: string;
  message: string;
  article: string;
}

/** Durée d'un contrat en jours, bornes comprises. */
export function dureeEnJours(debut: Date, fin: Date): number {
  const j = 86_400_000;
  const d = Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth(), debut.getUTCDate());
  const f = Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate());
  return Math.max(0, Math.round((f - d) / j) + 1);
}

/**
 * Période d'essai maximale, en jours (art. L. 1242-10).
 * Un jour par semaine de contrat, plafonné à 2 semaines jusqu'à 6 mois de
 * contrat, à 1 mois au-delà. Sur un contrat à terme imprécis, le calcul se
 * fait sur la durée minimale.
 */
export function periodeEssaiMaxJours(dureeContratJours: number): number {
  if (dureeContratJours <= 0) return 0;
  const semaines = Math.ceil(dureeContratJours / 7);
  const brut = semaines * REGLES_CDD.essaiJoursParSemaine;
  const plafond =
    dureeContratJours > REGLES_CDD.essaiSeuilJours
      ? REGLES_CDD.essaiPlafondLongJours
      : REGLES_CDD.essaiPlafondCourtJours;
  return Math.min(brut, plafond);
}

/** Motif de non-versement de l'indemnité de fin de contrat. */
export type CauseFinContrat =
  | 'TERME_NORMAL'
  | 'REFUS_CDI'
  | 'RUPTURE_SALARIE'
  | 'FAUTE_GRAVE'
  | 'FORCE_MAJEURE';

export interface IndemniteFinContrat {
  due: boolean;
  taux: number;
  montant: number;
  motif: string;
  article: string;
}

/**
 * Indemnité de fin de contrat, dite prime de précarité (art. L. 1243-8).
 * 10 % de la rémunération brute totale, sauf les cas d'exclusion de
 * l'art. L. 1243-10 : refus d'un CDI sur le même poste, rupture à
 * l'initiative du salarié, faute grave, force majeure.
 */
export function indemniteFinDeContrat(
  remunerationBruteTotale: number,
  cause: CauseFinContrat = 'TERME_NORMAL',
): IndemniteFinContrat {
  const exclusions: Partial<Record<CauseFinContrat, string>> = {
    REFUS_CDI: "Le salarié a refusé un CDI sur le même poste ou un poste similaire, à rémunération au moins équivalente.",
    RUPTURE_SALARIE: "La rupture anticipée est à l'initiative du salarié.",
    FAUTE_GRAVE: 'La rupture anticipée est motivée par une faute grave du salarié.',
    FORCE_MAJEURE: 'La rupture anticipée résulte d’un cas de force majeure.',
  };
  const exclusion = exclusions[cause];
  if (exclusion) {
    return {
      due: false,
      taux: 0,
      montant: 0,
      motif: exclusion,
      article: 'art. L. 1243-10 du code du travail',
    };
  }
  const taux = REGLES_CDD.tauxIndemnitePrecarite;
  return {
    due: true,
    taux,
    montant: Math.round(remunerationBruteTotale * taux * 100) / 100,
    motif: 'Indemnité de fin de contrat due au terme du CDD.',
    article: 'art. L. 1243-8 du code du travail',
  };
}

export interface DelaiCarence {
  jours: number;
  fraction: number;
  message: string;
  article: string;
}

/**
 * Délai de carence avant de repourvoir LE MÊME POSTE en CDD (art. L. 1244-3).
 * Calcul supplétif de l'art. L. 1244-3-1 : un tiers de la durée du contrat
 * échu s'il a duré au moins 14 jours, la moitié en deçà.
 *
 * ATTENTION — ce délai se décompte en **jours d'ouverture de l'établissement**,
 * pas en jours calendaires. La fonction renvoie donc un nombre de jours
 * d'ouverture, à reporter sur le calendrier réel de la structure : un IME
 * fermé le week-end et pendant les vacances n'a pas le même calendrier qu'une
 * MECS ouverte toute l'année.
 */
export function delaiDeCarence(dureeContratEchuJours: number): DelaiCarence {
  const longue = dureeContratEchuJours >= REGLES_CDD.carenceSeuilJours;
  const fraction = longue ? REGLES_CDD.carenceFractionLongue : REGLES_CDD.carenceFractionCourte;
  const jours = Math.ceil(dureeContratEchuJours * fraction);
  return {
    jours,
    fraction,
    message: longue
      ? `Contrat de ${dureeContratEchuJours} jours : carence d'un tiers, soit ${jours} jours d'ouverture de l'établissement.`
      : `Contrat de moins de 14 jours : carence de moitié, soit ${jours} jours d'ouverture de l'établissement.`,
    article: 'art. L. 1244-3 et L. 1244-3-1 du code du travail',
  };
}

/**
 * Vérifie les mentions obligatoires de l'art. L. 1242-12.
 *
 * L'enjeu n'est pas cosmétique : l'absence de définition précise du motif
 * fait présumer le contrat conclu pour une durée indéterminée. C'est le seul
 * endroit du produit où l'on refuse d'émettre un document.
 */
export function mentionsManquantes(p: ProjetContrat): MentionManquante[] {
  const m: MentionManquante[] = [];
  const vide = (v: unknown) => v === null || v === undefined || String(v).trim() === '';
  const def = MOTIFS_RECOURS[p.motif];

  if (!def) {
    m.push({
      champ: 'motif',
      message: "Le motif de recours doit être choisi parmi les cas prévus par la loi.",
      article: 'art. L. 1242-2 du code du travail',
    });
  }

  if (def?.exigeSalarieRemplace) {
    if (vide(p.salarieRemplaceNom)) {
      m.push({
        champ: 'salarieRemplaceNom',
        message: "Le nom de la personne remplacée est obligatoire pour ce motif.",
        article: 'art. L. 1242-12, 1° du code du travail',
      });
    }
    if (vide(p.salarieRemplaceQualification)) {
      m.push({
        champ: 'salarieRemplaceQualification',
        message: 'La qualification professionnelle de la personne remplacée est obligatoire.',
        article: 'art. L. 1242-12, 1° du code du travail',
      });
    }
  }

  if (!p.dateFin && !p.dureeMinimaleJours) {
    m.push({
      champ: 'dateFin',
      message:
        "Indiquez une date de fin, ou une durée minimale si le terme est imprécis (retour du salarié remplacé, par exemple).",
      article: 'art. L. 1242-12, 2° et 3° du code du travail',
    });
  }

  if (vide(p.poste)) {
    m.push({
      champ: 'poste',
      message: 'La désignation du poste de travail est obligatoire.',
      article: 'art. L. 1242-12, 4° du code du travail',
    });
  }
  if (p.posteARisques === null || p.posteARisques === undefined) {
    m.push({
      champ: 'posteARisques',
      message:
        "Précisez si le poste figure sur la liste des postes à risques particuliers pour la santé ou la sécurité.",
      article: 'art. L. 1242-12, 4° du code du travail',
    });
  }
  if (vide(p.conventionCollective)) {
    m.push({
      champ: 'conventionCollective',
      message: 'L’intitulé de la convention collective applicable est obligatoire.',
      article: 'art. L. 1242-12, 5° du code du travail',
    });
  }
  if (p.remunerationBrute === null || p.remunerationBrute === undefined || p.remunerationBrute <= 0) {
    m.push({
      champ: 'remunerationBrute',
      message: 'Le montant de la rémunération brute et de ses composantes, primes comprises, est obligatoire.',
      article: 'art. L. 1242-12, 7° du code du travail',
    });
  }
  if (vide(p.caisseRetraiteComplementaire)) {
    m.push({
      champ: 'caisseRetraiteComplementaire',
      message: 'Le nom et l’adresse de la caisse de retraite complémentaire sont obligatoires.',
      article: 'art. L. 1242-12, 8° du code du travail',
    });
  }
  if (vide(p.organismePrevoyance)) {
    m.push({
      champ: 'organismePrevoyance',
      message: 'L’organisme de prévoyance doit être mentionné le cas échéant.',
      article: 'art. L. 1242-12, 8° du code du travail',
    });
  }
  return m;
}

/**
 * Date limite de transmission du contrat écrit au salarié : deux jours
 * ouvrables suivant l'embauche (art. L. 1242-13). Approximation assumée du
 * jour ouvrable — on saute les dimanches, sans connaître les jours fériés.
 * Le produit affiche une date indicative, pas une échéance opposable.
 */
export function limiteTransmission(dateEmbauche: Date): Date {
  const d = new Date(dateEmbauche);
  let restants = REGLES_CDD.transmissionJoursOuvrables;
  while (restants > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) restants--;
  }
  return d;
}

/** Date au plus tôt pour la déclaration préalable à l'embauche. */
export function dpaeAuPlusTot(dateEmbauche: Date): Date {
  return new Date(dateEmbauche.getTime() - REGLES_CDD.dpaeAnticipationMaxJours * 86_400_000);
}

/**
 * Synthèse prête à afficher : ce que le contrat implique, en clair.
 * C'est ce que l'établissement lit avant de signer — et c'est là que le
 * produit gagne sa valeur, en rendant lisible ce que personne ne calcule.
 */
export function synthese(p: ProjetContrat) {
  const manquantes = mentionsManquantes(p);
  const duree =
    p.dateFin != null
      ? dureeEnJours(p.dateDebut, p.dateFin)
      : (p.dureeMinimaleJours ?? 0);
  const essai = periodeEssaiMaxJours(duree);
  const def = MOTIFS_RECOURS[p.motif];
  const brutTotal = p.remunerationBrute ?? 0;
  return {
    emissible: manquantes.length === 0,
    mentionsManquantes: manquantes,
    dureeJours: duree,
    termePrecis: p.dateFin != null,
    periodeEssaiMaxJours: essai,
    indemniteFinDeContrat: indemniteFinDeContrat(brutTotal),
    carenceApres: delaiDeCarence(duree),
    limiteTransmission: limiteTransmission(p.dateDebut),
    dpaeAuPlusTot: dpaeAuPlusTot(p.dateDebut),
    motifLibelle: def?.libelle ?? null,
    motifArticle: def?.article ?? null,
    avertissement:
      "Projet de contrat généré à partir des règles du code du travail. L'établissement reste l'employeur et demeure seul responsable du contrat qu'il signe : faites relire ce document, en particulier au regard de votre convention collective, qui peut être plus favorable au salarié que les planchers légaux appliqués ici.",
  };
}
