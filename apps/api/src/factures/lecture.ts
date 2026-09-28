import { BadRequestException, Logger } from '@nestjs/common';
import type { ExtractionService } from '../assistant/extraction.service';
import type { MoteurService } from '../assistant/moteur.service';
import type { FichierRecu } from '../storage/files.service';

/**
 * LA LECTURE D'UNE PIÈCE PAR LE MOTEUR : commune aux factures et aux devis.
 * Une image passe en pièce jointe, un PDF en texte (ou en pièce jointe s'il
 * est scanné). La réponse est un JSON strict, relu par `parserLecture`.
 */

export interface LectureFacture {
  fournisseur: string;
  numero: string | null;
  dateFacture: string | null;
  dateEcheance: string | null;
  montantHT: number | null;
  tva: number | null;
  montantTTC: number | null;
  devise: string;
  poste: string | null;
  lignes: { libelle: string; quantite: number | null; prixUnitaire: number | null; total: number | null }[];
  remarque: string | null;
  siret: string | null;
  iban: string | null;
}

/** Les postes proposés : ceux d'un budget associatif ou d'un petit organisme. */
export const POSTES = [
  'Loyer et charges',
  'Assurance',
  'Matériel et fournitures',
  'Prestations et sous-traitance',
  'Formation et formateurs',
  'Logiciels et abonnements',
  'Communication',
  'Déplacements',
  'Alimentation et réception',
  'Frais bancaires',
  'Autre',
] as const;

const FORMAT_JSON = `Réponds UNIQUEMENT par un objet JSON, sans texte autour, avec exactement ces clés :
{"fournisseur": string, "numero": string|null, "dateFacture": "AAAA-MM-JJ"|null, "dateEcheance": "AAAA-MM-JJ"|null,
 "montantHT": number|null, "tva": number|null, "montantTTC": number|null, "devise": "EUR",
 "poste": l'un de [${POSTES.map((p) => `"${p}"`).join(', ')}] ou null,
 "lignes": [{"libelle": string, "quantite": number|null, "prixUnitaire": number|null, "total": number|null}],
 "siret": string|null (14 chiffres du fournisseur, tel qu'imprimé), "iban": string|null (l'IBAN de paiement imprimé, sans espaces),
 "remarque": string|null}
Règles : montants en nombres décimaux avec un point, jamais de texte dans un nombre ; si un montant est illisible, null et une remarque ;
ne jamais inventer un fournisseur ni un montant ; "remarque" signale ce qui est douteux (montant barré, page manquante, doublon probable), sinon null.`;

export const CONSIGNE_FACTURE = `Tu lis une facture ou un reçu fournisseur pour une association ou un organisme de formation français.\n${FORMAT_JSON}`;

export const CONSIGNE_DEVIS = `Tu lis un DEVIS (ou une proposition commerciale, un bon de commande) d'un fournisseur pour une association ou un organisme de formation français.
"numero" est la référence du devis, "dateFacture" sa date d'émission, "dateEcheance" sa date de fin de validité (souvent « valable jusqu'au » ou « valable 30 jours »).
${FORMAT_JSON}`;

export function lectureVide(remarque: string | null = null): LectureFacture {
  return { fournisseur: '', numero: null, dateFacture: null, dateEcheance: null, montantHT: null, tva: null, montantTTC: null, devise: 'EUR', poste: null, lignes: [], remarque, siret: null, iban: null };
}

export function parserLecture(brut: string): LectureFacture {
  const debut = brut.indexOf('{');
  const fin = brut.lastIndexOf('}');
  if (debut < 0 || fin < debut) return lectureVide('Réponse du moteur illisible.');
  try {
    const j = JSON.parse(brut.slice(debut, fin + 1)) as Partial<LectureFacture>;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
    const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    return {
      fournisseur: typeof j.fournisseur === 'string' ? j.fournisseur.trim() : '',
      numero: typeof j.numero === 'string' ? j.numero.trim() : null,
      dateFacture: date(j.dateFacture),
      dateEcheance: date(j.dateEcheance),
      montantHT: num(j.montantHT),
      tva: num(j.tva),
      montantTTC: num(j.montantTTC),
      devise: typeof j.devise === 'string' && j.devise.length === 3 ? j.devise.toUpperCase() : 'EUR',
      poste: typeof j.poste === 'string' && (POSTES as readonly string[]).includes(j.poste) ? j.poste : null,
      lignes: Array.isArray(j.lignes)
        ? j.lignes.slice(0, 60).map((l) => ({
            libelle: typeof l?.libelle === 'string' ? l.libelle.slice(0, 160) : '',
            quantite: num(l?.quantite),
            prixUnitaire: num(l?.prixUnitaire),
            total: num(l?.total),
          }))
        : [],
      remarque: typeof j.remarque === 'string' && j.remarque.trim() ? j.remarque.trim().slice(0, 300) : null,
      siret: typeof j.siret === 'string' ? j.siret : null,
      iban: typeof j.iban === 'string' ? j.iban : null,
    };
  } catch {
    return lectureVide('Réponse du moteur illisible.');
  }
}

export async function lireAvecMoteur(moteur: MoteurService, extraction: ExtractionService, fichier: FichierRecu, consigne: string, logger: Logger): Promise<LectureFacture> {
  const options = { system: consigne, user: '', maxTokens: 1500, temperature: 0 } as {
    system: string;
    user: string;
    maxTokens: number;
    temperature: number;
    pieces?: { mimeType: string; base64: string }[];
  };
  if (fichier.mimetype.startsWith('image/')) {
    options.user = 'Voici la photo du document. Lis-le et réponds en JSON.';
    options.pieces = [{ mimeType: fichier.mimetype, base64: fichier.buffer.toString('base64') }];
  } else {
    let texte = '';
    try {
      texte = await extraction.extraire(fichier.buffer, fichier.mimetype, fichier.originalname);
    } catch {
      texte = '';
    }
    if (texte.length >= 120) {
      options.user = `Voici le texte du document :\n\n${texte.slice(0, 12_000)}`;
    } else {
      // PDF scanné : on donne le PDF lui-même à un moteur qui sait lire une image.
      options.user = 'Voici le document en PDF. Lis-le et réponds en JSON.';
      options.pieces = [{ mimeType: 'application/pdf', base64: fichier.buffer.toString('base64') }];
    }
  }
  let brut = '';
  try {
    brut = await moteur.completer(options);
  } catch (err) {
    logger.warn(`Lecture impossible : ${err instanceof Error ? err.message : String(err)}`);
    throw new BadRequestException("Le moteur n'a pas pu lire ce document. Réessayez, ou saisissez-le à la main.");
  }
  return parserLecture(brut);
}
