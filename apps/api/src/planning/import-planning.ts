/**
 * LIRE UN PLANNING TEL QU'IL EST EXPORTÉ, PAS TEL QU'ON VOUDRAIT QU'IL SOIT.
 *
 * Les plannings arrivent d'Octime, de Kelio, d'un tableur maison ou d'un
 * export Excel enregistré en CSV. Personne ne va reformater son fichier pour
 * nous : on accepte donc le point-virgule comme la virgule, l'en-tête comme
 * son absence, « 01/09/2026 » comme « 2026-09-01 », « 9h » comme « 09:00 ».
 *
 * Ce fichier ne parle ni à la base ni au réseau : il transforme du texte en
 * créneaux, et rien d'autre. C'est ce qui le rend testable ligne à ligne.
 */

export interface CreneauLu {
  titre: string;
  /** ISO 8601 avec le décalage de Paris : un planning s'écrit en heure locale. */
  debut: string;
  fin: string;
  note?: string;
  /** Numéro de ligne dans le fichier, pour que la personne retrouve la sienne. */
  ligne: number;
}

export interface LigneRefusee {
  ligne: number;
  contenu: string;
  raison: string;
}

export interface LecturePlanning {
  creneaux: CreneauLu[];
  refusees: LigneRefusee[];
  separateur: string;
  enTete: boolean;
}

/** Colonnes reconnues, et les noms sous lesquels on les rencontre. */
const ALIAS: Record<string, string[]> = {
  date: ['date', 'jour', 'journee', 'journée', 'day'],
  debut: ['debut', 'début', 'heuredebut', 'heurededebut', 'heurededébut', 'start', 'arrivee', 'arrivée', 'de'],
  fin: ['fin', 'heurefin', 'heuredefin', 'end', 'depart', 'départ', 'a', 'à'],
  titre: ['titre', 'intitule', 'intitulé', 'libelle', 'libellé', 'poste', 'activite', 'activité', 'service', 'objet'],
  note: ['note', 'notes', 'commentaire', 'commentaires', 'remarque', 'remarques', 'lieu'],
};

function normaliser(valeur: string): string {
  return valeur
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

/** Découpe une ligne CSV en respectant les guillemets. */
export function decouper(ligne: string, separateur: string): string[] {
  const cellules: string[] = [];
  let courant = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];
    if (c === '"') {
      if (dansGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i += 1;
      } else {
        dansGuillemets = !dansGuillemets;
      }
      continue;
    }
    if (c === separateur && !dansGuillemets) {
      cellules.push(courant.trim());
      courant = '';
      continue;
    }
    courant += c;
  }
  cellules.push(courant.trim());
  return cellules;
}

/** « 01/09/2026 », « 1.9.26 », « 2026-09-01 ». */
export function lireDate(valeur: string): { a: number; m: number; j: number } | null {
  const v = valeur.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (m) return { a: Number(m[1]), m: Number(m[2]), j: Number(m[3]) };
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(v);
  if (m) {
    let a = Number(m[3]);
    if (a < 100) a += 2000;
    return { a, m: Number(m[2]), j: Number(m[1]) };
  }
  return null;
}

/** « 9 », « 9h », « 9h30 », « 09:30 », « 9.30 ». */
export function lireHeure(valeur: string): { h: number; min: number } | null {
  const v = valeur.trim().toLowerCase().replace(/\s/g, '').replace(/h$/, '');
  const m = /^(\d{1,2})(?:[:h.,](\d{1,2}))?$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return { h, min };
}

/**
 * Le décalage de Paris au moment considéré, sous la forme « +02:00 ».
 * Un planning se lit en heure locale : sans cela, une nuit d'été se
 * décalerait de deux heures en base, et le décompte serait faux.
 */
export function decalageParis(a: number, m: number, j: number, h: number, min: number): string {
  const repere = new Date(Date.UTC(a, m - 1, j, h, min));
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    timeZoneName: 'longOffset',
  });
  const partie = fmt.formatToParts(repere).find((p) => p.type === 'timeZoneName');
  const brut = partie?.value ?? 'GMT+00:00';
  const decalage = brut.replace('GMT', '');
  return decalage === '' ? '+00:00' : decalage;
}

function deuxChiffres(n: number): string {
  return n < 10 ? '0' + String(n) : String(n);
}

function versIso(a: number, m: number, j: number, h: number, min: number): string {
  return (
    String(a) +
    '-' +
    deuxChiffres(m) +
    '-' +
    deuxChiffres(j) +
    'T' +
    deuxChiffres(h) +
    ':' +
    deuxChiffres(min) +
    ':00' +
    decalageParis(a, m, j, h, min)
  );
}

/**
 * Lit un planning au format CSV et renvoie les créneaux compris ET les lignes
 * refusées. On ne jette jamais une ligne en silence : ce qui n'a pas été
 * compris est rendu à la personne, avec son numéro de ligne et la raison.
 */
export function lirePlanningCsv(contenu: string): LecturePlanning {
  const lignes = contenu
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd());

  const premiere = lignes.find((l) => l.trim() !== '') ?? '';
  const separateur =
    (premiere.match(/;/g) ?? []).length >= (premiere.match(/,/g) ?? []).length ? ';' : ',';

  const creneaux: CreneauLu[] = [];
  const refusees: LigneRefusee[] = [];

  let colonnes: Record<string, number> | null = null;
  let enTete = false;

  lignes.forEach((brute, index) => {
    const numero = index + 1;
    if (brute.trim() === '') return;

    const cellules = decouper(brute, separateur);

    // L'en-tête : reconnu à ses noms de colonnes, jamais à sa position.
    if (colonnes === null) {
      const trouvees: Record<string, number> = {};
      cellules.forEach((cellule, i) => {
        const cle = normaliser(cellule);
        for (const [champ, noms] of Object.entries(ALIAS)) {
          if (noms.includes(cle) && trouvees[champ] === undefined) trouvees[champ] = i;
        }
      });
      if (trouvees.date !== undefined && trouvees.debut !== undefined && trouvees.fin !== undefined) {
        colonnes = trouvees;
        enTete = true;
        return;
      }
      // Pas d'en-tête : on retombe sur l'ordre le plus courant.
      colonnes = { date: 0, debut: 1, fin: 2, titre: 3, note: 4 };
    }

    const cellule = (champ: string): string => {
      const i = colonnes?.[champ];
      return i === undefined ? '' : (cellules[i] ?? '');
    };

    const date = lireDate(cellule('date'));
    if (!date) {
      refusees.push({ ligne: numero, contenu: brute.slice(0, 200), raison: 'Date illisible.' });
      return;
    }
    const debut = lireHeure(cellule('debut'));
    const fin = lireHeure(cellule('fin'));
    if (!debut || !fin) {
      refusees.push({ ligne: numero, contenu: brute.slice(0, 200), raison: 'Horaire illisible.' });
      return;
    }

    // Une nuit qui finit avant de commencer, c'est une nuit : le lendemain.
    const finApresMinuit =
      fin.h < debut.h || (fin.h === debut.h && fin.min <= debut.min);
    const lendemain = new Date(Date.UTC(date.a, date.m - 1, date.j + (finApresMinuit ? 1 : 0)));

    const titreLu = cellule('titre').trim();
    const noteLue = cellule('note').trim();

    creneaux.push({
      titre: titreLu === '' ? 'Créneau importé' : titreLu.slice(0, 160),
      debut: versIso(date.a, date.m, date.j, debut.h, debut.min),
      fin: versIso(
        lendemain.getUTCFullYear(),
        lendemain.getUTCMonth() + 1,
        lendemain.getUTCDate(),
        fin.h,
        fin.min,
      ),
      note: noteLue === '' ? undefined : noteLue.slice(0, 2000),
      ligne: numero,
    });
  });

  return { creneaux, refusees, separateur, enTete };
}
