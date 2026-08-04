import { FileKind } from '@prisma/client';

/**
 * RÈGLES DE DÉPÔT, par famille de documents.
 *
 * On ne se fie jamais à l'extension ni au type déclaré par le navigateur :
 * les deux sont fournis par le client, donc falsifiables. On lit les premiers
 * octets du fichier (« nombre magique ») pour confirmer sa nature réelle.
 */

export interface RegleFamille {
  /** Taille maximale acceptée, en octets. */
  tailleMax: number;
  /** Types réellement acceptés. */
  types: string[];
  /** Libellé lisible, pour les messages d'erreur. */
  libelle: string;
}

const Mo = 1024 * 1024;

const DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const REGLES: Record<FileKind, RegleFamille> = {
  ARTICLE: {
    tailleMax: 5 * Mo,
    types: ['image/jpeg', 'image/png', 'image/webp'],
    libelle: "illustration d'actualité",
  },
  COMPLIANCE: {
    tailleMax: 10 * Mo,
    types: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    libelle: 'pièce de conformité',
  },
  MISSION: {
    tailleMax: 10 * Mo,
    types: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', DOCX],
    libelle: 'pièce jointe de mission',
  },
  AVATAR: {
    tailleMax: 3 * Mo,
    types: ['image/jpeg', 'image/png', 'image/webp'],
    libelle: 'photo de profil',
  },
  TRAME: {
    tailleMax: 10 * Mo,
    // Un modèle d'écrit est un document, jamais une image : accepter un scan
    // ici n'aurait aucun sens puisqu'on ne saurait pas le lire.
    types: ['application/pdf', DOCX, 'text/plain', 'text/markdown'],
    libelle: "modèle d'écrit",
  },
  FORMATION: {
    tailleMax: 20 * Mo,
    types: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      DOCX,
      PPTX,
    ],
    libelle: 'document de formation',
  },
};

/** La plus grande taille tolérée, toutes familles confondues. */
export const TAILLE_MAX_GLOBALE = Math.max(
  ...Object.values(REGLES).map((r) => r.tailleMax),
);

/**
 * Déduit le type réel à partir des premiers octets. Renvoie `null` si la
 * signature n'est pas reconnue — auquel cas le fichier est refusé.
 *
 * Les formats Office (docx, pptx) sont des archives ZIP : leur signature est
 * celle d'un ZIP. On ne peut pas les distinguer d'une archive quelconque sans
 * en lire le contenu ; on retient donc le type déclaré, mais seulement après
 * avoir confirmé qu'il s'agit bien d'un ZIP et que ce type est attendu.
 */
export function typeReel(buffer: Buffer, typeDeclare: string): string | null {
  if (buffer.length < 12) return null;

  // PDF : "%PDF"
  if (buffer.subarray(0, 4).toString('latin1') === '%PDF') {
    return 'application/pdf';
  }
  // JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG : 89 "PNG" 0D 0A
  if (
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString('latin1') === 'PNG' &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a
  ) {
    return 'image/png';
  }
  // WEBP : "RIFF" .... "WEBP"
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'image/webp';
  }
  // Texte brut : aucun nombre magique. On ne l'accepte que s'il est déclaré
  // comme tel ET qu'il ne commence pas par une signature binaire connue —
  // sinon n'importe quel exécutable passerait en se disant « text/plain ».
  if (typeDeclare === 'text/plain' || typeDeclare === 'text/markdown') {
    const debut = buffer.subarray(0, 512);
    const binaire = debut.includes(0x00);
    return binaire ? null : typeDeclare;
  }
  // ZIP (docx / pptx) : 50 4B 03 04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return [DOCX, PPTX].includes(typeDeclare) ? typeDeclare : null;
  }

  return null;
}

/**
 * Nom de fichier assaini : on retire toute trace de chemin et les caractères
 * de contrôle, et on limite la longueur. Ce nom ne sert qu'à l'affichage et au
 * nom du fichier téléchargé — jamais à construire un chemin de stockage.
 */
export function nomSur(nom: string): string {
  const base = nom.split(/[\\/]/).pop() ?? 'document';
  const propre = Array.from(base)
    .filter((c) => {
      const code = c.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join('')
    .replace(/["<>|:*?]/g, '')
    .trim();
  return (propre || 'document').slice(0, 180);
}
