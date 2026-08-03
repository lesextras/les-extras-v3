import { Ferie, ferieDuJour, OptionsFeries } from './feries';

/**
 * LES MAJORATIONS : NUIT, DIMANCHE, JOURS FÉRIÉS.
 *
 * Un avertissement en tête de fichier, parce qu'il commande toute
 * l'architecture de ce module.
 *
 * **Dans le secteur social et médico-social, la seule majoration imposée par
 * la loi est celle du 1er mai.** Tout le reste est conventionnel :
 *
 *   • Le travail de nuit ouvre droit à un repos compensateur obligatoire,
 *     mais la compensation salariale n'est due que « le cas échéant »
 *     (article L. 3122-8). La loi ne fixe aucun taux.
 *   • Le travail du dimanche ne donne lieu à aucune majoration légale : les
 *     établissements sociaux et médico-sociaux figurent nommément dans les
 *     dérogations permanentes de droit au repos dominical (L. 3132-12 et
 *     R. 3132-5), et cette dérogation n'emporte aucune contrepartie.
 *   • Les dix fêtes légales autres que le 1er mai sont travaillables sans
 *     majoration légale.
 *
 * Écrire un taux de nuit ou de dimanche en dur dans ce fichier produirait des
 * chiffrages faux pour tous les établissements — et faux dans le sens le plus
 * dangereux : un coût annoncé qui ne correspond pas à ce qui sera payé.
 *
 * Les taux viennent donc de l'établissement, qui les lit dans sa convention
 * ou son accord. Le moteur, lui, sait découper une vacation en heures de
 * nuit, de dimanche et de férié — ce qui est purement calendaire, et là
 * l'outil apporte une vraie valeur : personne ne fait ce découpage à la main
 * sans se tromper sur un service de nuit qui passe minuit un samedi de
 * Pentecôte.
 */

/**
 * Les paramètres que l'établissement renseigne d'après SA convention.
 * Aucune valeur par défaut de majoration n'est proposée : un zéro affiché est
 * honnête, un taux inventé ne l'est pas.
 */
export interface ParametresMajorations {
  /**
   * Plage de nuit, en heures pleines. L'accord de branche du 17 avril 2002
   * demande neuf heures continues à positionner dans l'amplitude 21 h – 7 h ;
   * à défaut d'accord, la loi retient 21 h – 6 h (L. 3122-20).
   */
  nuitDebutHeure: number;
  nuitFinHeure: number;
  /** Majoration des heures de nuit, en pourcentage. Conventionnelle. */
  nuitPct: number;
  /** Majoration des heures du dimanche, en pourcentage. Conventionnelle. */
  dimanchePct: number;
  /** Majoration des heures de jour férié, en pourcentage. Conventionnelle. */
  feriePct: number;
  /**
   * Cumul dimanche + férié quand un férié tombe un dimanche.
   * La CCN 51 l'exclut expressément (annexe III, article A3.3 : « lorsqu'un
   * jour férié tombe un dimanche il n'y a pas de cumul »). D'autres textes
   * sont muets. Le choix appartient donc à l'établissement.
   */
  cumulDimancheEtFerie: boolean;
  /** Le département relève-t-il du droit local d'Alsace-Moselle ? */
  droitLocal?: boolean;
  /** La commune dispose-t-elle d'un temple protestant ou d'une église mixte ? */
  vendrediSaint?: boolean;
}

/** Les majorations à zéro : l'état de départ, tant que rien n'est renseigné. */
export const MAJORATIONS_NEUTRES: ParametresMajorations = {
  // À défaut de convention ou d'accord, l'article L. 3122-20 retient 21 h – 6 h.
  nuitDebutHeure: 21,
  nuitFinHeure: 6,
  nuitPct: 0,
  dimanchePct: 0,
  feriePct: 0,
  cumulDimancheEtFerie: false,
};

export interface Vacation {
  /** Début effectif, en heure locale française. */
  debut: Date;
  /** Fin effective. Peut tomber le lendemain : le service de nuit passe minuit. */
  fin: Date;
}

export interface HeuresQualifiees {
  /** Durée totale, en heures décimales. */
  total: number;
  /** Heures tombant dans la plage de nuit. */
  nuit: number;
  /** Heures tombant un dimanche. */
  dimanche: number;
  /** Heures tombant un jour férié. */
  ferie: number;
  /** Heures tombant le 1er mai — isolées, parce que leur régime est légal. */
  premierMai: number;
  /** Les fériés rencontrés, pour pouvoir les nommer dans un devis. */
  feriesRencontres: Ferie[];
}

/** Une minute, en millisecondes. */
const MINUTE = 60_000;

/**
 * Le découpage.
 *
 * On avance minute par minute plutôt que de raisonner par bornes. C'est plus
 * lent, mais c'est le seul moyen simple d'être juste dans les cas qui font
 * vraiment perdre de l'argent : une vacation de 21 h à 7 h qui commence un
 * samedi et finit un dimanche, un férié qui démarre à minuit au milieu d'un
 * service de nuit, un changement d'heure. Sur une vacation de douze heures,
 * cela fait sept cent vingt itérations — le coût est négligeable, et le
 * résultat se vérifie à la main.
 */
export function qualifierHeures(
  vacation: Vacation,
  p: ParametresMajorations,
): HeuresQualifiees {
  const options: OptionsFeries = { droitLocal: p.droitLocal, vendrediSaint: p.vendrediSaint };
  const debut = vacation.debut.getTime();
  const fin = vacation.fin.getTime();
  if (!(fin > debut)) {
    return { total: 0, nuit: 0, dimanche: 0, ferie: 0, premierMai: 0, feriesRencontres: [] };
  }

  let minutesNuit = 0;
  let minutesDimanche = 0;
  let minutesFerie = 0;
  let minutesPremierMai = 0;
  const feries = new Map<string, Ferie>();

  // Cache des fériés par jour : sans lui, on recalculerait le comput de Pâques
  // à chaque minute.
  const cacheFerie = new Map<string, Ferie | null>();
  const ferieDe = (d: Date): Ferie | null => {
    const cle = d.toISOString().slice(0, 10);
    if (!cacheFerie.has(cle)) cacheFerie.set(cle, ferieDuJour(d, options));
    return cacheFerie.get(cle) ?? null;
  };

  for (let t = debut; t < fin; t += MINUTE) {
    const d = new Date(t);
    const heure = d.getUTCHours();

    // La plage de nuit peut enjamber minuit — c'est même le cas normal.
    const estNuit =
      p.nuitDebutHeure > p.nuitFinHeure
        ? heure >= p.nuitDebutHeure || heure < p.nuitFinHeure
        : heure >= p.nuitDebutHeure && heure < p.nuitFinHeure;
    if (estNuit) minutesNuit += 1;

    const estDimanche = d.getUTCDay() === 0;
    const f = ferieDe(d);
    if (f) feries.set(f.date, f);

    // Le 1er mai est compté à part : sa majoration de 100 % vient de la loi
    // (L. 3133-6), pas de la convention, et elle prend la forme d'une
    // indemnité distincte du salaire — deux lignes de paie, pas un taux.
    const estPremierMai = f?.nom === 'FETE_TRAVAIL';
    if (estPremierMai) {
      minutesPremierMai += 1;
    } else if (f) {
      minutesFerie += 1;
    }

    if (estDimanche) {
      // Non-cumul : quand l'établissement l'a choisi, un férié tombant un
      // dimanche ne compte qu'une fois — au titre du férié.
      if (!f || p.cumulDimancheEtFerie) minutesDimanche += 1;
    }
  }

  const h = (m: number) => Math.round((m / 60) * 100) / 100;
  return {
    total: h((fin - debut) / MINUTE),
    nuit: h(minutesNuit),
    dimanche: h(minutesDimanche),
    ferie: h(minutesFerie),
    premierMai: h(minutesPremierMai),
    feriesRencontres: [...feries.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export interface LigneMajoration {
  libelle: string;
  heures: number;
  /** Pourcentage appliqué. */
  tauxPct: number;
  /** Surcoût par rapport au tarif normal, hors salaire de base. */
  montant: number | null;
  /** Vrai quand le taux vient de la loi et non de la convention. */
  legale: boolean;
  /** La référence du texte, pour que le lecteur puisse vérifier. */
  reference: string;
}

export interface Chiffrage {
  heures: HeuresQualifiees;
  /** Coût des heures au tarif de base, sans aucune majoration. */
  baseEstimee: number | null;
  lignes: LigneMajoration[];
  /** Somme des surcoûts. */
  totalMajorations: number | null;
  /** Base plus majorations. Toujours du brut, hors cotisations patronales. */
  totalEstime: number | null;
  /** Ce que le chiffrage ne dit pas, écrit noir sur blanc. */
  avertissements: string[];
}

/**
 * Le chiffrage complet d'une vacation.
 *
 * Sans taux horaire, on renvoie quand même le décompte des heures : savoir
 * qu'une vacation comporte dix heures de nuit et huit heures de dimanche est
 * déjà utile pour vérifier un bulletin, même quand le tarif n'est pas connu.
 */
export function chiffrerVacation(
  vacation: Vacation,
  p: ParametresMajorations,
  tauxHoraire: number | null,
): Chiffrage {
  const heures = qualifierHeures(vacation, p);
  const lignes: LigneMajoration[] = [];
  const avertissements: string[] = [];

  const surcout = (h: number, pct: number): number | null =>
    tauxHoraire === null ? null : Math.round(h * tauxHoraire * (pct / 100) * 100) / 100;

  if (heures.nuit > 0) {
    lignes.push({
      libelle: `Heures de nuit (${p.nuitDebutHeure} h – ${p.nuitFinHeure} h)`,
      heures: heures.nuit,
      tauxPct: p.nuitPct,
      montant: surcout(heures.nuit, p.nuitPct),
      legale: false,
      reference: 'Taux conventionnel — la loi ne fixe aucune majoration de nuit (art. L. 3122-8)',
    });
    if (p.nuitPct === 0) {
      avertissements.push(
        "Aucune majoration de nuit n'est renseignée pour votre établissement. Ce n'est pas une erreur de calcul : la loi n'en impose aucune, elle relève de votre convention collective ou de votre accord d'entreprise. Renseignez-la dans les paramètres si votre texte en prévoit une.",
      );
    }
  }

  if (heures.dimanche > 0) {
    lignes.push({
      libelle: 'Heures du dimanche',
      heures: heures.dimanche,
      tauxPct: p.dimanchePct,
      montant: surcout(heures.dimanche, p.dimanchePct),
      legale: false,
      reference:
        'Taux conventionnel — les ESSMS relèvent de la dérogation permanente au repos dominical (art. R. 3132-5), sans contrepartie légale',
    });
    if (p.dimanchePct === 0) {
      avertissements.push(
        "Aucune majoration du dimanche n'est renseignée. Là encore la loi n'en prévoit pas : votre établissement bénéficie d'une dérogation permanente de droit au repos dominical, qui n'emporte aucune majoration. Seule votre convention peut en créer une.",
      );
    }
  }

  if (heures.ferie > 0) {
    lignes.push({
      libelle: 'Heures de jour férié',
      heures: heures.ferie,
      tauxPct: p.feriePct,
      montant: surcout(heures.ferie, p.feriePct),
      legale: false,
      reference: 'Taux conventionnel — hors 1er mai, aucune majoration de férié n\'est légale',
    });
  }

  if (heures.premierMai > 0) {
    // Le seul taux écrit en dur de tout le module, et il l'est parce qu'il
    // vient de la loi : article L. 3133-6, indemnité égale au salaire.
    lignes.push({
      libelle: 'Heures du 1er mai',
      heures: heures.premierMai,
      tauxPct: 100,
      montant: surcout(heures.premierMai, 100),
      legale: true,
      reference:
        'Article L. 3133-6 — indemnité égale au salaire du travail accompli, en sus de celui-ci',
    });
    avertissements.push(
      "Le 1er mai est majoré de 100 % par la loi. Attention à la mécanique de paie : ce n'est pas un taux horaire doublé mais le salaire normal PLUS une indemnité d'un montant égal, sur deux lignes distinctes du bulletin.",
    );
  }

  const base = tauxHoraire === null ? null : Math.round(heures.total * tauxHoraire * 100) / 100;
  const totalMaj = lignes.every((l) => l.montant === null)
    ? null
    : Math.round(lignes.reduce((s, l) => s + (l.montant ?? 0), 0) * 100) / 100;

  avertissements.push(
    "Estimation de la rémunération brute seule. Les cotisations patronales s'y ajoutent : elles dépendent de votre convention, de votre effectif et des exonérations dont vous bénéficiez.",
  );

  return {
    heures,
    baseEstimee: base,
    lignes,
    totalMajorations: totalMaj,
    totalEstime:
      base === null ? null : Math.round((base + (totalMaj ?? 0)) * 100) / 100,
    avertissements,
  };
}
