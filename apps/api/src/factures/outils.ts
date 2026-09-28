import { createHash } from 'node:crypto';

/** Un nom de fournisseur réduit à ce qui l'identifie : minuscules, sans accent, sans forme juridique. */
export function normaliserNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.(?=[a-z]\b|[a-z]\.)/g, '')
    .replace(/\b(sas|sasu|sarl|eurl|sa|sci|snc|scop|association|assoc|ets|sté|ste|societe|société|company|co|inc|ltd|gmbh)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Un IBAN nettoyé, ou null s'il n'a pas la forme d'un IBAN. */
export function nettoyerIban(brut: string | null | undefined): string | null {
  if (!brut) return null;
  const s = brut.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return null;
  // Contrôle mod 97 : on écarte les IBAN mal lus par le moteur.
  const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let reste = 0;
  for (const ch of r) reste = (reste * 10 + Number(ch)) % 97;
  return reste === 1 ? s : null;
}

/** L'IBAN n'est jamais stocké : une empreinte pour comparer, quatre caractères pour reconnaître. */
export function empreinteIban(iban: string) {
  return { ibanEmpreinte: createHash('sha256').update(iban).digest('hex'), ibanFin: iban.slice(-4) };
}

export function nettoyerSiret(brut: string | null | undefined): string | null {
  if (!brut) return null;
  const s = brut.replace(/\D/g, '');
  return /^\d{14}$/.test(s) ? s : null;
}

/** Empreinte d'une ligne de relevé : un relevé déposé deux fois ne double pas ses lignes. */
export function empreinteOperation(accountId: string, date: string, libelle: string, montant: number) {
  return createHash('sha256').update(`${accountId}|${date}|${normaliserNom(libelle)}|${montant.toFixed(2)}`).digest('hex').slice(0, 32);
}

export interface LigneReleve {
  date: string; // AAAA-MM-JJ
  libelle: string;
  montant: number; // signé : négatif = sortie
}

/**
 * LIRE UN RELEVÉ EN CSV sans connaître la banque : on repère la colonne date,
 * la colonne libellé et les colonnes montant (une signée, ou débit + crédit).
 * Les formats français (12/03/2026, 1 234,56) sont les premiers servis.
 */
export function lireCsvReleve(texte: string): LigneReleve[] {
  const lignes = texte.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lignes.length < 2) return [];
  const sep = [';', ',', '\t', '|'].map((s) => ({ s, n: (lignes[0].match(new RegExp(`\\${s}`, 'g')) ?? []).length })).sort((a, b) => b.n - a.n)[0].s;
  const decouper = (l: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        if (q && l[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === sep && !q) {
        out.push(cur);
        cur = '';
      } else cur += c;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };
  const nombre = (v: string): number | null => {
    const t = v.replace(/\s/g, '').replace(/€/g, '');
    if (!t || !/\d/.test(t)) return null;
    const norm = t.includes(',') && t.includes('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.');
    const n = Number(norm.replace(/[^0-9.+-]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const date = (v: string): string | null => {
    let m = v.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = v.match(/^(\d{2})[/.-](\d{2})[/.-](\d{2})$/);
    if (m) return `20${m[3]}-${m[2]}-${m[1]}`;
    return null;
  };
  const entete = decouper(lignes[0]).map((h) => normaliserNom(h));
  const corps = lignes.slice(1).map(decouper).filter((c) => c.length >= 2);
  if (!corps.length) return [];
  const idx = (motifs: RegExp) => entete.findIndex((h) => motifs.test(h));
  let iDate = idx(/^date( d ?operation| de valeur|$)|^date/);
  let iLib = idx(/libelle|label|description|detail|objet|nature/);
  let iMontant = idx(/^montant$|^amount$|^montant \(eur\)/);
  let iDebit = idx(/debit/);
  let iCredit = idx(/credit/);
  // Sans en-tête parlant : la première colonne qui ressemble à une date, la plus longue en texte, la dernière en nombre.
  if (iDate < 0) iDate = corps[0].findIndex((v) => date(v));
  if (iLib < 0) {
    const longueurs = corps[0].map((v, i) => (i === iDate || nombre(v) !== null ? -1 : v.length));
    iLib = longueurs.indexOf(Math.max(...longueurs));
  }
  if (iMontant < 0 && (iDebit < 0 || iCredit < 0)) {
    for (let i = corps[0].length - 1; i >= 0; i--) if (i !== iDate && i !== iLib && nombre(corps[0][i]) !== null) { iMontant = i; break; }
  }
  const out: LigneReleve[] = [];
  for (const c of corps) {
    const d = iDate >= 0 ? date(c[iDate] ?? '') : null;
    if (!d) continue;
    let m: number | null = null;
    if (iDebit >= 0 && iCredit >= 0) {
      const de = nombre(c[iDebit] ?? '');
      const cr = nombre(c[iCredit] ?? '');
      m = (cr ?? 0) - Math.abs(de ?? 0);
      if (de === null && cr === null) m = null;
    } else if (iMontant >= 0) m = nombre(c[iMontant] ?? '');
    if (m === null || m === 0) continue;
    out.push({ date: d, libelle: (c[iLib] ?? '').replace(/\s+/g, ' ').slice(0, 200), montant: Math.round(m * 100) / 100 });
  }
  return out;
}

/** Les mots-clés qui classent une ligne de relevé dans un poste, sans moteur. */
const MOTS_POSTES: [RegExp, string][] = [
  [/loyer|bail|charges locat|syndic|edf|engie|electricit|gaz|eau |veolia|suez|total ?energ/i, 'Loyer et charges'],
  [/assur|maif|macif|axa|allianz|groupama|matmut|hiscox|smacl/i, 'Assurance'],
  [/amazon|bureau vallee|leroy|castorama|ikea|fnac|darty|boulanger|cdiscount|leclerc|carrefour|auchan|lidl|action /i, 'Matériel et fournitures'],
  [/free |orange|sfr|bouygues|ovh|hostinger|google|microsoft|adobe|canva|notion|zoom|slack|apple\.com|abonnement|stripe|teachizy|brevo|heygen/i, 'Logiciels et abonnements'],
  [/sncf|ratp|navigo|uber|bolt|essence|carburant|peage|autoroute|parking|blablacar|air ?france/i, 'Déplacements'],
  [/restaur|traiteur|boulang|picard|metro |promocash|deliveroo|uber ?eats|cafe |brasserie/i, 'Alimentation et réception'],
  [/frais|commission|cotisation carte|agios|interets debiteurs|tenue de compte/i, 'Frais bancaires'],
  [/imprim|impression|affiche|flyer|pub |ads|meta ?platforms|facebook|tiktok|linkedin|communication/i, 'Communication'],
  [/formation|formateur|urssaf|salaire|paie|virement sepa emis.*(formateur|intervenant)/i, 'Formation et formateurs'],
  [/prestation|honoraire|consult|freelance|malt|indep/i, 'Prestations et sous-traitance'],
];

export function devinerPoste(libelle: string): string | null {
  for (const [re, poste] of MOTS_POSTES) if (re.test(libelle)) return poste;
  return null;
}

/** Une recette ou une dépense, d'après le signe et le libellé. */
export function sensOperation(montant: number, libelle: string): 'DEPENSE' | 'RECETTE' {
  if (montant > 0) return 'RECETTE';
  return 'DEPENSE';
}

/** Une recette de relevé classée : subvention, cotisation, don, vente, remboursement, autre. */
export function natureRecette(libelle: string): string {
  const l = libelle.toLowerCase();
  if (/subvention|caf |cnaf|mairie|ville de|region|departement|conseil dep|fdva|drajes|ddcs|agence nat|etat |tresor public|dgfip/.test(l)) return 'Subvention';
  if (/cotis|adhesion|adherent/.test(l)) return 'Cotisations';
  if (/don |dons|helloasso|lilo|mecenat/.test(l)) return 'Dons';
  if (/stripe|paypal|sumup|vente|teachizy|formation|inscription|carte bancaire|cb /.test(l)) return 'Ventes et prestations';
  if (/rembours|avoir|annulation/.test(l)) return 'Remboursements';
  return 'Autres recettes';
}

/**
 * RAPPROCHER une ligne de relevé et une facture : même montant (au centime),
 * date de l'opération dans les 60 jours après la facture (ou 5 jours avant),
 * et un mot du fournisseur dans le libellé si possible. Score de 0 à 3.
 */
export function scoreRapprochement(
  op: { date: Date; libelle: string; montant: number },
  f: { fournisseur: string; montantTTC: number; dateFacture: Date | null; dateEcheance: Date | null },
): number {
  if (Math.abs(Math.abs(op.montant) - f.montantTTC) > 0.005) return 0;
  let score = 1;
  const ref = f.dateEcheance ?? f.dateFacture;
  if (ref) {
    const jours = (op.date.getTime() - ref.getTime()) / 86_400_000;
    if (jours >= -5 && jours <= 60) score += 1;
    else if (jours < -30 || jours > 120) return 0;
  }
  const mots = normaliserNom(f.fournisseur).split(' ').filter((m) => m.length >= 4);
  const lib = normaliserNom(op.libelle);
  if (mots.some((m) => lib.includes(m))) score += 1;
  return score;
}
