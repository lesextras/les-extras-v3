// LIRE UN PLANNING D'ÉQUIPE — la partie qui décide, sans le navigateur.
//
// Tout ce qui juge « cette ligne compte-t-elle, et pour combien d'heures » vit
// ici, en fonctions pures : c'est ce qui se teste, et c'est ce qui se trompe.
// Les trois lecteurs de fichiers (CSV, Excel, PDF) n'ont qu'un seul travail :
// rendre une MATRICE de chaînes. Ils ne comptent rien.
//
// Principe qui gouverne tout le fichier : on ne devine pas. Les colonnes sont
// nommées, une ligne qu'on ne sait pas lire est signalée plutôt qu'ignorée, et
// une heure qu'on ne sait pas interpréter n'est jamais remplacée par zéro. Sur
// du temps de travail, une ligne avalée en silence, c'est une heure qui manque
// au compteur de quelqu'un.

/** Colonnes reconnues, avec les intitulés courants rencontrés en établissement. */
export const COLONNES: Record<string, string[]> = {
  personne: [
    'personne', 'salarie', 'salarié', 'nom', 'agent', 'intervenant',
    'prenom nom', 'prénom nom', 'nom prenom', 'nom prénom', 'collaborateur',
  ],
  date: ['date', 'jour'],
  debut: [
    'debut', 'début', 'heure debut', 'heure début', 'arrivee', 'arrivée',
    'h debut', 'h début', 'prise de poste', 'de',
  ],
  fin: ['fin', 'heure fin', 'depart', 'départ', 'h fin', 'fin de poste', 'a', 'à'],
  type: ['type', 'nature', 'motif', 'categorie', 'catégorie', 'absence', 'statut'],
};

/** Ce qui compte comme une absence plutôt que comme du travail. */
export const ABSENCES = [
  'conge', 'congé', 'conges', 'congés', 'cp', 'rtt', 'absence', 'absent',
  'repos', 'maladie', 'arret', 'arrêt', 'ferie', 'férié', 'formation absente',
];

export interface LignePlanning {
  personne: string;
  date: string;
  debut?: string;
  fin?: string;
  type?: string;
  heures: number;
  estAbsence: boolean;
}

export interface BilanPersonne {
  personne: string;
  heuresTravaillees: number;
  joursAbsence: number;
  jours: number;
}

export interface Lecture {
  lignes: LignePlanning[];
  refusees: { numero: number; raison: string }[];
  colonnesManquantes: string[];
  /** Intitulés de la ligne d'en-tête retenue — on montre ce qu'on a compris. */
  entetes?: string[];
}

/** Enlève les accents et la casse, pour comparer des intitulés de colonnes. */
export function normaliser(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Découpe une ligne CSV en respectant les guillemets. */
export function decouper(ligne: string, sep: string): string[] {
  const cases: string[] = [];
  let courant = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (dansGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else {
        dansGuillemets = !dansGuillemets;
      }
    } else if (c === sep && !dansGuillemets) {
      cases.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  cases.push(courant);
  return cases.map((c) => c.trim());
}

/**
 * « 8h30 », « 08:30 », « 8 », « 0,375 » → minutes depuis minuit. null si illisible.
 *
 * La fraction décimale n'est pas une coquetterie : Excel stocke 9 h du matin
 * comme 0,375 de journée. Un tableur relu sans cela donnerait « 0 h » à tout
 * le monde.
 */
export function enMinutes(valeur: string): number | null {
  const v = String(valeur).trim().replace(',', '.');
  if (!v) return null;

  // Fraction de journée (tableur) : 0,375 = 9 h. Elle passe en premier, sinon
  // « 0.5 » serait lu comme zéro heure cinq.
  if (/^0(\.\d+)?$/.test(v) || /^\.\d+$/.test(v)) {
    const f = Number(v);
    if (f >= 0 && f < 1) return Math.round(f * 24 * 60);
  }

  // Un horaire s'écrit avec « h » ou « : ». Le point et la virgule sont
  // volontairement exclus au-delà de 1 : « 8.5 » veut dire 8 h 30 pour
  // l'un et 8 h 05 pour l'autre, et on ne tranche pas à la place de
  // quelqu'un sur une demi-heure de travail. La ligne sera signalée.
  const hm = v.match(/^(\d{1,2})\s*[h:]\s*(\d{1,2})$/i);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  const h = v.match(/^(\d{1,2})\s*h?$/i);
  if (h) {
    const n = Number(h[1]);
    return n > 23 ? null : n * 60;
  }
  return null;
}

/**
 * Numéro de série d'un tableur → date lisible. Excel compte les jours depuis
 * le 30/12/1899 (son décalage historique du 29 février 1900 inclus).
 */
export function dateDeSerie(n: number): string {
  const ms = Math.round(n) * 86400000 + Date.UTC(1899, 11, 30);
  const d = new Date(ms);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

/** Repère la ligne d'en-tête : la première qui nomme À LA FOIS personne et date. */
export function trouverEntete(matrice: string[][]): number {
  for (let i = 0; i < Math.min(matrice.length, 25); i++) {
    const cases = matrice[i].map(normaliser);
    const aPersonne = cases.some((c) => COLONNES.personne.includes(c));
    const aDate = cases.some((c) => COLONNES.date.includes(c));
    if (aPersonne && aDate) return i;
  }
  return -1;
}

/**
 * Cœur de la lecture : une matrice de chaînes → des lignes de planning.
 *
 * Ne lève jamais. Ce qui n'est pas compris revient dans `refusees`, avec son
 * numéro de ligne tel qu'il apparaît dans le document, pour être montré.
 */
export function lireMatrice(matrice: string[][]): Lecture {
  const utiles = matrice.filter((l) => l.some((c) => String(c).trim() !== ''));
  if (utiles.length < 2) {
    return { lignes: [], refusees: [], colonnesManquantes: ['personne', 'date'] };
  }

  const iEntete = trouverEntete(utiles);
  if (iEntete === -1) {
    return { lignes: [], refusees: [], colonnesManquantes: ['personne', 'date'] };
  }

  const entetes = utiles[iEntete].map(normaliser);
  const index: Record<string, number> = {};
  for (const [cle, alias] of Object.entries(COLONNES)) {
    const i = entetes.findIndex((e) => alias.includes(e));
    if (i >= 0) index[cle] = i;
  }

  const manquantes = ['personne', 'date'].filter((c) => index[c] === undefined);
  if (manquantes.length > 0) {
    return { lignes: [], refusees: [], colonnesManquantes: manquantes, entetes: utiles[iEntete] };
  }

  const lignes: LignePlanning[] = [];
  const refusees: { numero: number; raison: string }[] = [];

  for (let i = iEntete + 1; i < utiles.length; i++) {
    const cases = utiles[i];
    const personne = String(cases[index.personne] ?? '').trim();
    let date = String(cases[index.date] ?? '').trim();
    if (!personne || !date) {
      refusees.push({ numero: i + 1, raison: 'personne ou date absente' });
      continue;
    }
    // Un tableur rend souvent la date en numéro de série.
    if (/^\d{5}(\.\d+)?$/.test(date)) date = dateDeSerie(Number(date));

    const type = index.type !== undefined ? String(cases[index.type] ?? '').trim() : '';
    const estAbsence = ABSENCES.includes(normaliser(type));

    let heures = 0;
    const brutDebut = index.debut !== undefined ? String(cases[index.debut] ?? '').trim() : '';
    const brutFin = index.fin !== undefined ? String(cases[index.fin] ?? '').trim() : '';

    if (!estAbsence && (brutDebut || brutFin)) {
      const d = enMinutes(brutDebut);
      const f = enMinutes(brutFin);
      if (d === null || f === null) {
        refusees.push({ numero: i + 1, raison: `horaire illisible (« ${brutDebut} » → « ${brutFin} »)` });
        continue;
      }
      // Un poste de nuit finit le lendemain : 21 h → 7 h fait dix heures, pas
      // moins quatorze. Sans cette ligne, une équipe de nuit sort en négatif.
      heures = (f >= d ? f - d : 24 * 60 - d + f) / 60;
    } else if (!estAbsence && index.debut === undefined && index.fin === undefined) {
      // Aucune colonne d'horaire dans le document : on compte les jours, pas
      // les heures. On ne fabrique pas une durée qui n'est écrite nulle part.
      heures = 0;
    }

    lignes.push({
      personne,
      date,
      type: type || undefined,
      heures,
      estAbsence,
      debut: brutDebut || undefined,
      fin: brutFin || undefined,
    });
  }

  return { lignes, refusees, colonnesManquantes: [], entetes: utiles[iEntete] };
}

/** Lecture d'un CSV : on choisit le séparateur puis on délègue. */
export function lirePlanningCsv(texte: string): Lecture {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lignes.length === 0) return { lignes: [], refusees: [], colonnesManquantes: ['personne', 'date'] };
  // Le point-virgule domine en France : Excel FR l'écrit par défaut.
  const pv = (lignes[0].match(/;/g) ?? []).length;
  const vg = (lignes[0].match(/,/g) ?? []).length;
  const tab = (lignes[0].match(/\t/g) ?? []).length;
  const sep = tab > pv && tab > vg ? '\t' : pv >= vg ? ';' : ',';
  return lireMatrice(lignes.map((l) => decouper(l, sep)));
}

/** Agrège par personne : heures travaillées et jours d'absence. */
export function bilanParPersonne(lignes: LignePlanning[]): BilanPersonne[] {
  const carte = new Map<string, BilanPersonne>();
  for (const l of lignes) {
    const b = carte.get(l.personne) ?? {
      personne: l.personne,
      heuresTravaillees: 0,
      joursAbsence: 0,
      jours: 0,
    };
    if (l.estAbsence) b.joursAbsence += 1;
    else b.heuresTravaillees += l.heures;
    b.jours += 1;
    carte.set(l.personne, b);
  }
  return [...carte.values()].sort((a, b) => a.personne.localeCompare(b.personne, 'fr'));
}
