/**
 * CONFORMITÉ HORAIRE — les plafonds de durée du travail, calculés hors base.
 *
 * Pourquoi ce fichier existe séparément : ces règles n'ont besoin d'aucune
 * requête. Ce sont des fonctions pures sur une liste de créneaux, donc
 * testables unitairement et réutilisables ailleurs (simulation, export paie,
 * fiche intervenant) sans traîner Prisma derrière.
 *
 * LE POINT MÉTIER QUI JUSTIFIE TOUT LE RESTE : les plafonds s'appliquent au
 * SALARIÉ, en cumulant TOUS ses employeurs (art. L. 8261-1 du code du travail).
 * Un établissement seul ne peut pas les vérifier — il ne voit que ses propres
 * heures. La seule parade prévue par les textes est de demander une attestation
 * écrite au salarié, autant dire rien. C'est exactement pour ça qu'on appelle
 * les créneaux sur `freelanceId` sans filtrer sur `accountId` : le compteur
 * agrège les heures d'un intervenant chez tous les établissements du réseau.
 * C'est la seule chose ici que personne d'autre ne peut faire.
 *
 * Références :
 *  - 10 h/jour (12 h par accord ou dérogation) — art. L. 3121-18 et L. 3121-19
 *  - 48 h sur une semaine isolée — art. L. 3121-20
 *  - 44 h en moyenne sur 12 semaines consécutives — art. L. 3121-22
 *  - 11 h de repos quotidien consécutif — art. L. 3131-1
 *  - 35 h de repos hebdomadaire consécutif (24 h + 11 h) — art. L. 3132-2
 *
 * La CCN 66 et la CCN 51 peuvent être plus protectrices que ces plafonds :
 * les constantes sont regroupées en haut pour qu'un paramétrage par convention
 * reste une modification d'une ligne, pas une réécriture.
 */

export const PLAFONDS = {
  /** Durée quotidienne au-delà de laquelle on alerte (art. L. 3121-18). */
  jourAlerte: 10,
  /** Durée quotidienne maximale, dérogations comprises (art. L. 3121-19). */
  jourMax: 12,
  /** Plafond absolu sur une semaine isolée (art. L. 3121-20). */
  semaineMax: 48,
  /** Seuil d'alerte avant le mur des 48 h. */
  semaineAlerte: 44,
  /** Moyenne maximale sur 12 semaines consécutives (art. L. 3121-22). */
  moyenneMax: 44,
  /** Seuil d'alerte sur la moyenne glissante. */
  moyenneAlerte: 42,
  /** Nombre de semaines de la période de référence. */
  fenetreSemaines: 12,
  /** Repos quotidien consécutif minimal (art. L. 3131-1). */
  reposQuotidien: 11,
  /** Repos hebdomadaire consécutif minimal (art. L. 3132-2). */
  reposHebdo: 35,
} as const;

export type Gravite = 'INFO' | 'BLOQUANT';

export interface Constat {
  /** Identifiant stable, pour que le front puisse cibler un message précis. */
  code:
    | 'JOUR_ALERTE'
    | 'JOUR_MAX'
    | 'SEMAINE_ALERTE'
    | 'SEMAINE_MAX'
    | 'MOYENNE_ALERTE'
    | 'MOYENNE_MAX'
    | 'REPOS_QUOTIDIEN'
    | 'REPOS_HEBDO';
  gravite: Gravite;
  /** Phrase affichable telle quelle, en français, chiffres compris. */
  message: string;
  /** L'article invoqué, pour que le responsable sache ce qu'il engage. */
  regle: string;
  /** La valeur constatée et le plafond, pour un affichage en jauge. */
  valeur: number;
  plafond: number;
}

export interface Creneau {
  startAt: Date;
  endAt: Date;
}

const H = 3_600_000;
const J = 86_400_000;

/** Formate un nombre d'heures à la française : 47,5 et non 47.5. */
export const fh = (n: number) => n.toFixed(1).replace('.', ',');

/** Lundi 00:00 UTC de la semaine contenant `d`. */
export function lundiDe(d: Date): Date {
  const l = new Date(d);
  l.setUTCHours(0, 0, 0, 0);
  l.setUTCDate(l.getUTCDate() - ((l.getUTCDay() + 6) % 7));
  return l;
}

// La durée brute d'un créneau ne sert plus : tous les calculs passent par
// `chevauchement`, qui répartit au prorata les services à cheval sur deux
// jours ou deux semaines. Compter une nuit du dimanche au lundi en entier du
// côté de son début faisait basculer une semaine au-delà du plafond à tort.

/**
 * Heures d'un créneau qui tombent dans [debut, fin[. Un service de nuit à
 * cheval sur deux jours ou deux semaines est réparti au prorata plutôt que
 * compté en entier du côté de son début : sans ça, une nuit du dimanche au
 * lundi ferait basculer une semaine entière au-delà du plafond à tort.
 */
function chevauchement(c: Creneau, debut: Date, fin: Date): number {
  const d = Math.max(c.startAt.getTime(), debut.getTime());
  const f = Math.min(c.endAt.getTime(), fin.getTime());
  return f > d ? (f - d) / H : 0;
}

/** Total d'heures sur une fenêtre [debut, fin[. */
export function heuresSur(creneaux: Creneau[], debut: Date, fin: Date): number {
  return creneaux.reduce((acc, c) => acc + chevauchement(c, debut, fin), 0);
}

/**
 * Évalue un créneau candidat au regard des plafonds, en le replaçant parmi
 * les créneaux déjà connus de la même personne (tous employeurs confondus).
 *
 * `creneaux` doit couvrir au moins les 12 semaines qui précèdent et la semaine
 * qui suit le candidat, sans quoi la moyenne glissante est sous-estimée.
 * `candidat` ne doit PAS figurer dans `creneaux` (sinon il est compté deux fois).
 */
export function evaluerCreneau(creneaux: Creneau[], candidat: Creneau): Constat[] {
  const constats: Constat[] = [];
  const tous = [...creneaux, candidat].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  // ── 1. Journée ──────────────────────────────────────────────────────────
  const jour0 = new Date(candidat.startAt);
  jour0.setUTCHours(0, 0, 0, 0);
  const jour1 = new Date(jour0.getTime() + J);
  const heuresJour = heuresSur(tous, jour0, jour1);
  if (heuresJour > PLAFONDS.jourMax) {
    constats.push({
      code: 'JOUR_MAX',
      gravite: 'BLOQUANT',
      message: `${fh(heuresJour)} h de travail sur la journée — au-delà du maximum de ${PLAFONDS.jourMax} h, dérogations comprises.`,
      regle: 'Durée quotidienne maximale — art. L. 3121-19 du code du travail',
      valeur: heuresJour,
      plafond: PLAFONDS.jourMax,
    });
  } else if (heuresJour > PLAFONDS.jourAlerte) {
    constats.push({
      code: 'JOUR_ALERTE',
      gravite: 'INFO',
      message: `${fh(heuresJour)} h sur la journée — au-delà des ${PLAFONDS.jourAlerte} h habituelles. Possible seulement si un accord ou une dérogation le prévoit.`,
      regle: 'Durée quotidienne — art. L. 3121-18 du code du travail',
      valeur: heuresJour,
      plafond: PLAFONDS.jourAlerte,
    });
  }

  // ── 2. Semaine isolée ───────────────────────────────────────────────────
  const lundi = lundiDe(candidat.startAt);
  const lundiSuivant = new Date(lundi.getTime() + 7 * J);
  const heuresSemaine = heuresSur(tous, lundi, lundiSuivant);
  if (heuresSemaine > PLAFONDS.semaineMax) {
    constats.push({
      code: 'SEMAINE_MAX',
      gravite: 'BLOQUANT',
      message: `${fh(heuresSemaine)} h sur la semaine — au-delà du plafond absolu de ${PLAFONDS.semaineMax} h.`,
      regle: 'Durée hebdomadaire maximale — art. L. 3121-20 du code du travail',
      valeur: heuresSemaine,
      plafond: PLAFONDS.semaineMax,
    });
  } else if (heuresSemaine > PLAFONDS.semaineAlerte) {
    constats.push({
      code: 'SEMAINE_ALERTE',
      gravite: 'INFO',
      message: `${fh(heuresSemaine)} h sur la semaine — la moyenne sur 12 semaines ne pourra pas dépasser ${PLAFONDS.moyenneMax} h.`,
      regle: 'Durée hebdomadaire — art. L. 3121-22 du code du travail',
      valeur: heuresSemaine,
      plafond: PLAFONDS.semaineAlerte,
    });
  }

  // ── 3. Moyenne sur 12 semaines consécutives ─────────────────────────────
  // On teste TOUTES les fenêtres de 12 semaines qui contiennent la semaine
  // modifiée, pas seulement celle qui s'y termine : un créneau ajouté
  // aujourd'hui peut faire basculer une fenêtre qui se termine dans 11
  // semaines, et c'est le dépassement qu'un contrôle constaterait.
  let pireMoyenne = 0;
  let pireDebut = lundi;
  for (let decalage = 0; decalage < PLAFONDS.fenetreSemaines; decalage++) {
    const debut = new Date(lundi.getTime() - decalage * 7 * J);
    const fin = new Date(debut.getTime() + PLAFONDS.fenetreSemaines * 7 * J);
    const moyenne = heuresSur(tous, debut, fin) / PLAFONDS.fenetreSemaines;
    if (moyenne > pireMoyenne) {
      pireMoyenne = moyenne;
      pireDebut = debut;
    }
  }
  const periode = `du ${pireDebut.toLocaleDateString('fr-FR', { timeZone: 'UTC' })} au ${new Date(
    pireDebut.getTime() + PLAFONDS.fenetreSemaines * 7 * J - J,
  ).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}`;
  if (pireMoyenne > PLAFONDS.moyenneMax) {
    constats.push({
      code: 'MOYENNE_MAX',
      gravite: 'BLOQUANT',
      message: `${fh(pireMoyenne)} h par semaine en moyenne sur 12 semaines (${periode}) — au-delà du plafond de ${PLAFONDS.moyenneMax} h.`,
      regle: 'Moyenne sur 12 semaines — art. L. 3121-22 du code du travail',
      valeur: pireMoyenne,
      plafond: PLAFONDS.moyenneMax,
    });
  } else if (pireMoyenne > PLAFONDS.moyenneAlerte) {
    constats.push({
      code: 'MOYENNE_ALERTE',
      gravite: 'INFO',
      message: `${fh(pireMoyenne)} h par semaine en moyenne sur 12 semaines (${periode}) — la marge avant le plafond de ${PLAFONDS.moyenneMax} h se réduit.`,
      regle: 'Moyenne sur 12 semaines — art. L. 3121-22 du code du travail',
      valeur: pireMoyenne,
      plafond: PLAFONDS.moyenneAlerte,
    });
  }

  // ── 4. Repos quotidien ──────────────────────────────────────────────────
  // On ne regarde que les voisins immédiats du candidat : c'est là que le
  // repos se joue, et ça évite de signaler un trou vieux de trois semaines.
  const index = tous.indexOf(candidat);
  const precedent = tous[index - 1];
  const suivant = tous[index + 1];
  for (const [voisin, sens] of [
    [precedent, 'avant'],
    [suivant, 'après'],
  ] as const) {
    if (!voisin) continue;
    const repos =
      sens === 'avant'
        ? (candidat.startAt.getTime() - voisin.endAt.getTime()) / H
        : (voisin.startAt.getTime() - candidat.endAt.getTime()) / H;
    if (repos >= 0 && repos < PLAFONDS.reposQuotidien) {
      constats.push({
        code: 'REPOS_QUOTIDIEN',
        gravite: 'BLOQUANT',
        message: `${fh(repos)} h de repos avec le créneau ${sens} — moins que les ${PLAFONDS.reposQuotidien} h de repos quotidien.`,
        regle: 'Repos quotidien — art. L. 3131-1 du code du travail',
        valeur: repos,
        plafond: PLAFONDS.reposQuotidien,
      });
      break;
    }
  }

  // ── 5. Repos hebdomadaire ───────────────────────────────────────────────
  // Il faut au moins une coupure de 35 h consécutives dans la semaine. On
  // mesure le plus grand intervalle libre entre deux créneaux de la semaine,
  // bornes de semaine comprises.
  const semaine = tous
    .filter((c) => c.endAt > lundi && c.startAt < lundiSuivant)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  if (semaine.length) {
    let plusGrandeCoupure = (semaine[0].startAt.getTime() - lundi.getTime()) / H;
    for (let i = 1; i < semaine.length; i++) {
      const trou = (semaine[i].startAt.getTime() - semaine[i - 1].endAt.getTime()) / H;
      if (trou > plusGrandeCoupure) plusGrandeCoupure = trou;
    }
    const finDeSemaine = (lundiSuivant.getTime() - semaine[semaine.length - 1].endAt.getTime()) / H;
    if (finDeSemaine > plusGrandeCoupure) plusGrandeCoupure = finDeSemaine;
    if (plusGrandeCoupure < PLAFONDS.reposHebdo) {
      constats.push({
        code: 'REPOS_HEBDO',
        gravite: 'BLOQUANT',
        message: `Plus longue coupure de la semaine : ${fh(plusGrandeCoupure)} h — moins que les ${PLAFONDS.reposHebdo} h de repos hebdomadaire.`,
        regle: 'Repos hebdomadaire — art. L. 3132-2 du code du travail',
        valeur: plusGrandeCoupure,
        plafond: PLAFONDS.reposHebdo,
      });
    }
  }

  return constats;
}

/** Raccourci de lecture : y a-t-il au moins un constat bloquant ? */
export const aUnBloquant = (constats: Constat[]) => constats.some((c) => c.gravite === 'BLOQUANT');
