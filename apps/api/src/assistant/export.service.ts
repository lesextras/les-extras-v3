import { Injectable } from '@nestjs/common';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import PDFDocument from 'pdfkit';

/**
 * EXPORT DES ÉCRITS — Word et PDF.
 *
 * Le geste qui manquait. Jusqu'ici, LEX rendait un texte à l'écran et le seul
 * moyen d'en faire quelque chose était « Copier ». Or un écrit professionnel
 * ne finit pas dans un presse-papiers : il finit dans un dossier, sur le
 * papier à en-tête de la maison, signé. Tant qu'on ne rend pas un fichier, on
 * demande au professionnel de refaire à la main la moitié du travail.
 *
 * Word est le format qui compte : c'est là qu'il relira, corrigera et
 * appliquera l'en-tête de son établissement. Le PDF sert au courrier prêt à
 * envoyer. Les deux partent du même texte, produit en markdown par le moteur.
 */

/** Un bloc reconnu dans le markdown produit par le moteur. */
type Bloc =
  | { type: 'titre'; niveau: 1 | 2 | 3; texte: string }
  | { type: 'puce'; texte: string }
  | { type: 'numero'; texte: string; rang: string }
  | { type: 'trait' }
  | { type: 'paragraphe'; texte: string };

/** Un fragment de texte, avec sa mise en forme. */
interface Fragment {
  texte: string;
  gras: boolean;
  italique: boolean;
}

@Injectable()
export class ExportService {
  /**
   * Analyse le markdown rendu par le moteur. Volontairement minimal : le
   * moteur ne produit que des titres, des puces, du gras et des paragraphes,
   * et embarquer un analyseur markdown complet pour cinq règles serait payer
   * cher une généralité dont on n'a pas l'usage.
   */
  private decouper(contenu: string): Bloc[] {
    const blocs: Bloc[] = [];
    for (const ligneBrute of contenu.replace(/\r\n?/g, '\n').split('\n')) {
      const ligne = ligneBrute.trim();
      if (!ligne) continue;
      // Le coupon-réponse des courriers est séparé par une ligne de tirets :
      // c'est un vrai élément du document, pas une décoration.
      if (/^([-*_—]\s?){3,}$/.test(ligne)) {
        blocs.push({ type: 'trait' });
        continue;
      }
      const titre = /^(#{1,3})\s+(.*)$/.exec(ligne);
      if (titre) {
        blocs.push({
          type: 'titre',
          niveau: titre[1].length as 1 | 2 | 3,
          texte: titre[2].trim(),
        });
        continue;
      }
      const puce = /^[-*•]\s+(.*)$/.exec(ligne);
      if (puce) {
        blocs.push({ type: 'puce', texte: puce[1].trim() });
        continue;
      }
      const numero = /^(\d+)[.)]\s+(.*)$/.exec(ligne);
      if (numero) {
        blocs.push({ type: 'numero', texte: numero[2].trim(), rang: numero[1] });
        continue;
      }
      blocs.push({ type: 'paragraphe', texte: ligne });
    }
    return blocs;
  }

  /**
   * Sépare le gras `**…**` et l'italique `*…*` du reste, sans toucher au
   * contenu. Le gras est cherché en premier, sinon `**` serait lu comme deux
   * italiques vides — et les astérisques finissaient imprimées dans le
   * document, ce qu'un professionnel ne peut évidemment pas envoyer en l'état.
   */
  private fragments(texte: string): Fragment[] {
    const sortie: Fragment[] = [];
    const motif = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let curseur = 0;
    let m: RegExpExecArray | null;
    while ((m = motif.exec(texte)) !== null) {
      if (m.index > curseur) {
        sortie.push({ texte: texte.slice(curseur, m.index), gras: false, italique: false });
      }
      sortie.push({
        texte: m[1] ?? m[2],
        gras: m[1] !== undefined,
        italique: m[1] === undefined,
      });
      curseur = m.index + m[0].length;
    }
    if (curseur < texte.length) {
      sortie.push({ texte: texte.slice(curseur), gras: false, italique: false });
    }
    return sortie.length ? sortie : [{ texte, gras: false, italique: false }];
  }

  // ── Word ─────────────────────────────────────────────────────────────────

  /**
   * Document Word. Sobre à dessein : pas de couleurs, pas de logo. Le
   * professionnel appliquera l'en-tête de son établissement, et un document
   * qui arrive déjà habillé aux couleurs d'un prestataire est un document
   * qu'il faut déshabiller.
   */
  async docx(titre: string, contenu: string): Promise<Buffer> {
    const enfants: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 },
        children: [new TextRun({ text: titre, bold: true, size: 32 })],
      }),
    ];

    for (const bloc of this.decouper(contenu)) {
      switch (bloc.type) {
        case 'titre':
          enfants.push(
            new Paragraph({
              heading:
                bloc.niveau === 1
                  ? HeadingLevel.HEADING_1
                  : bloc.niveau === 2
                    ? HeadingLevel.HEADING_2
                    : HeadingLevel.HEADING_3,
              spacing: { before: 240, after: 120 },
              children: this.fragments(bloc.texte).map(
                (f) => new TextRun({ text: f.texte, bold: true, italics: f.italique }),
              ),
            }),
          );
          break;
        case 'puce':
          enfants.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 60 },
              children: this.fragments(bloc.texte).map(
                (f) => new TextRun({ text: f.texte, bold: f.gras, italics: f.italique }),
              ),
            }),
          );
          break;
        case 'numero':
          enfants.push(
            new Paragraph({
              numbering: { reference: 'lex-numerotation', level: 0 },
              spacing: { after: 60 },
              children: this.fragments(bloc.texte).map(
                (f) => new TextRun({ text: f.texte, bold: f.gras, italics: f.italique }),
              ),
            }),
          );
          break;
        case 'trait':
          enfants.push(
            new Paragraph({
              spacing: { before: 240, after: 240 },
              border: { bottom: { style: 'dashed', size: 6, space: 1, color: '999999' } },
              children: [],
            }),
          );
          break;
        default:
          enfants.push(
            new Paragraph({
              spacing: { after: 140 },
              alignment: AlignmentType.JUSTIFIED,
              children: this.fragments(bloc.texte).map(
                (f) => new TextRun({ text: f.texte, bold: f.gras, italics: f.italique }),
              ),
            }),
          );
      }
    }

    const doc = new Document({
      creator: 'LEX — Les Extras',
      title: titre,
      description: "Brouillon d'écrit professionnel, à relire et valider par son auteur.",
      numbering: {
        config: [
          {
            reference: 'lex-numerotation',
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: '%1.',
                alignment: AlignmentType.START,
              },
            ],
          },
        ],
      },
      styles: {
        default: {
          document: { run: { font: 'Calibri', size: 22, color: '1A1A1A' } },
          // Le bleu par défaut d'Office n'a rien à faire sur un écrit qui
          // partira sur le papier à en-tête de l'établissement.
          heading1: { run: { color: '1A1A1A', size: 30 }, paragraph: { spacing: { before: 260, after: 130 } } },
          heading2: { run: { color: '1A1A1A', size: 25 }, paragraph: { spacing: { before: 240, after: 120 } } },
          heading3: { run: { color: '1A1A1A', size: 23 }, paragraph: { spacing: { before: 220, after: 110 } } },
        },
      },
      sections: [
        {
          properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
          children: enfants,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  // ── PDF ──────────────────────────────────────────────────────────────────

  /** Version imprimable, pour un courrier prêt à signer. */
  async pdf(titre: string, contenu: string): Promise<Buffer> {
    return new Promise((resoudre, rejeter) => {
      const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: titre } });
      const morceaux: Buffer[] = [];
      doc.on('data', (c: Buffer) => morceaux.push(c));
      doc.on('end', () => resoudre(Buffer.concat(morceaux)));
      doc.on('error', rejeter);

      const ecrire = (fragments: Fragment[], options: PDFKit.Mixins.TextOptions = {}) => {
        fragments.forEach((f, i) => {
          doc.font(
            f.gras ? 'Helvetica-Bold' : f.italique ? 'Helvetica-Oblique' : 'Helvetica',
          );
          doc.text(f.texte, { ...options, continued: i < fragments.length - 1 });
        });
        if (fragments.length === 0) doc.text('');
      };

      doc.font('Helvetica-Bold').fontSize(17).text(titre);
      doc.moveDown(1);

      for (const bloc of this.decouper(contenu)) {
        switch (bloc.type) {
          case 'titre':
            doc.moveDown(0.6);
            doc.font('Helvetica-Bold').fontSize(bloc.niveau === 1 ? 14 : 12);
            doc.text(bloc.texte.replace(/\*\*/g, ''));
            doc.moveDown(0.3);
            break;
          case 'puce':
            doc.fontSize(10.5);
            // pdfkit ne dessine de puce que via `list()`, qui ne sait pas
            // mélanger gras et normal : on pose la puce nous-mêmes.
            ecrire([{ texte: '•  ', gras: false, italique: false }, ...this.fragments(bloc.texte)], {
              indent: 14,
            });
            break;
          case 'numero':
            doc.fontSize(10.5);
            ecrire([{ texte: `${bloc.rang}.  `, gras: false, italique: false }, ...this.fragments(bloc.texte)], {
              indent: 14,
            });
            break;
          case 'trait':
            doc.moveDown(0.8);
            doc
              .strokeColor('#999999')
              .dash(3, { space: 3 })
              .moveTo(doc.page.margins.left, doc.y)
              .lineTo(doc.page.width - doc.page.margins.right, doc.y)
              .stroke()
              .undash();
            doc.moveDown(0.8);
            break;
          default:
            doc.fontSize(10.5);
            // Pas de justification : combinée au mode « continued » qui rend
            // le gras, pdfkit avale l'espace situé au bord d'une ligne et
            // colle deux mots. Un fer à gauche propre vaut mieux qu'un
            // alignement parfait avec des mots soudés.
            ecrire(this.fragments(bloc.texte));
            doc.moveDown(0.5);
        }
      }

      doc.end();
    });
  }

  /**
   * Nom de fichier proposé au téléchargement : lisible, daté, sans accent ni
   * caractère qui gêne un système de fichiers ou un client de messagerie.
   */
  nomFichier(titre: string, extension: string, quand = new Date()): string {
    const base = titre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .toLowerCase();
    const jour = quand.toISOString().slice(0, 10);
    return `${base || 'ecrit'}-${jour}.${extension}`;
  }
}
