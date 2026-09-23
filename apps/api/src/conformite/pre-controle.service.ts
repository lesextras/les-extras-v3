import { Injectable, Logger } from '@nestjs/common';
import { ComplianceDocType, Prisma } from '@prisma/client';
import type { Readable } from 'node:stream';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ClaudeService } from '../assistant/claude.service';
import { ExtractionService } from '../assistant/extraction.service';

/**
 * LE PRÉ-CONTRÔLE AUTOMATIQUE DES PIÈCES.
 *
 * Quand un intervenant dépose une pièce (identité, diplôme, bulletin n°3…),
 * une lecture automatique en tire ce qu'un œil humain vérifie en premier :
 * est-ce bien le bon type de document, est-ce bien au nom de la personne,
 * quelles dates y figurent. Le résultat est une NOTE, posée à côté de la
 * pièce, que la structure lit avant de valider.
 *
 * ⚠ CE PASSAGE NE VALIDE RIEN. Le statut de la pièce ne bouge pas : c'est
 * toujours une personne, côté structure ou côté ADéPA, qui la passe en
 * « valide ». La note dit seulement où regarder. Un document illisible,
 * un moteur indisponible, une réponse mal formée : la note le dit, et le
 * contrôle humain se fait comme avant.
 *
 * Les images et les PDF passent par la lecture visuelle de Claude (le seul
 * moteur de la maison qui lit une image) ; les .docx passent par l'extraction
 * de texte puis le même moteur. Rien n'est conservé chez le fournisseur
 * au-delà de l'appel.
 *
 * ClaudeService et ExtractionService sont fournis ICI, par ConformiteModule,
 * et non importés d'AssistantModule : importer ce module-là depuis la
 * conformité créait un cycle d'imports au démarrage (23/09/2026). Les deux
 * services n'ont aucune dépendance, les instancier deux fois ne coûte rien.
 *
 * Désactivable d'un mot : PRE_CONTROLE_PIECES=off.
 */
@Injectable()
export class PreControleService {
  private readonly logger = new Logger(PreControleService.name);

  /** Au-delà, on ne lit pas : ce n'est pas une pièce, c'est un scan de mauvaise qualité. */
  private static readonly TAILLE_MAX = 12 * 1024 * 1024;

  private static readonly LIBELLE: Record<ComplianceDocType, string> = {
    IDENTITY: "pièce d'identité (carte nationale d'identité, passeport ou titre de séjour)",
    DIPLOMA: "diplôme ou titre professionnel (DEES, DEME, DEAES, DEEJE, CAFERUIS, etc.)",
    CRIMINAL_RECORD: 'extrait de casier judiciaire, bulletin n°3',
    DRIVING_LICENSE: 'permis de conduire',
    IBAN: "relevé d'identité bancaire (RIB / IBAN)",
    AUTOENTREPRENEUR: "attestation d'immatriculation d'auto-entrepreneur ou avis de situation SIRENE",
    VITALE: 'attestation de droits (carte Vitale)',
    OTHER: 'autre justificatif',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly claude: ClaudeService,
    private readonly extraction: ExtractionService,
  ) {}

  get actif(): boolean {
    return process.env.PRE_CONTROLE_PIECES !== 'off';
  }

  /**
   * À appeler sans attendre (`void`) après un dépôt : le dépôt répond tout de
   * suite, la note arrive quelques secondes plus tard.
   */
  async lancer(documentId: string): Promise<void> {
    if (!this.actif) return;
    try {
      await this.analyser(documentId);
    } catch (err) {
      this.logger.warn(
        `Pré-contrôle ${documentId} impossible : ${err instanceof Error ? err.message : err}`,
      );
      await this.enregistrer(documentId, {
        lisible: false,
        verdict: 'A_VERIFIER',
        typeDetecte: null,
        correspondAuType: null,
        nomDetecte: null,
        correspondAuNom: null,
        dateEmission: null,
        dateExpiration: null,
        alertes: ['Lecture automatique impossible : contrôle humain uniquement.'],
        resume: 'La pièce n’a pas pu être lue automatiquement.',
      }).catch(() => undefined);
    }
  }

  private async analyser(documentId: string) {
    const doc = await this.prisma.complianceDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        type: true,
        file: { select: { storageKey: true, mimeType: true, originalName: true, size: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!doc?.file) return;
    if (doc.file.size > PreControleService.TAILLE_MAX) {
      throw new Error('fichier trop volumineux pour la lecture automatique');
    }

    const buffer = await this.toBuffer(await this.storage.lire(doc.file.storageKey));
    const nom = `${doc.user.firstName ?? ''} ${doc.user.lastName ?? ''}`.trim();
    const attendu = PreControleService.LIBELLE[doc.type];
    const consigne = PreControleService.consigne(attendu, nom);

    const mime = doc.file.mimeType.toLowerCase();
    if (!this.claude.disponible) {
      throw new Error('lecture automatique indisponible (clé Anthropic absente)');
    }
    let brut: string;
    if (mime.startsWith('image/') || mime === 'application/pdf') {
      brut = await this.claude.lireDocument({
        system: PreControleService.SYSTEM,
        consigne,
        media: {
          type: mime === 'application/pdf' ? 'document' : 'image',
          mimeType: mime,
          base64: buffer.toString('base64'),
        },
        maxTokens: 600,
      });
    } else {
      const texte = await this.extraction.extraire(buffer, mime, doc.file.originalName);
      brut = await this.claude.completer({
        system: PreControleService.SYSTEM,
        user: `${consigne}\n\nTEXTE DU DOCUMENT :\n${texte.slice(0, 12000)}`,
        maxTokens: 600,
        temperature: 0,
      });
    }

    const note = PreControleService.interpreter(brut);
    await this.enregistrer(doc.id, note);
    this.logger.log(`Pré-contrôle ${doc.id} (${doc.type}) : ${note.verdict}`);
  }

  private async enregistrer(documentId: string, note: NotePreControle) {
    await this.prisma.complianceDocument.update({
      where: { id: documentId },
      data: {
        preControle: note as unknown as Prisma.InputJsonValue,
        preControleLe: new Date(),
      },
    });
  }

  private async toBuffer(flux: Readable): Promise<Buffer> {
    const morceaux: Buffer[] = [];
    for await (const m of flux) morceaux.push(Buffer.isBuffer(m) ? m : Buffer.from(m));
    return Buffer.concat(morceaux);
  }

  private static readonly SYSTEM = [
    'Tu es le pré-contrôle documentaire de la plateforme Les Extras (médico-social, France).',
    'On te montre une pièce déposée par un intervenant. Tu ne décides rien : tu décris ce que tu vois,',
    'de façon factuelle, pour aider une personne qui va contrôler la pièce.',
    'Réponds UNIQUEMENT avec un objet JSON, sans texte autour, avec exactement ces clés :',
    '{"lisible": booléen, "typeDetecte": texte ou null, "correspondAuType": booléen ou null,',
    ' "nomDetecte": texte ou null, "correspondAuNom": booléen ou null,',
    ' "dateEmission": "AAAA-MM-JJ" ou null, "dateExpiration": "AAAA-MM-JJ" ou null,',
    ' "alertes": [textes courts], "resume": une ou deux phrases en français}.',
    'Ne recopie aucun numéro (identité, sécurité sociale, IBAN, permis) : jamais.',
    'Si le document est flou, tronqué ou n’est pas un justificatif, mets lisible à false et dis-le.',
  ].join('\n');

  private static consigne(attendu: string, nom: string) {
    return [
      `Pièce attendue : ${attendu}.`,
      nom ? `Nom déclaré par la personne sur la plateforme : ${nom}.` : 'Nom déclaré : inconnu.',
      'Indique si le document correspond à la pièce attendue, si le nom qui y figure correspond au nom déclaré,',
      'et les dates d’émission et d’expiration si elles sont lisibles.',
    ].join('\n');
  }

  /** Lit la réponse du moteur ; une réponse mal formée devient une note « à vérifier ». */
  private static interpreter(brut: string): NotePreControle {
    const debut = brut.indexOf('{');
    const fin = brut.lastIndexOf('}');
    let json: Record<string, unknown> = {};
    if (debut >= 0 && fin > debut) {
      try {
        json = JSON.parse(brut.slice(debut, fin + 1)) as Record<string, unknown>;
      } catch {
        json = {};
      }
    }
    const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
    const txt = (v: unknown, max = 200): string | null =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
    const date = (v: unknown): string | null =>
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

    const lisible = bool(json.lisible) ?? false;
    const correspondAuType = bool(json.correspondAuType);
    const correspondAuNom = bool(json.correspondAuNom);
    const dateExpiration = date(json.dateExpiration);
    const alertes = Array.isArray(json.alertes)
      ? json.alertes.filter((a): a is string => typeof a === 'string').map((a) => a.slice(0, 160)).slice(0, 6)
      : [];

    if (dateExpiration && new Date(dateExpiration).getTime() < Date.now()) {
      alertes.unshift('La date d’expiration lue est dépassée.');
    }
    if (correspondAuType === false) alertes.unshift('Le document ne semble pas être la pièce attendue.');
    if (correspondAuNom === false) alertes.unshift('Le nom lu ne correspond pas au nom déclaré.');

    let verdict: NotePreControle['verdict'] = 'A_VERIFIER';
    if (!lisible) verdict = 'ILLISIBLE';
    else if (correspondAuType === true && correspondAuNom !== false && alertes.length === 0) {
      verdict = 'COHERENT';
    }

    return {
      lisible,
      verdict,
      typeDetecte: txt(json.typeDetecte),
      correspondAuType,
      nomDetecte: txt(json.nomDetecte, 120),
      correspondAuNom,
      dateEmission: date(json.dateEmission),
      dateExpiration,
      alertes,
      resume: txt(json.resume, 400) ?? (lisible ? 'Document lu.' : 'Document illisible.'),
    };
  }
}

/** La note posée à côté de la pièce — ce que la structure lit avant de valider. */
export interface NotePreControle {
  lisible: boolean;
  /** COHERENT : rien d'anormal ; A_VERIFIER : un point à regarder ; ILLISIBLE : à contrôler à la main. */
  verdict: 'COHERENT' | 'A_VERIFIER' | 'ILLISIBLE';
  typeDetecte: string | null;
  correspondAuType: boolean | null;
  nomDetecte: string | null;
  correspondAuNom: boolean | null;
  dateEmission: string | null;
  dateExpiration: string | null;
  alertes: string[];
  resume: string;
}
