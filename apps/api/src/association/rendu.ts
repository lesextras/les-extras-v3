import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DocumentFabrique } from './fabrique';

/**
 * DEUX RENDUS D'UN MÊME DOCUMENT.
 *
 * PDF : ce qui va dans le classeur et dans un dossier de subvention.
 * Word : pour modifier une phrase avant de signer. Même contenu, même ordre.
 */

const MARINE = '#1D1B5C';
const GRIS = '#6B6A8A';
const LIGNE = '#D9D6EE';

/* -------------------------------------------------------------------- PDF */

export function rendrePdf(doc: DocumentFabrique): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 64, left: 60, right: 60 }, info: { Title: doc.titre } });
    const morceaux: Buffer[] = [];
    pdf.on('data', (c: Buffer) => morceaux.push(c));
    pdf.on('end', () => resolve(Buffer.concat(morceaux)));
    pdf.on('error', reject);

    const largeur = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;

    pdf.font('Helvetica-Bold').fontSize(18).fillColor(MARINE).text(doc.titre, { align: 'center' });
    if (doc.sousTitre) {
      pdf.moveDown(0.3).font('Helvetica').fontSize(11).fillColor(GRIS).text(doc.sousTitre, { align: 'center' });
    }
    pdf.moveDown(1);
    pdf.moveTo(pdf.page.margins.left, pdf.y).lineTo(pdf.page.margins.left + largeur, pdf.y).strokeColor(LIGNE).lineWidth(1).stroke();
    pdf.moveDown(1);

    const garderPlace = (h: number) => {
      if (pdf.y + h > pdf.page.height - pdf.page.margins.bottom) pdf.addPage();
    };

    for (const b of doc.blocs) {
      switch (b.type) {
        case 'titre':
          garderPlace(96);
          pdf.moveDown(0.6).font('Helvetica-Bold').fontSize(b.niveau === 1 ? 14 : 12).fillColor(MARINE).text(b.texte);
          pdf.moveDown(0.3);
          break;
        case 'para':
          garderPlace(30);
          pdf
            .font(b.gras ? 'Helvetica-Bold' : b.italique ? 'Helvetica-Oblique' : 'Helvetica')
            .fontSize(11)
            .fillColor(b.italique ? GRIS : '#1A1A1A')
            .text(b.texte, { align: b.centre ? 'center' : 'left', lineGap: 3 });
          pdf.moveDown(0.5);
          break;
        case 'liste':
          for (const item of b.items) {
            garderPlace(20);
            pdf.font('Helvetica').fontSize(11).fillColor('#1A1A1A').text(`•  ${item}`, { indent: 8, lineGap: 3 });
          }
          pdf.moveDown(0.5);
          break;
        case 'tableau': {
          const cols = b.entetes.length;
          const pourcents = b.largeurs && b.largeurs.length === cols ? b.largeurs : Array(cols).fill(100 / cols);
          const larg = pourcents.map((p) => (largeur * p) / 100);
          const ligne = (cellules: string[], gras: boolean, fond?: string) => {
            const hauteurs = cellules.map((c, i) => pdf.font(gras ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).heightOfString(c || ' ', { width: larg[i] - 12 }));
            const h = Math.max(...hauteurs) + 12;
            garderPlace(h);
            const y = pdf.y;
            let x = pdf.page.margins.left;
            if (fond) pdf.rect(x, y, largeur, h).fillColor(fond).fill();
            cellules.forEach((c, i) => {
              pdf
                .font(gras ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(10)
                .fillColor('#1A1A1A')
                .text(c || ' ', x + 6, y + 6, { width: larg[i] - 12, align: i === cols - 1 && cols > 1 && /€|^\d/.test(c) ? 'right' : 'left' });
              x += larg[i];
            });
            pdf.moveTo(pdf.page.margins.left, y + h).lineTo(pdf.page.margins.left + largeur, y + h).strokeColor(LIGNE).lineWidth(0.5).stroke();
            pdf.x = pdf.page.margins.left;
            pdf.y = y + h;
          };
          ligne(b.entetes, true, '#ECEBFC');
          if (b.lignes.length === 0) ligne(Array(cols).fill('—'), false);
          for (const l of b.lignes) ligne(l, false);
          if (b.total) ligne(b.total, true, '#F5F4FC');
          pdf.moveDown(0.8);
          break;
        }
        case 'signatures': {
          garderPlace(90);
          pdf.moveDown(0.8);
          if (b.lieu || b.date) {
            pdf.font('Helvetica').fontSize(11).fillColor('#1A1A1A').text(`Fait à ${b.lieu || '…'}, le ${b.date || '…'}`);
            pdf.moveDown(1.2);
          }
          const colW = largeur / Math.max(1, b.noms.length);
          const y = pdf.y;
          b.noms.forEach((nom, i) => {
            const x = pdf.page.margins.left + i * colW;
            pdf.font('Helvetica-Bold').fontSize(10).fillColor(MARINE).text(nom, x, y, { width: colW - 12 });
            pdf.font('Helvetica-Oblique').fontSize(9).fillColor(GRIS).text('Signature :', x, y + 16, { width: colW - 12 });
          });
          pdf.x = pdf.page.margins.left;
          pdf.y = y + 70;
          break;
        }
        case 'espace':
          pdf.moveDown(1);
          break;
      }
    }

    pdf.font('Helvetica').fontSize(8).fillColor(GRIS).text('Document préparé avec Piloter mon association (association.toulali.fr). À relire avant signature.', pdf.page.margins.left, pdf.page.height - 48, {
      width: largeur,
      align: 'center',
    });
    pdf.end();
  });
}

/* ------------------------------------------------------------------- DOCX */

export async function rendreDocx(doc: DocumentFabrique): Promise<Buffer> {
  const enfants: (Paragraph | Table)[] = [];
  const P = (texte: string, o: { gras?: boolean; italique?: boolean; centre?: boolean; taille?: number; couleur?: string; apres?: number } = {}) =>
    new Paragraph({
      alignment: o.centre ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: o.apres ?? 160, line: 300 },
      children: texte.split('\n').flatMap((l, i) => [
        ...(i > 0 ? [new TextRun({ break: 1 })] : []),
        new TextRun({ text: l, bold: o.gras, italics: o.italique, size: (o.taille ?? 11) * 2, color: o.couleur, font: 'Arial' }),
      ]),
    });

  enfants.push(P(doc.titre, { gras: true, centre: true, taille: 18, couleur: '1D1B5C', apres: 80 }));
  if (doc.sousTitre) enfants.push(P(doc.sousTitre, { centre: true, taille: 11, couleur: '6B6A8A', apres: 320 }));

  const bord = { style: BorderStyle.SINGLE, size: 4, color: 'D9D6EE' };
  for (const b of doc.blocs) {
    switch (b.type) {
      case 'titre':
        enfants.push(
          new Paragraph({
            heading: b.niveau === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 120 },
            children: [new TextRun({ text: b.texte, bold: true, size: (b.niveau === 1 ? 14 : 12) * 2, color: '1D1B5C', font: 'Arial' })],
          }),
        );
        break;
      case 'para':
        enfants.push(P(b.texte, { gras: b.gras, italique: b.italique, centre: b.centre, couleur: b.italique ? '6B6A8A' : undefined }));
        break;
      case 'liste':
        for (const item of b.items) {
          enfants.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: item, size: 22, font: 'Arial' })] }));
        }
        break;
      case 'tableau': {
        const cols = b.entetes.length;
        const pourcents = b.largeurs && b.largeurs.length === cols ? b.largeurs : Array(cols).fill(100 / cols);
        const cellule = (texte: string, gras: boolean, i: number, fond?: string) =>
          new TableCell({
            width: { size: pourcents[i], type: WidthType.PERCENTAGE },
            shading: fond ? { fill: fond } : undefined,
            borders: { top: bord, bottom: bord, left: bord, right: bord },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: i === cols - 1 && cols > 1 && /€|^\d/.test(texte) ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [new TextRun({ text: texte || ' ', bold: gras, size: 20, font: 'Arial' })],
              }),
            ],
          });
        const rangs = [
          new TableRow({ tableHeader: true, children: b.entetes.map((e, i) => cellule(e, true, i, 'ECEBFC')) }),
          ...(b.lignes.length ? b.lignes : [Array(cols).fill('—')]).map((l) => new TableRow({ children: l.map((c, i) => cellule(c, false, i)) })),
          ...(b.total ? [new TableRow({ children: b.total.map((c, i) => cellule(c, true, i, 'F5F4FC')) })] : []),
        ];
        enfants.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rangs }));
        enfants.push(P('', { apres: 120 }));
        break;
      }
      case 'signatures': {
        if (b.lieu || b.date) enfants.push(P(`Fait à ${b.lieu || '…'}, le ${b.date || '…'}`, { apres: 400 }));
        const cells = b.noms.map(
          (nom) =>
            new TableCell({
              borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
              width: { size: 100 / b.noms.length, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: nom, bold: true, size: 20, color: '1D1B5C', font: 'Arial' })] }),
                new Paragraph({ spacing: { after: 800 }, children: [new TextRun({ text: 'Signature :', italics: true, size: 18, color: '6B6A8A', font: 'Arial' })] }),
              ],
            }),
        );
        enfants.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: cells })] }));
        break;
      }
      case 'espace':
        enfants.push(P('', { apres: 200 }));
        break;
    }
  }
  enfants.push(P('Document préparé avec Piloter mon association (association.toulali.fr). À relire avant signature.', { centre: true, taille: 8, couleur: '6B6A8A' }));

  const d = new Document({
    creator: 'Piloter mon association',
    title: doc.titre,
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children: enfants }],
  });
  return Packer.toBuffer(d);
}
