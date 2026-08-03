import PDFDocument from 'pdfkit';

/**
 * BOÎTE À OUTILS TYPOGRAPHIQUE.
 *
 * Le produit vendait de la conformité sans jamais produire de pièce. Or ce
 * qu'un directeur montre à une inspection, ce n'est pas un écran : c'est un
 * papier. Ce module fabrique ces papiers côté serveur — donc reproductibles,
 * archivables, et identiques quel que soit le navigateur.
 *
 * pdfkit plutôt qu'un navigateur sans interface : pas de Chromium à embarquer
 * dans l'image Docker, pas de mémoire qui s'envole sous charge, un rendu qui
 * ne bouge pas avec les versions. Les polices standard couvrent le français,
 * accents, œ et signe euro compris.
 */

export const MARGE = 56;
export const LARGEUR_UTILE = 595.28 - MARGE * 2; // A4 portrait

const GRIS = '#5b6470';
const GRIS_CLAIR = '#9aa3ad';
const TRAIT = '#d8dde3';
const ENCRE = '#1b2430';

export type Doc = InstanceType<typeof PDFDocument>;

/** Ouvre un document et renvoie de quoi le finir en Buffer. */
export function nouveauDocument(titre: string, auteur: string) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGE, bottom: MARGE, left: MARGE, right: MARGE },
    info: { Title: titre, Author: auteur, Creator: 'Les Extras' },
  });
  const morceaux: Buffer[] = [];
  doc.on('data', (m: Buffer) => morceaux.push(m));
  const termine = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);
  });
  return { doc, termine };
}

/** En-tête : qui édite le document, et de quoi il s'agit. */
export function enTete(doc: Doc, titre: string, sousTitre?: string) {
  doc.fillColor(ENCRE).font('Helvetica-Bold').fontSize(18).text(titre, { align: 'left' });
  if (sousTitre) {
    doc.moveDown(0.2);
    doc.fillColor(GRIS).font('Helvetica').fontSize(10).text(sousTitre);
  }
  doc.moveDown(0.8);
  filet(doc);
  doc.moveDown(0.8);
}

/** Un filet horizontal discret, pour séparer sans encombrer. */
export function filet(doc: Doc) {
  const y = doc.y;
  doc
    .strokeColor(TRAIT)
    .lineWidth(0.75)
    .moveTo(MARGE, y)
    .lineTo(MARGE + LARGEUR_UTILE, y)
    .stroke();
}

export function titreSection(doc: Doc, texte: string) {
  garderPlace(doc, 60);
  doc.moveDown(0.6);
  doc
    .fillColor(ENCRE)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(texte.toUpperCase(), { characterSpacing: 0.6 });
  doc.moveDown(0.35);
}

export function paragraphe(doc: Doc, texte: string, options: { gris?: boolean } = {}) {
  doc
    .fillColor(options.gris ? GRIS : ENCRE)
    .font('Helvetica')
    .fontSize(10)
    .text(texte, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.4);
}

/**
 * Une ligne « libellé : valeur ».
 * Le libellé est fixé à 38 % de la largeur : les valeurs s'alignent, et l'œil
 * descend la colonne sans relire chaque intitulé.
 */
export function ligne(doc: Doc, libelle: string, valeur: string) {
  garderPlace(doc, 26);
  const largeurLibelle = LARGEUR_UTILE * 0.38;
  const y = doc.y;
  doc
    .fillColor(GRIS)
    .font('Helvetica')
    .fontSize(9.5)
    .text(libelle, MARGE, y, { width: largeurLibelle - 10 });
  const basLibelle = doc.y;
  doc
    .fillColor(ENCRE)
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .text(valeur || '—', MARGE + largeurLibelle, y, {
      width: LARGEUR_UTILE - largeurLibelle,
    });
  doc.y = Math.max(basLibelle, doc.y) + 4;
  doc.x = MARGE;
}

/** Encadré d'avertissement — ce que le lecteur ne doit pas manquer. */
export function encadre(doc: Doc, texte: string) {
  garderPlace(doc, 80);
  const debut = doc.y;
  const hauteur =
    doc.heightOfString(texte, { width: LARGEUR_UTILE - 24, lineGap: 2 }) + 20;
  doc
    .roundedRect(MARGE, debut, LARGEUR_UTILE, hauteur, 4)
    .fillAndStroke('#fbf7ef', TRAIT);
  doc
    .fillColor(ENCRE)
    .font('Helvetica')
    .fontSize(9)
    .text(texte, MARGE + 12, debut + 10, { width: LARGEUR_UTILE - 24, lineGap: 2 });
  doc.y = debut + hauteur + 10;
  doc.x = MARGE;
}

/** Un tableau simple : en-têtes, lignes, colonnes proportionnelles. */
export function tableau(
  doc: Doc,
  colonnes: { titre: string; largeur: number; alignement?: 'left' | 'right' }[],
  lignes: string[][],
) {
  const total = colonnes.reduce((s, c) => s + c.largeur, 0);
  const largeurs = colonnes.map((c) => (c.largeur / total) * LARGEUR_UTILE);

  garderPlace(doc, 50);
  let y = doc.y;
  doc.fillColor(GRIS).font('Helvetica-Bold').fontSize(8.5);
  colonnes.forEach((c, i) => {
    const x = MARGE + largeurs.slice(0, i).reduce((s, l) => s + l, 0);
    doc.text(c.titre.toUpperCase(), x, y, {
      width: largeurs[i] - 8,
      align: c.alignement ?? 'left',
    });
  });
  doc.y = y + 14;
  filet(doc);
  doc.y += 6;

  doc.font('Helvetica').fontSize(9.5);
  for (const l of lignes) {
    garderPlace(doc, 30);
    y = doc.y;
    let bas = y;
    l.forEach((cellule, i) => {
      const x = MARGE + largeurs.slice(0, i).reduce((s, w) => s + w, 0);
      doc.fillColor(ENCRE).text(cellule, x, y, {
        width: largeurs[i] - 8,
        align: colonnes[i]?.alignement ?? 'left',
      });
      bas = Math.max(bas, doc.y);
    });
    doc.y = bas + 6;
    doc.x = MARGE;
  }
}

/** Deux cases de signature côte à côte. */
export function signatures(doc: Doc, gauche: string, droite: string) {
  garderPlace(doc, 120);
  doc.moveDown(1);
  const y = doc.y;
  const largeur = (LARGEUR_UTILE - 24) / 2;
  [gauche, droite].forEach((titre, i) => {
    const x = MARGE + i * (largeur + 24);
    doc.fillColor(GRIS).font('Helvetica').fontSize(9).text(titre, x, y, { width: largeur });
    doc
      .fillColor(GRIS_CLAIR)
      .fontSize(8)
      .text('Date, signature, et mention « lu et approuvé »', x, y + 14, { width: largeur });
    doc
      .strokeColor(TRAIT)
      .lineWidth(0.75)
      .roundedRect(x, y + 30, largeur, 70, 4)
      .stroke();
  });
  doc.y = y + 110;
  doc.x = MARGE;
}

/** Pied de page sur toutes les pages : origine du document et pagination. */
export function pied(doc: Doc, mention: string) {
  const plage = doc.bufferedPageRange();
  for (let i = plage.start; i < plage.start + plage.count; i++) {
    doc.switchToPage(i);
    const y = 842 - MARGE + 16;
    doc
      .fillColor(GRIS_CLAIR)
      .font('Helvetica')
      .fontSize(7.5)
      .text(mention, MARGE, y, { width: LARGEUR_UTILE * 0.75, lineBreak: false })
      .text(`Page ${i - plage.start + 1} / ${plage.count}`, MARGE, y, {
        width: LARGEUR_UTILE,
        align: 'right',
        lineBreak: false,
      });
  }
}

/** Passe à la page suivante s'il ne reste pas la place demandée. */
export function garderPlace(doc: Doc, hauteur: number) {
  if (doc.y + hauteur > 842 - MARGE - 24) doc.addPage();
}

// --- Formatage français ----------------------------------------------------

/**
 * Les espaces insécables typographiques françaises — l'espace fine U+202F que
 * `toLocaleString('fr-FR')` place entre les milliers, et l'insécable ordinaire
 * U+00A0 — n'existent pas dans l'encodage WinAnsi des polices standard du PDF.
 * Laissées telles quelles, elles ressortent en glyphe parasite : « 1/490,00 € »
 * au lieu de « 1 490,00 € ». Sur une facture, un montant illisible n'est pas
 * un détail d'esthétique.
 */
export function sansEspaceFine(s: string): string {
  return s.replace(/[   ]/g, ' ');
}

export function euros(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  const nombre = n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sansEspaceFine(nombre)} €`;
}

export function dateFr(v: Date | string | null | undefined): string {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function nomComplet(p?: { firstName?: string | null; lastName?: string | null } | null) {
  return [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
}
