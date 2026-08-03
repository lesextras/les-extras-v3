import { feriesEntre, OptionsFeries } from './feries';

/**
 * L'ANNUALISATION DU TEMPS DE TRAVAIL.
 *
 * Le secteur social ne travaille pas en semaines de trente-cinq heures. Les
 * conventions du champ — CCN 51, CCN 66, accords CHRS — s'appuient toutes sur
 * l'accord de branche du 1er avril 1999, dont l'article 11 organise la
 * modulation : l'horaire varie d'une semaine à l'autre, la rémunération est
 * lissée, et les heures supplémentaires ne se décomptent qu'en fin de période.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * L'ERREUR À NE PAS COMMETTRE, et elle vaut d'être écrite en toutes lettres.
 *
 * Il existe DEUX volumes annuels, et les confondre est la faute la plus
 * coûteuse qu'un logiciel de planning puisse commettre :
 *
 *   1. Le VOLUME À PLANIFIER — combien d'heures on peut réellement caser dans
 *      l'année pour cette personne. Il se calcule : trois cent soixante-cinq
 *      jours, moins les repos hebdomadaires, moins les congés payés, moins les
 *      congés trimestriels, moins les fériés chômés, plus la journée de
 *      solidarité. Un éducateur de la CCN 66 avec dix-huit jours de congés
 *      trimestriels tourne autour de mille quatre cent cinquante heures.
 *
 *   2. Le SEUIL DE DÉCLENCHEMENT des heures supplémentaires — mille six cent
 *      sept heures par défaut (article L. 3121-41). Un accord peut fixer un
 *      seuil INFÉRIEUR (L. 3121-44, et article 11.1 de l'accord de branche),
 *      jamais supérieur : la Cour de cassation l'a jugé le 11 mai 2016
 *      (n° 14-29.512), même lorsque le salarié n'a pas acquis tous ses droits
 *      à congés.
 *
 * Les confondre produit l'un ou l'autre de ces désastres : déclencher des
 * heures supplémentaires fantômes à mille quatre cent cinquante heures alors
 * qu'aucun accord ne le prévoit, ou planifier mille six cent sept heures à un
 * éducateur qui, arithmétiquement, ne peut pas les faire.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Tout ce qui est conventionnel est paramétrable. Ce qui est écrit en dur ici
 * est d'ordre public et ne se négocie pas : le plafond de mille six cent sept
 * heures, le plancher de dix pour cent de majoration (L. 3121-33), et les
 * durées maximales.
 */

/** Le plafond légal du seuil de déclenchement. Jamais dépassable. */
export const PLAFOND_ANNUEL_LEGAL = 1607;

/** Le plancher légal de majoration des heures supplémentaires (L. 3121-33). */
export const PLANCHER_MAJORATION_HS_PCT = 10;

export interface ParametresAnnualisation {
  /**
   * Seuil de déclenchement des heures supplémentaires sur la période.
   * Par défaut mille six cent sept. Un accord peut descendre en dessous ;
   * la loi interdit de monter au-dessus.
   */
  seuilDeclenchementHS: number;
  /**
   * Limite hebdomadaire haute : au-delà, les heures sont supplémentaires
   * immédiatement et payées avec le salaire du mois. Point capital de
   * l'article L. 3121-44 : ces heures-là NE sont PAS recomptées en fin de
   * période — sans quoi on les majorerait deux fois.
   *
   * L'accord de branche du 1er avril 1999 retient quarante-quatre heures.
   */
  limiteHebdoHaute: number | null;
  /** Limite hebdomadaire basse de la modulation. L'accord de 1999 retient 21 h. */
  limiteHebdoBasse: number | null;
  /** Premier taux de majoration. Défaut supplétif : 25 % (L. 3121-36). */
  majorationHS1Pct: number;
  /** Second taux, au-delà du seuil de bascule. Défaut supplétif : 50 %. */
  majorationHS2Pct: number;
  /** Nombre d'heures au premier taux avant bascule. Défaut supplétif : 8. */
  seuilBasculeHS: number;
  /** Contingent annuel. Défaut supplétif : 220 heures (D. 3121-24). */
  contingentAnnuel: number;
}

/**
 * Les valeurs supplétives : celles qui s'appliquent À DÉFAUT d'accord.
 * Ce ne sont pas des règles d'ordre public — un accord peut toutes les
 * modifier, dans la limite du plancher de dix pour cent et du plafond de
 * mille six cent sept heures.
 */
export const ANNUALISATION_SUPPLETIVE: ParametresAnnualisation = {
  seuilDeclenchementHS: PLAFOND_ANNUEL_LEGAL,
  limiteHebdoHaute: null,
  limiteHebdoBasse: null,
  majorationHS1Pct: 25,
  majorationHS2Pct: 50,
  seuilBasculeHS: 8,
  contingentAnnuel: 220,
};

export interface ControleParametres {
  valide: boolean;
  erreurs: string[];
}

/**
 * Vérifie que les paramètres saisis respectent l'ordre public.
 * Un logiciel qui laisse saisir un seuil à mille huit cents heures fabrique
 * une infraction, pas une souplesse.
 */
export function controlerParametres(p: ParametresAnnualisation): ControleParametres {
  const erreurs: string[] = [];

  if (p.seuilDeclenchementHS > PLAFOND_ANNUEL_LEGAL) {
    erreurs.push(
      `Le seuil de déclenchement des heures supplémentaires ne peut pas dépasser ${PLAFOND_ANNUEL_LEGAL} heures (article L. 3121-41). La Cour de cassation l'a confirmé le 11 mai 2016 : ce plafond vaut même si le salarié n'a pas acquis tous ses congés.`,
    );
  }
  if (p.seuilDeclenchementHS <= 0) {
    erreurs.push('Le seuil de déclenchement doit être un nombre d’heures positif.');
  }
  if (p.majorationHS1Pct < PLANCHER_MAJORATION_HS_PCT || p.majorationHS2Pct < PLANCHER_MAJORATION_HS_PCT) {
    erreurs.push(
      `Un accord ne peut pas fixer une majoration d'heures supplémentaires inférieure à ${PLANCHER_MAJORATION_HS_PCT} % (article L. 3121-33).`,
    );
  }
  if (p.limiteHebdoHaute !== null && p.limiteHebdoHaute > 48) {
    erreurs.push(
      'La limite hebdomadaire haute ne peut pas dépasser 48 heures : c’est la durée maximale absolue (article L. 3121-20).',
    );
  }
  if (
    p.limiteHebdoHaute !== null &&
    p.limiteHebdoBasse !== null &&
    p.limiteHebdoBasse > p.limiteHebdoHaute
  ) {
    erreurs.push('La limite basse de modulation ne peut pas dépasser la limite haute.');
  }

  return { valide: erreurs.length === 0, erreurs };
}

// ── Volume à planifier ──────────────────────────────────────────────────────

export interface ParametresVolume {
  /** Année civile de référence. */
  annee: number;
  /** Jours de repos hebdomadaire dans l'année. Deux par semaine = 104. */
  joursReposHebdo: number;
  /** Congés payés, en jours ouvrés. Vingt-cinq pour cinq semaines. */
  joursCongesPayes: number;
  /**
   * Congés trimestriels — la particularité du secteur.
   * Dix-huit jours pour le personnel éducatif de la CCN 66 (annexe 3,
   * article 6) et de la CCN 51 dans les établissements pour personnes
   * handicapées, neuf pour le personnel administratif, neuf en CHRS. Ces
   * jours retirent des jours travaillables, donc des heures planifiables.
   */
  joursCongesTrimestriels: number;
  /** Durée d'une journée de travail, en heures. */
  heuresParJour: number;
  /** Quotité de travail, de 0 à 1. Un mi-temps vaut 0,5. */
  quotite: number;
  /** Les fériés qui tombent un jour normalement travaillé et sont chômés. */
  feriesChomes?: number;
  /** La journée de solidarité s'ajoute : sept heures, proratisées. */
  journeeSolidarite?: boolean;
  droitLocal?: boolean;
  vendrediSaint?: boolean;
}

export interface VolumeAnnuel {
  joursCalendaires: number;
  joursTravaillables: number;
  heuresAPlanifier: number;
  /** Le détail du calcul, pour que le résultat soit vérifiable à la main. */
  detail: {
    reposHebdo: number;
    congesPayes: number;
    congesTrimestriels: number;
    feriesChomes: number;
    heuresSolidarite: number;
  };
}

/**
 * Combien d'heures peut-on réellement planifier dans l'année.
 *
 * Le nombre de fériés retenus est estimé par défaut à partir du calendrier
 * réel de l'année, mais il reste surchargeable : selon qu'un férié tombe un
 * dimanche ou un jour de repos, il ne coûte pas la même chose, et le mode de
 * décompte varie d'un établissement à l'autre.
 */
export function volumeAnnuel(p: ParametresVolume): VolumeAnnuel {
  const debut = new Date(Date.UTC(p.annee, 0, 1));
  const fin = new Date(Date.UTC(p.annee, 11, 31));
  const joursCalendaires =
    Math.round((fin.getTime() - debut.getTime()) / 86_400_000) + 1;

  const feries =
    p.feriesChomes ??
    // À défaut de précision, on retient les fériés qui ne tombent ni un samedi
    // ni un dimanche : ce sont ceux qui retirent effectivement un jour ouvré.
    feriesEntre(debut, fin, {
      droitLocal: p.droitLocal,
      vendrediSaint: p.vendrediSaint,
    } as OptionsFeries).filter((f) => {
      const j = new Date(`${f.date}T00:00:00Z`).getUTCDay();
      return j !== 0 && j !== 6;
    }).length;

  const joursTravaillables = Math.max(
    0,
    joursCalendaires -
      p.joursReposHebdo -
      p.joursCongesPayes -
      p.joursCongesTrimestriels -
      feries,
  );

  const heuresSolidarite = p.journeeSolidarite === false ? 0 : 7 * p.quotite;
  const heures =
    Math.round((joursTravaillables * p.heuresParJour * p.quotite + heuresSolidarite) * 100) / 100;

  return {
    joursCalendaires,
    joursTravaillables,
    heuresAPlanifier: heures,
    detail: {
      reposHebdo: p.joursReposHebdo,
      congesPayes: p.joursCongesPayes,
      congesTrimestriels: p.joursCongesTrimestriels,
      feriesChomes: feries,
      heuresSolidarite: Math.round(heuresSolidarite * 100) / 100,
    },
  };
}

// ── Compteur de période ─────────────────────────────────────────────────────

export interface SemaineTravaillee {
  /** Lundi de la semaine, au format ISO. */
  lundi: string;
  /** Heures de travail effectif de la semaine. */
  heures: number;
}

export interface BilanAnnualisation {
  heuresTravaillees: number;
  /** Heures dépassant la limite hebdomadaire haute, déjà payées en cours d'année. */
  heuresSupHebdo: number;
  /**
   * Heures supplémentaires constatées en fin de période, déduction faite de
   * celles déjà comptées au titre du dépassement hebdomadaire — c'est la
   * règle expresse de l'article L. 3121-44, et elle évite la double majoration.
   */
  heuresSupFinDePeriode: number;
  totalHeuresSup: number;
  /** Répartition selon le seuil de bascule entre les deux taux. */
  heuresAuTaux1: number;
  heuresAuTaux2: number;
  /** Heures au-delà du contingent : elles ouvrent une contrepartie en repos. */
  heuresHorsContingent: number;
  /** Semaines dépassant la limite haute, pour pouvoir les montrer. */
  semainesEnDepassement: SemaineTravaillee[];
  /** Écart au volume prévu : négatif quand la personne est en sous-activité. */
  ecartAuVolumePrevu: number | null;
  alertes: string[];
}

/**
 * Le bilan de fin de période.
 *
 * L'ordre des opérations vient directement de l'article L. 3121-44 : on
 * compte d'abord les heures au-delà de la limite hebdomadaire haute, qui sont
 * supplémentaires immédiatement et payées avec le mois ; puis on compare le
 * total annuel au seuil, EN RETIRANT celles déjà comptées. Inverser les deux
 * conduit à majorer deux fois les mêmes heures.
 */
export function bilanAnnualisation(
  semaines: SemaineTravaillee[],
  p: ParametresAnnualisation,
  volumePrevu: number | null = null,
): BilanAnnualisation {
  const alertes: string[] = [];
  const heuresTravaillees =
    Math.round(semaines.reduce((s, x) => s + x.heures, 0) * 100) / 100;

  const semainesEnDepassement: SemaineTravaillee[] = [];
  let heuresSupHebdo = 0;
  if (p.limiteHebdoHaute !== null) {
    for (const s of semaines) {
      if (s.heures > p.limiteHebdoHaute) {
        heuresSupHebdo += s.heures - p.limiteHebdoHaute;
        semainesEnDepassement.push(s);
      }
      // Quarante-huit heures est un plafond absolu (L. 3121-20) : le
      // dépassement n'est pas une heure supplémentaire de plus, c'est une
      // infraction.
      if (s.heures > 48) {
        alertes.push(
          `Semaine du ${s.lundi} : ${s.heures} h travaillées. La durée maximale hebdomadaire absolue de 48 heures (article L. 3121-20) est dépassée.`,
        );
      }
    }
  }
  heuresSupHebdo = Math.round(heuresSupHebdo * 100) / 100;

  // Le retrait des heures déjà comptées : la règle expresse de L. 3121-44.
  const brutFinDePeriode = heuresTravaillees - p.seuilDeclenchementHS - heuresSupHebdo;
  const heuresSupFinDePeriode = Math.max(0, Math.round(brutFinDePeriode * 100) / 100);

  const total = Math.round((heuresSupHebdo + heuresSupFinDePeriode) * 100) / 100;
  const auTaux1 = Math.min(total, p.seuilBasculeHS);
  const auTaux2 = Math.round((total - auTaux1) * 100) / 100;
  const horsContingent = Math.max(0, Math.round((total - p.contingentAnnuel) * 100) / 100);

  if (horsContingent > 0) {
    alertes.push(
      `${horsContingent} h dépassent le contingent annuel de ${p.contingentAnnuel} h. Ces heures ouvrent droit à une contrepartie obligatoire en repos (article L. 3121-30), en plus de leur majoration.`,
    );
  }

  // La moyenne sur douze semaines consécutives ne peut pas dépasser
  // quarante-quatre heures (L. 3121-22). C'est une limite glissante, pas une
  // moyenne annuelle — on la vérifie fenêtre par fenêtre.
  for (let i = 0; i + 12 <= semaines.length; i++) {
    const fenetre = semaines.slice(i, i + 12);
    const moyenne = fenetre.reduce((s, x) => s + x.heures, 0) / 12;
    if (moyenne > 44) {
      alertes.push(
        `Douze semaines consécutives à partir du ${fenetre[0].lundi} : ${Math.round(moyenne * 10) / 10} h de moyenne. La limite de 44 heures sur douze semaines (article L. 3121-22) est dépassée.`,
      );
      break;
    }
  }

  return {
    heuresTravaillees,
    heuresSupHebdo,
    heuresSupFinDePeriode,
    totalHeuresSup: total,
    heuresAuTaux1: auTaux1,
    heuresAuTaux2: auTaux2,
    heuresHorsContingent: horsContingent,
    semainesEnDepassement,
    ecartAuVolumePrevu:
      volumePrevu === null ? null : Math.round((heuresTravaillees - volumePrevu) * 100) / 100,
    alertes,
  };
}

// ── Entrée et sortie en cours de période ────────────────────────────────────

/**
 * Le cas du remplaçant, c'est-à-dire le cas normal ici.
 *
 * Presque personne, en remplacement, ne fait une période de référence
 * complète. L'article D. 3121-25 tranche pour l'aménagement décidé
 * unilatéralement : en cas d'arrivée ou de départ en cours de période, les
 * heures au-delà de trente-cinq heures hebdomadaires sont des heures
 * supplémentaires — on repasse donc à un décompte à la semaine, PAS à un
 * prorata du seuil annuel.
 *
 * Quand un accord existe, c'est lui qui fixe la règle (L. 3121-44, 3°) : d'où
 * le paramètre `regleAccord`.
 */
export function bilanPeriodePartielle(
  semaines: SemaineTravaillee[],
  p: ParametresAnnualisation,
  regleAccord: 'hebdomadaire' | 'prorata' = 'hebdomadaire',
  partAnnee = 1,
): BilanAnnualisation {
  if (regleAccord === 'prorata') {
    const seuil = Math.round(p.seuilDeclenchementHS * Math.min(1, Math.max(0, partAnnee)));
    return bilanAnnualisation(semaines, { ...p, seuilDeclenchementHS: seuil });
  }

  // Décompte hebdomadaire strict à trente-cinq heures.
  const alertes: string[] = [];
  let sup = 0;
  const depassements: SemaineTravaillee[] = [];
  for (const s of semaines) {
    if (s.heures > 35) {
      sup += s.heures - 35;
      depassements.push(s);
    }
    if (s.heures > 48) {
      alertes.push(
        `Semaine du ${s.lundi} : ${s.heures} h travaillées. La durée maximale hebdomadaire absolue de 48 heures (article L. 3121-20) est dépassée.`,
      );
    }
  }
  sup = Math.round(sup * 100) / 100;
  const auTaux1 = Math.min(sup, p.seuilBasculeHS);

  alertes.push(
    "Période incomplète : le décompte se fait semaine par semaine au-delà de 35 heures, et non au prorata du seuil annuel (article D. 3121-25). Si votre accord d'entreprise prévoit une autre règle, changez le mode de calcul dans les paramètres.",
  );

  return {
    heuresTravaillees: Math.round(semaines.reduce((s, x) => s + x.heures, 0) * 100) / 100,
    heuresSupHebdo: sup,
    heuresSupFinDePeriode: 0,
    totalHeuresSup: sup,
    heuresAuTaux1: auTaux1,
    heuresAuTaux2: Math.round((sup - auTaux1) * 100) / 100,
    heuresHorsContingent: Math.max(0, Math.round((sup - p.contingentAnnuel) * 100) / 100),
    semainesEnDepassement: depassements,
    ecartAuVolumePrevu: null,
    alertes,
  };
}
