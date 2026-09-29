/**
 * PRÉVU / RÉALISÉ D'UNE SUBVENTION (29/09/2026, demande de Siham).
 *
 * « En téléchargeant le dossier validé de subvention, il faut pouvoir analyser
 * le prévisionnel et le réalisé, pour le budget mais aussi pour les objectifs
 * et le nombre de public visé. »
 *
 * Le dossier déposé au financeur (Cerfa 12156 ou le dossier maison d'une
 * collectivité, une fois accordé) porte trois engagements : un budget
 * prévisionnel par rubrique du plan comptable associatif, des objectifs avec
 * leurs indicateurs, et un public visé chiffré. Le compte rendu (Cerfa 15059)
 * demande exactement les trois en face du réalisé, avec l'explication des
 * écarts. Ce module est la partie PURE : la consigne du moteur, la lecture de sa
 * réponse, et la comparaison. Rien n'y touche la base.
 *
 * ⚠ LE MOTEUR N'INVENTE RIEN : un montant, une cible ou un nombre absents du
 * dossier restent nuls, et la personne les complète à la main. Un prévisionnel
 * inventé ferait mentir le compte rendu remis au financeur.
 *
 * ⚠ LE SEUIL D'ÉCART EST INDICATIF (15 % par défaut, réglable) : le Cerfa 15059
 * demande d'expliquer les écarts « significatifs » sans fixer de taux ; c'est la
 * convention de chaque financeur qui en fixe un, quand elle en fixe un.
 */

export interface LigneBudget {
  /** Numéro de compte tel qu'écrit dans le dossier (« 60 », « 606 », « 64 »). */
  code: string;
  libelle: string;
  prevu: number | null;
  /** Ce qui n'est pas dans Mes factures (salaires, contributions en nature…), saisi à la main. */
  realiseManuel?: number | null;
  commentaire?: string | null;
}

export interface Objectif {
  intitule: string;
  indicateur: string | null;
  cible: number | null;
  unite: string | null;
  realise?: number | null;
  commentaire?: string | null;
}

export interface Public {
  categorie: string;
  prevu: number | null;
  realise?: number | null;
  commentaire?: string | null;
}

export interface Previsionnel {
  intitule: string | null;
  periodeDebut: string | null;
  periodeFin: string | null;
  charges: LigneBudget[];
  produits: LigneBudget[];
  objectifs: Objectif[];
  publics: Public[];
  remarque: string | null;
}

export const CONSIGNE_PREVISIONNEL = `Tu lis le dossier de demande de subvention d'une association française, tel qu'il a été déposé et accordé (souvent le Cerfa 12156 « Demande de subvention », ou le dossier d'une collectivité, de la CAF, de l'État, d'une fondation).
Tu en extrais TROIS choses, et seulement ce qui est écrit dans le document :
1. Le BUDGET PRÉVISIONNEL DE L'ACTION (ou du projet) : chaque ligne de CHARGES (comptes 60 à 68, et 86 pour les contributions volontaires en nature) et de PRODUITS (comptes 70 à 75, et 87), avec son numéro de compte tel qu'il est écrit et son montant en euros. Si le dossier ne donne qu'un budget de fonctionnement de l'association, prends celui-là et dis-le dans "remarque". N'ajoute JAMAIS une ligne ou un montant absent.
2. Les OBJECTIFS de l'action : pour chacun, l'intitulé, l'indicateur d'évaluation s'il est écrit, la valeur cible chiffrée s'il y en a une (sinon null) et son unité (ateliers, séances, participants, heures…).
3. Le PUBLIC VISÉ : chaque catégorie (âge, situation, quartier) avec le nombre de personnes prévu s'il est écrit (sinon null).
Réponds UNIQUEMENT par un objet JSON, sans texte autour :
{"intitule": "titre de l'action ou null", "periodeDebut": "AAAA-MM-JJ ou null", "periodeFin": "AAAA-MM-JJ ou null",
 "charges": [{"code": "60", "libelle": "Achats", "montant": 1200}],
 "produits": [{"code": "74", "libelle": "Subvention CAF", "montant": 5000}],
 "objectifs": [{"intitule": "...", "indicateur": "... ou null", "cible": 12, "unite": "ateliers ou null"}],
 "publics": [{"categorie": "...", "nombre": 40}],
 "remarque": "ce qui manque ou est ambigu, ou null"}
Les montants sont des nombres (1200.5), sans espace ni symbole. N'écris pas les lignes de total.`;

/** « 1 200,50 € » → 1200.5 ; tout ce qui n'est pas un nombre → null. */
export function nombre(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\s  €]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Math.round(Number(t) * 100) / 100;
}

function texte(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

/** La date ISO si elle est lisible, sinon null. */
function dateIso(v: unknown): string | null {
  const t = texte(v, 10);
  return t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

/** Le numéro de compte, chiffres seulement (« 6064 », « 74 ») ; null s'il n'y en a pas. */
export function codeCompte(v: unknown): string | null {
  const t = typeof v === 'number' ? String(v) : typeof v === 'string' ? v : '';
  const m = t.match(/\d{2,6}/);
  return m ? m[0] : null;
}

/** Une ligne de total recopiée par le moteur ne doit pas doubler le budget. */
function estUnTotal(libelle: string) {
  return /^\s*(sous[-\s]?)?total/i.test(libelle);
}

function lignes(v: unknown, sens: 'charges' | 'produits'): LigneBudget[] {
  if (!Array.isArray(v)) return [];
  const bornes = sens === 'charges' ? /^(6[0-8]|86)/ : /^(7[0-5]|87)/;
  const out: LigneBudget[] = [];
  for (const l of v.slice(0, 80)) {
    if (!l || typeof l !== 'object') continue;
    const o = l as Record<string, unknown>;
    const libelle = texte(o.libelle, 160) ?? '';
    if (estUnTotal(libelle)) continue;
    const code = codeCompte(o.code) ?? codeCompte(libelle);
    if (!code || !bornes.test(code)) continue;
    out.push({ code, libelle: libelle || code, prevu: nombre(o.montant ?? o.prevu) });
  }
  return out;
}

/** Lit la réponse du moteur. Un JSON illisible donne un prévisionnel vide qui le dit. */
export function parserPrevisionnel(brut: string): Previsionnel {
  const vide: Previsionnel = { intitule: null, periodeDebut: null, periodeFin: null, charges: [], produits: [], objectifs: [], publics: [], remarque: null };
  const debut = brut.indexOf('{');
  const fin = brut.lastIndexOf('}');
  if (debut < 0 || fin <= debut) return { ...vide, remarque: 'Le document n’a pas pu être lu : saisissez le prévisionnel à la main.' };
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(brut.slice(debut, fin + 1)) as Record<string, unknown>;
  } catch {
    return { ...vide, remarque: 'Le document n’a pas pu être lu : saisissez le prévisionnel à la main.' };
  }
  const objectifs: Objectif[] = Array.isArray(o.objectifs)
    ? (o.objectifs as unknown[])
        .slice(0, 40)
        .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
        .filter((x) => texte(x.intitule, 300))
        .map((x) => ({ intitule: texte(x.intitule, 300)!, indicateur: texte(x.indicateur, 300), cible: nombre(x.cible), unite: texte(x.unite, 40) }))
    : [];
  const publics: Public[] = Array.isArray(o.publics)
    ? (o.publics as unknown[])
        .slice(0, 30)
        .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
        .filter((x) => texte(x.categorie, 200))
        .map((x) => ({ categorie: texte(x.categorie, 200)!, prevu: nombre(x.nombre ?? x.prevu) }))
    : [];
  return {
    intitule: texte(o.intitule, 200),
    periodeDebut: dateIso(o.periodeDebut),
    periodeFin: dateIso(o.periodeFin),
    charges: lignes(o.charges, 'charges'),
    produits: lignes(o.produits, 'produits'),
    objectifs,
    publics,
    remarque: texte(o.remarque, 500),
  };
}

/** Les rubriques à deux chiffres, celles du compte rendu. */
export const RUBRIQUES: Record<string, string> = {
  '60': 'Achats',
  '61': 'Services extérieurs',
  '62': 'Autres services extérieurs',
  '63': 'Impôts et taxes',
  '64': 'Charges de personnel',
  '65': 'Autres charges de gestion courante',
  '66': 'Charges financières',
  '67': 'Charges exceptionnelles',
  '68': 'Dotations aux amortissements',
  '86': 'Emplois des contributions volontaires en nature',
  '70': 'Ventes de produits et prestations',
  '71': 'Production stockée',
  '72': 'Production immobilisée',
  '73': 'Dotations et produits de tarification',
  '74': 'Subventions d’exploitation',
  '75': 'Autres produits de gestion courante',
  '87': 'Contributions volontaires en nature',
};

export interface LigneComparee {
  code: string;
  libelle: string;
  prevu: number;
  /** Ce que Mes factures a relevé (factures, notes de frais, relevé) pour cette rubrique. */
  realiseCalcule: number;
  realiseManuel: number;
  realise: number;
  ecart: number;
  /** Écart en % du prévu ; null si rien n'était prévu. */
  ecartPct: number | null;
  aExpliquer: boolean;
  commentaire: string | null;
  /** Vrai quand la rubrique a été dépensée sans avoir été prévue. */
  nonPrevue: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compare un côté du budget (charges ou produits) au réalisé.
 *
 * Le prévu est détaillé (« 606 », « 6064 ») ou à deux chiffres ; le réalisé que
 * Mes factures connaît est par rubrique à deux chiffres. On compare donc À DEUX
 * CHIFFRES : le détail du dossier est regroupé, sinon un « 606 Fournitures »
 * prévu ne trouverait jamais son réalisé. Le réalisé saisi à la main s'ajoute.
 */
export function comparer(lignesPrevues: LigneBudget[], realiseParRubrique: Record<string, number>, seuilPct: number): LigneComparee[] {
  const parRubrique = new Map<string, { prevu: number; manuel: number; libelles: string[]; commentaires: string[] }>();
  for (const l of lignesPrevues) {
    const r = l.code.slice(0, 2);
    const e = parRubrique.get(r) ?? { prevu: 0, manuel: 0, libelles: [], commentaires: [] };
    e.prevu += l.prevu ?? 0;
    e.manuel += l.realiseManuel ?? 0;
    if (l.libelle && !e.libelles.includes(l.libelle)) e.libelles.push(l.libelle);
    if (l.commentaire) e.commentaires.push(l.commentaire);
    parRubrique.set(r, e);
  }
  for (const r of Object.keys(realiseParRubrique)) {
    if (!parRubrique.has(r) && realiseParRubrique[r]) parRubrique.set(r, { prevu: 0, manuel: 0, libelles: [], commentaires: [] });
  }
  return [...parRubrique.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, e]) => {
      const realiseCalcule = r2(realiseParRubrique[code] ?? 0);
      const realise = r2(realiseCalcule + e.manuel);
      const prevu = r2(e.prevu);
      const ecart = r2(realise - prevu);
      const ecartPct = prevu > 0 ? Math.round((ecart / prevu) * 1000) / 10 : null;
      const nonPrevue = prevu === 0 && realise > 0;
      return {
        code,
        libelle: RUBRIQUES[code] ?? (e.libelles[0] || code),
        prevu,
        realiseCalcule,
        realiseManuel: r2(e.manuel),
        realise,
        ecart,
        ecartPct,
        aExpliquer: nonPrevue || (ecartPct !== null && Math.abs(ecartPct) > seuilPct),
        commentaire: e.commentaires.join(' ') || null,
        nonPrevue,
      };
    });
}

/** Taux d'atteinte d'une cible chiffrée, en % ; null si la cible ou le réalisé manque. */
export function tauxAtteinte(cible: number | null | undefined, realise: number | null | undefined): number | null {
  if (cible === null || cible === undefined || cible <= 0) return null;
  if (realise === null || realise === undefined) return null;
  return Math.round((realise / cible) * 100);
}

/** Le code à deux chiffres d'une recette du relevé, d'après sa nature. */
export function rubriqueRecette(nature: string | null | undefined): string {
  const n = (nature ?? '').toLowerCase();
  if (n.includes('subvention')) return '74';
  if (n.includes('vente') || n.includes('prestation') || n.includes('billet')) return '70';
  return '75';
}
