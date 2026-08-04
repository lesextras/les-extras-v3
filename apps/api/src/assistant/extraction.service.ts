import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { inflateRawSync } from 'node:zlib';

/**
 * LECTURE DES DOCUMENTS DÉPOSÉS.
 *
 * Un éducateur qui veut apprendre sa trame à LEX dépose ce qu'il a sous la
 * main : le dernier rapport qu'il a rendu. En pratique, c'est un .docx neuf
 * fois sur dix, un PDF sinon. On lit donc ces deux formats, plus le texte
 * brut — et on dit clairement quoi faire dans le seul cas qu'on ne sait pas
 * traiter, le PDF scanné, qui n'est pas du texte mais une image.
 *
 * Le .docx est lu SANS dépendance : c'est une archive ZIP dont on n'a besoin
 * que d'un seul membre, `word/document.xml`. Trente lignes de lecture d'en-tête
 * ZIP et un `inflateRaw` de la bibliothèque standard suffisent — inutile
 * d'embarquer une bibliothèque de traitement Word complète pour récupérer du
 * texte que l'on va de toute façon réduire à un squelette.
 */
@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  /** Types acceptés à l'import d'un modèle d'écrit. */
  static readonly TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ];

  /**
   * Renvoie le texte lisible d'un document. Lève une erreur explicite —
   * jamais un message technique — quand le format ne se laisse pas lire.
   */
  async extraire(buffer: Buffer, type: string, nom = 'document'): Promise<string> {
    if (!buffer?.length) throw new BadRequestException('Le fichier est vide.');

    let texte: string;
    if (type.includes('wordprocessingml') || nom.toLowerCase().endsWith('.docx')) {
      texte = this.depuisDocx(buffer);
    } else if (type === 'application/pdf' || nom.toLowerCase().endsWith('.pdf')) {
      texte = await this.depuisPdf(buffer);
    } else {
      texte = buffer.toString('utf8');
    }

    texte = this.nettoyer(texte);
    if (texte.length < 120) {
      throw new BadRequestException(
        "Ce document ne contient presque pas de texte lisible. S'il s'agit d'un PDF scanné, c'est une image : ouvrez-le, copiez le texte et collez-le — le résultat sera le même.",
      );
    }
    // Au-delà, on n'apprend rien de plus : un modèle d'écrit se lit sur
    // quelques pages, et on ne renvoie de toute façon qu'un squelette.
    return texte.slice(0, 24_000);
  }

  // ── .docx ────────────────────────────────────────────────────────────────

  /** Extrait `word/document.xml` de l'archive et en tire le texte. */
  private depuisDocx(buffer: Buffer): string {
    const xml = this.membreZip(buffer, 'word/document.xml');
    if (!xml) {
      throw new BadRequestException(
        "Ce fichier Word n'a pas pu être ouvert. Réenregistrez-le au format .docx, ou collez son texte directement.",
      );
    }
    const brut = xml.toString('utf8');
    return (
      brut
        // Une fin de paragraphe ou un saut de ligne devient un vrai retour :
        // c'est ce qui préserve la STRUCTURE, et la structure est justement
        // ce qu'on cherche à apprendre.
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:br\s*\/?>/g, '\n')
        .replace(/<w:tab\s*\/?>/g, '\t')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    );
  }

  /**
   * Lit un membre d'archive ZIP par son nom, via le CATALOGUE CENTRAL.
   *
   * On ne se fie pas aux en-têtes locaux : LibreOffice — donc une bonne part
   * des documents que les établissements vont déposer — écrit les tailles dans
   * un descripteur placé APRÈS les données, et laisse l'en-tête local à zéro.
   * Un lecteur qui balaie les en-têtes locaux échoue alors sur des fichiers
   * parfaitement valides. Le catalogue central, lui, porte toujours la taille
   * réelle et l'adresse de chaque membre : c'est la seule source fiable.
   */
  private membreZip(buffer: Buffer, nomVoulu: string): Buffer | null {
    const FIN_CATALOGUE = 0x06054b50;
    const ENTREE_CATALOGUE = 0x02014b50;

    // Le bloc de fin est en queue de fichier, précédé d'un commentaire de
    // longueur variable (65 535 octets au plus) : on remonte depuis la fin.
    let finCatalogue = -1;
    const planchers = Math.max(0, buffer.length - 22 - 0xffff);
    for (let i = buffer.length - 22; i >= planchers; i--) {
      if (buffer.readUInt32LE(i) === FIN_CATALOGUE) {
        finCatalogue = i;
        break;
      }
    }
    if (finCatalogue < 0) return null;

    const nombreEntrees = buffer.readUInt16LE(finCatalogue + 10);
    let position = buffer.readUInt32LE(finCatalogue + 16);

    for (let n = 0; n < nombreEntrees; n++) {
      if (position + 46 > buffer.length) return null;
      if (buffer.readUInt32LE(position) !== ENTREE_CATALOGUE) return null;

      const compression = buffer.readUInt16LE(position + 10);
      const tailleCompressee = buffer.readUInt32LE(position + 20);
      const longueurNom = buffer.readUInt16LE(position + 28);
      const longueurExtra = buffer.readUInt16LE(position + 30);
      const longueurCommentaire = buffer.readUInt16LE(position + 32);
      const decalageLocal = buffer.readUInt32LE(position + 42);
      const nom = buffer.subarray(position + 46, position + 46 + longueurNom).toString('utf8');

      if (nom === nomVoulu) {
        // L'en-tête local ne sert plus qu'à connaître la longueur de ses
        // propres champs variables, pour savoir où commencent les données.
        if (decalageLocal + 30 > buffer.length) return null;
        const nomLocal = buffer.readUInt16LE(decalageLocal + 26);
        const extraLocal = buffer.readUInt16LE(decalageLocal + 28);
        const debut = decalageLocal + 30 + nomLocal + extraLocal;
        const donnees = buffer.subarray(debut, debut + tailleCompressee);
        try {
          return compression === 0 ? Buffer.from(donnees) : inflateRawSync(donnees);
        } catch (err) {
          this.logger.warn(`Décompression impossible pour ${nom} : ${err}`);
          return null;
        }
      }
      position += 46 + longueurNom + longueurExtra + longueurCommentaire;
    }
    return null;
  }

  // ── .pdf ─────────────────────────────────────────────────────────────────

  private async depuisPdf(buffer: Buffer): Promise<string> {
    try {
      // Import différé : la bibliothèque est lourde et ne sert qu'ici.
      const { PDFParse } = await import('pdf-parse');
      const parseur = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const resultat = await parseur.getText();
        return resultat?.text ?? '';
      } finally {
        await parseur.destroy?.();
      }
    } catch (err) {
      this.logger.warn(`Lecture PDF impossible : ${err}`);
      throw new BadRequestException(
        "Ce PDF n'a pas pu être lu. S'il est protégé par mot de passe ou s'il s'agit d'un scan, copiez son texte et collez-le directement.",
      );
    }
  }

  // ── Mise en forme ────────────────────────────────────────────────────────

  /** Normalise les blancs sans écraser les sauts de paragraphe. */
  private nettoyer(texte: string): string {
    return texte
      .replace(/\r\n?/g, '\n')
      .replace(/ /g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
