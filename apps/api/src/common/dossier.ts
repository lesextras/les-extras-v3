import { ComplianceDocType } from '@prisma/client';

/**
 * LE DOSSIER QU'IL FAUT AVOIR DÉPOSÉ POUR CANDIDATER.
 *
 * ⚠ CE FICHIER NE CONTIENT QUE LA RÈGLE, PAS LA REQUÊTE. Elle est appelée
 * depuis le ciblage des missions, depuis le vivier et depuis l'écran du
 * dossier : écrite à trois endroits, elle aurait divergé au premier ajout de
 * pièce, et une personne aurait été « complète » d'un côté et « incomplète »
 * de l'autre.
 *
 * ⚠ LA LISTE EST PLUS COURTE QUE `ConformiteService.REQUIRED_TYPES`, ET C'EST
 * VOULU.
 *
 * Le coffre-fort d'un établissement suit quatre pièces pour ses salariés —
 * identité, diplôme, casier, coordonnées bancaires. Toutes les quatre n'ont
 * pas leur place à l'entrée :
 *
 *   — LE DIPLÔME exclurait les faisant-fonction, qui sont une réalité
 *     quotidienne du secteur : un établissement en tension embauche en CDD un
 *     AES non diplômé, et c'est légal. Une plateforme qui refuserait ces
 *     candidatures écarterait précisément les gens que les établissements
 *     appellent. Il est demandé, il n'est pas bloquant.
 *   — LES COORDONNÉES BANCAIRES se donnent à l'embauche, à l'employeur. Elles
 *     n'ont rien à faire dans la décision de candidater, et les réclamer plus
 *     tôt reviendrait à collecter un RIB pour rien.
 *
 * Restent les deux qui conditionnent l'ACCÈS au secteur, pas le poste :
 * l'identité, et le bulletin n° 3 (art. L. 133-6 du CASF, incapacités
 * d'exercer auprès de publics vulnérables).
 */
export const PIECES_POUR_CANDIDATER: ComplianceDocType[] = [
  ComplianceDocType.IDENTITY,
  ComplianceDocType.CRIMINAL_RECORD,
];

/**
 * ⚠ UN CASIER DE 2019 N'EST PAS UN CASIER. Le bulletin n° 3 atteste au jour de
 * son édition et de rien après : passé un an, on le redemande. C'est le même
 * délai que celui déjà appliqué dans le coffre-fort
 * (`CRIMINAL_RECORD_MAX_MONTHS`), et les deux doivent rester d'accord.
 */
export const CASIER_VALIDE_MOIS = 12;

/** Ce qu'il faut savoir d'une pièce pour dire si elle est déposée. */
export interface PieceDeposee {
  type: ComplianceDocType;
  fileId: string | null;
  fileUrl: string | null;
  issuedAt: Date | null;
}

/**
 * Une pièce compte-t-elle comme déposée ?
 *
 * ⚠ « DÉPOSÉE » VEUT DIRE QU'UN FICHIER EST LÀ, pas qu'il a été jugé. Le
 * statut `VALID` du coffre-fort appartient à l'établissement qui a relu la
 * pièce de SON salarié ; s'en servir ici rendrait impossible de candidater
 * tant que personne n'a rien relu — c'est-à-dire toujours, pour quelqu'un qui
 * n'est encore employé nulle part.
 */
export function estDeposee(piece: PieceDeposee, maintenant = new Date()): boolean {
  const aUnFichier = Boolean(piece.fileId) || Boolean(piece.fileUrl?.trim());
  if (!aUnFichier) return false;

  if (piece.type === ComplianceDocType.CRIMINAL_RECORD && piece.issuedAt) {
    const limite = maintenant.getTime() - CASIER_VALIDE_MOIS * 30 * 24 * 3600 * 1000;
    if (piece.issuedAt.getTime() < limite) return false;
  }
  return true;
}

/** Les pièces exigées qui manquent encore. Vide = le dossier est complet. */
export function piecesManquantes(
  pieces: PieceDeposee[],
  maintenant = new Date(),
): ComplianceDocType[] {
  return PIECES_POUR_CANDIDATER.filter(
    (type) => !pieces.some((p) => p.type === type && estDeposee(p, maintenant)),
  );
}

/** Le libellé d'une pièce, écrit une seule fois pour tous les écrans. */
export const LIBELLE_PIECE: Record<ComplianceDocType, string> = {
  [ComplianceDocType.IDENTITY]: 'pièce d’identité',
  [ComplianceDocType.DIPLOMA]: 'diplôme',
  [ComplianceDocType.CRIMINAL_RECORD]: 'bulletin n° 3 du casier judiciaire',
  [ComplianceDocType.DRIVING_LICENSE]: 'permis de conduire',
  [ComplianceDocType.IBAN]: 'coordonnées bancaires',
  [ComplianceDocType.AUTOENTREPRENEUR]: 'attestation d’auto-entrepreneur',
  [ComplianceDocType.VITALE]: 'attestation de sécurité sociale',
  [ComplianceDocType.OTHER]: 'pièce complémentaire',
};

/** « la pièce d'identité et le bulletin n° 3 » — pour un message lisible. */
export function listerPieces(types: ComplianceDocType[]): string {
  const noms = types.map((t) => LIBELLE_PIECE[t]);
  if (noms.length <= 1) return noms[0] ?? '';
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}
