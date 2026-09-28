import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileKind, Prisma, StatutFactureFournisseur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { ExtractionService } from '../assistant/extraction.service';
import { MoteurService } from '../assistant/moteur.service';
import { FournisseursService } from './fournisseurs.service';
import { FraisService } from './frais.service';

/**
 * MES FACTURES : l'outil premium de Pilote (association et académie).
 *
 * Le même fonctionnement qu'un logiciel de gestion pour restaurateurs : on
 * dépose la facture d'un fournisseur (photo, PDF), le moteur en tire le
 * fournisseur, les montants, les dates et les lignes, on l'affecte à un poste
 * du budget, on est prévenu quand un fournisseur augmente, et tout s'exporte
 * pour l'expert-comptable ou le compte rendu financier d'une subvention.
 *
 * PREMIUM : rien ne se lit sans un abonnement ACTIF, et l'abonnement ne
 * s'active que par le webhook Stripe (`billing.service.ts`, kind `factures`),
 * jamais par un écran. Le quota se compte par mois calendaire.
 *
 * ⚠ AUCUN PRIX N'EST ÉCRIT DANS LE CODE (règle de la fondatrice). Le montant
 * vient de `PILOTE_FACTURES_PRIX_CENTS` ; tant qu'il n'est pas posé, la page
 * présente l'outil et le bouton d'abonnement dit que le tarif arrive.
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

const CONSIGNE = `Tu lis une facture ou un reçu fournisseur pour une association ou un organisme de formation français.
Réponds UNIQUEMENT par un objet JSON, sans texte autour, avec exactement ces clés :
{"fournisseur": string, "numero": string|null, "dateFacture": "AAAA-MM-JJ"|null, "dateEcheance": "AAAA-MM-JJ"|null,
 "montantHT": number|null, "tva": number|null, "montantTTC": number|null, "devise": "EUR",
 "poste": l'un de [${POSTES.map((p) => `"${p}"`).join(', ')}] ou null,
 "lignes": [{"libelle": string, "quantite": number|null, "prixUnitaire": number|null, "total": number|null}],
 "siret": string|null (14 chiffres du fournisseur, tel qu'imprimé), "iban": string|null (l'IBAN de paiement imprimé sur la facture, sans espaces),
 "remarque": string|null}
Règles : montants en nombres décimaux avec un point, jamais de texte dans un nombre ; si un montant est illisible, null et une remarque ;
ne jamais inventer un fournisseur ni un montant ; "remarque" signale ce qui est douteux (montant barré, page manquante, doublon probable), sinon null.`;

@Injectable()
export class FacturesService {
  private readonly logger = new Logger(FacturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly extraction: ExtractionService,
    private readonly moteur: MoteurService,
    private readonly config: ConfigService,
    private readonly fournisseurs: FournisseursService,
    private readonly frais: FraisService,
  ) {}

  // ─── L'offre ──────────────────────────────────────────────────────────────

  prixCents(): number | null {
    const brut = this.config.get<string>('PILOTE_FACTURES_PRIX_CENTS');
    const n = brut ? Number.parseInt(brut, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  quotaParDefaut(): number {
    const n = Number.parseInt(this.config.get<string>('PILOTE_FACTURES_QUOTA') ?? '100', 10);
    return Number.isFinite(n) && n > 0 ? n : 100;
  }

  private moisCourant(d = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Les espaces à qui l'outil est OFFERT (ceux de l'association elle-même, pour
   * le faire tourner en vrai) : identifiants de comptes séparés par des
   * virgules dans `PILOTE_FACTURES_ESPACES_OFFERTS`. Tout le reste passe par
   * Stripe.
   */
  private offert(accountId: string) {
    const brut = this.config.get<string>('PILOTE_FACTURES_ESPACES_OFFERTS') ?? '';
    return brut.split(',').map((x) => x.trim()).filter(Boolean).includes(accountId);
  }

  /** L'état de l'abonnement, tel que l'écran l'affiche. */
  async abonnement(accountId: string) {
    const a = await this.prisma.abonnementFactures.findUnique({ where: { accountId } });
    const mois = this.moisCourant();
    const lues = a && a.moisCompteur === mois ? a.luesCeMois : 0;
    const quota = a?.quotaMensuel ?? this.quotaParDefaut();
    const offert = this.offert(accountId);
    return {
      actif: offert || a?.statut === 'active',
      statut: offert ? 'offert' : (a?.statut ?? 'aucun'),
      quotaMensuel: quota,
      luesCeMois: lues,
      restantes: Math.max(0, quota - lues),
      finPeriode: a?.finPeriode ?? null,
      prixCents: this.prixCents(),
    };
  }

  private async exigerActif(accountId: string) {
    let a = await this.prisma.abonnementFactures.findUnique({ where: { accountId } });
    if (!a && this.offert(accountId)) {
      // L'espace offert reçoit un compteur comme les autres : le quota mensuel vaut pour lui aussi.
      a = await this.prisma.abonnementFactures.create({ data: { accountId, statut: 'offert', quotaMensuel: this.quotaParDefaut() } });
    }
    if (!a || (a.statut !== 'active' && !(a.statut === 'offert' && this.offert(accountId)))) {
      throw new ForbiddenException("« Mes factures » est un outil premium : il s'ouvre avec l'abonnement.");
    }
    return a;
  }

  /** Une lecture de plus ce mois-ci, ou un refus si le quota est atteint. */
  private async consommer(accountId: string) {
    const a = await this.exigerActif(accountId);
    const mois = this.moisCourant();
    const lues = a.moisCompteur === mois ? a.luesCeMois : 0;
    if (lues >= a.quotaMensuel) {
      throw new ForbiddenException(
        `Les ${a.quotaMensuel} lectures du mois sont utilisées. Le compteur repart au 1er du mois prochain.`,
      );
    }
    await this.prisma.abonnementFactures.update({
      where: { accountId },
      data: { moisCompteur: mois, luesCeMois: lues + 1 },
    });
  }

  // ─── Lecture d'une facture ────────────────────────────────────────────────

  async deposer(accountId: string, userId: string, fichier: FichierRecu, poste?: string, enveloppeId?: string | null) {
    await this.consommer(accountId);

    const estImage = fichier.mimetype.startsWith('image/');
    const estPdf = fichier.mimetype === 'application/pdf';
    if (!estImage && !estPdf) {
      throw new BadRequestException('Déposez une photo (JPEG, PNG, WebP) ou un PDF de la facture.');
    }

    // Le fichier va au coffre : il est conservé, jamais public.
    const depose = await this.files.deposer({ fichier, famille: FileKind.COMPLIANCE, userId, accountId });

    const lecture = await this.lire(fichier);
    const ttc = lecture.montantTTC ?? lecture.montantHT ?? 0;
    if (!lecture.fournisseur) lecture.fournisseur = 'Fournisseur non lu';

    // L'alerte : la dernière facture du même fournisseur, si elle augmente.
    const { alerte, variationPct } = await this.comparer(accountId, lecture.fournisseur, ttc, lecture.remarque);
    // La fiche fournisseur : SIRET, RIB, annuaire des entreprises.
    const fiche = await this.fournisseurs.rattacher(accountId, lecture.fournisseur, { siret: lecture.siret, iban: lecture.iban });
    const alertes = [alerte, ...fiche.verification.alertes].filter((a): a is string => !!a);
    // Cohérence arithmétique : HT + TVA = TTC, sinon on le dit.
    if (lecture.montantHT !== null && lecture.tva !== null && lecture.montantTTC !== null && Math.abs(lecture.montantHT + lecture.tva - lecture.montantTTC) > 0.05) {
      alertes.push('HT + TVA ne font pas le TTC : relisez les montants.');
    }
    const enveloppe = enveloppeId ? await this.prisma.enveloppeFactures.findFirst({ where: { id: enveloppeId, accountId }, select: { id: true } }) : null;

    const facture = await this.prisma.factureFournisseur.create({
      data: {
        accountId,
        fileId: depose.id,
        fournisseurId: fiche.ficheId,
        siret: fiche.siret,
        ibanEmpreinte: fiche.ibanEmpreinte,
        ibanFin: fiche.ibanFin,
        verification: fiche.verification as unknown as Prisma.InputJsonValue,
        enveloppeId: enveloppe?.id ?? null,
        fournisseur: lecture.fournisseur.slice(0, 120),
        numero: lecture.numero?.slice(0, 60) ?? null,
        dateFacture: lecture.dateFacture ? new Date(lecture.dateFacture) : null,
        dateEcheance: lecture.dateEcheance ? new Date(lecture.dateEcheance) : null,
        montantHT: lecture.montantHT ?? null,
        tva: lecture.tva ?? null,
        montantTTC: ttc,
        devise: lecture.devise || 'EUR',
        poste: (poste && (POSTES as readonly string[]).includes(poste) ? poste : lecture.poste) ?? null,
        lignes: lecture.lignes as unknown as Prisma.InputJsonValue,
        alerte: alertes.length ? alertes.join(' ') : null,
        variationPct,
        origine: 'moteur',
      },
    });
    await this.frais.journaliser(accountId, userId, 'facture.deposee', facture.id, { fournisseur: facture.fournisseur, montantTTC: ttc, alertes: alertes.length });
    return this.presenter(facture);
  }

  /** Le moteur lit la pièce ; une image passe en pièce jointe, un PDF en texte. */
  private async lire(fichier: FichierRecu): Promise<LectureFacture> {
    const options = { system: CONSIGNE, user: '', maxTokens: 1500, temperature: 0 } as {
      system: string;
      user: string;
      maxTokens: number;
      temperature: number;
      pieces?: { mimeType: string; base64: string }[];
    };
    if (fichier.mimetype.startsWith('image/')) {
      options.user = 'Voici la photo de la facture. Lis-la et réponds en JSON.';
      options.pieces = [{ mimeType: fichier.mimetype, base64: fichier.buffer.toString('base64') }];
    } else {
      let texte = '';
      try {
        texte = await this.extraction.extraire(fichier.buffer, fichier.mimetype, fichier.originalname);
      } catch {
        texte = '';
      }
      if (texte.length >= 120) {
        options.user = `Voici le texte de la facture :\n\n${texte.slice(0, 12_000)}`;
      } else {
        // PDF scanné : on donne le PDF lui-même à un moteur qui sait lire une image.
        options.user = 'Voici la facture en PDF. Lis-la et réponds en JSON.';
        options.pieces = [{ mimeType: 'application/pdf', base64: fichier.buffer.toString('base64') }];
      }
    }
    let brut = '';
    try {
      brut = await this.moteur.completer(options);
    } catch (err) {
      this.logger.warn(`Lecture de facture impossible : ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException("Le moteur n'a pas pu lire cette facture. Réessayez, ou saisissez-la à la main.");
    }
    return this.parser(brut);
  }

  private parser(brut: string): LectureFacture {
    const debut = brut.indexOf('{');
    const fin = brut.lastIndexOf('}');
    const vide: LectureFacture = {
      fournisseur: '',
      numero: null,
      dateFacture: null,
      dateEcheance: null,
      montantHT: null,
      tva: null,
      montantTTC: null,
      devise: 'EUR',
      poste: null,
      lignes: [],
      remarque: 'Réponse du moteur illisible.',
      siret: null,
      iban: null,
    };
    if (debut < 0 || fin < debut) return vide;
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
      return vide;
    }
  }

  /** Compare au dernier montant du même fournisseur : + 20 % ou plus, on prévient. */
  private async comparer(accountId: string, fournisseur: string, ttc: number, remarque: string | null) {
    const precedente = await this.prisma.factureFournisseur.findFirst({
      where: { accountId, fournisseur: { equals: fournisseur, mode: 'insensitive' } },
      orderBy: [{ dateFacture: 'desc' }, { createdAt: 'desc' }],
    });
    const alertes: string[] = [];
    let variationPct: number | null = null;
    if (precedente && Number(precedente.montantTTC) > 0 && ttc > 0) {
      variationPct = Math.round(((ttc - Number(precedente.montantTTC)) / Number(precedente.montantTTC)) * 100);
      if (variationPct >= 20) alertes.push(`Hausse de ${variationPct} % par rapport à la dernière facture de ce fournisseur.`);
      if (Math.abs(ttc - Number(precedente.montantTTC)) < 0.005 && precedente.dateFacture) {
        alertes.push('Même montant que la facture précédente de ce fournisseur : doublon possible.');
      }
    }
    if (remarque) alertes.push(remarque);
    return { alerte: alertes.length ? alertes.join(' ') : null, variationPct };
  }

  // ─── Lecture, modification, export ────────────────────────────────────────

  async liste(accountId: string) {
    const [abonnement, factures] = await Promise.all([
      this.abonnement(accountId),
      this.prisma.factureFournisseur.findMany({
        where: { accountId },
        orderBy: [{ dateFacture: 'desc' }, { createdAt: 'desc' }],
        take: 500,
        include: { enveloppe: { select: { id: true, nom: true } }, validations: { select: { userId: true } } },
      }),
    ]);
    const reglages = await this.frais.reglages(accountId);
    const annee = new Date().getFullYear();
    const cetteAnnee = factures.filter((f) => (f.dateFacture ?? f.createdAt).getFullYear() === annee);
    const somme = (l: typeof factures) => l.reduce((t, f) => t + Number(f.montantTTC), 0);
    const parPoste = new Map<string, number>();
    const parFournisseur = new Map<string, number>();
    const parMois = Array.from({ length: 12 }, () => 0);
    for (const f of cetteAnnee) {
      const m = Number(f.montantTTC);
      parPoste.set(f.poste ?? 'Sans poste', (parPoste.get(f.poste ?? 'Sans poste') ?? 0) + m);
      parFournisseur.set(f.fournisseur, (parFournisseur.get(f.fournisseur) ?? 0) + m);
      parMois[(f.dateFacture ?? f.createdAt).getMonth()] += m;
    }
    return {
      abonnement,
      postes: POSTES,
      resume: {
        annee,
        total: somme(cetteAnnee),
        nombre: cetteAnnee.length,
        aVerifier: factures.filter((f) => f.statut === 'A_VERIFIER').length,
        aPayer: factures.filter((f) => f.statut !== 'PAYEE').reduce((t, f) => t + Number(f.montantTTC), 0),
        alertes: factures.filter((f) => f.alerte).length,
        parPoste: [...parPoste.entries()].map(([poste, total]) => ({ poste, total })).sort((a, b) => b.total - a.total),
        parFournisseur: [...parFournisseur.entries()]
          .map(([fournisseur, total]) => ({ fournisseur, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10),
        parMois,
        seuilDoubleValidation: reglages.seuilDoubleValidation,
      },
      factures: factures.map((f) => ({
        ...this.presenter(f),
        enveloppe: f.enveloppe ? { id: f.enveloppe.id, nom: f.enveloppe.nom } : null,
        validations: f.validations.length,
        validationsRequises: reglages.seuilDoubleValidation !== null && Number(f.montantTTC) >= reglages.seuilDoubleValidation ? 2 : 1,
      })),
    };
  }

  async saisir(
    accountId: string,
    dto: { fournisseur: string; montantTTC: number; dateFacture?: string; poste?: string; numero?: string; notes?: string; enveloppeId?: string | null },
  ) {
    await this.exigerActif(accountId);
    const { alerte, variationPct } = await this.comparer(accountId, dto.fournisseur, dto.montantTTC, null);
    const f = await this.prisma.factureFournisseur.create({
      data: {
        accountId,
        fournisseur: dto.fournisseur.slice(0, 120),
        montantTTC: dto.montantTTC,
        dateFacture: dto.dateFacture ? new Date(dto.dateFacture) : null,
        poste: dto.poste && (POSTES as readonly string[]).includes(dto.poste) ? dto.poste : null,
        numero: dto.numero?.slice(0, 60) ?? null,
        notes: dto.notes?.slice(0, 1000) ?? null,
        enveloppeId: dto.enveloppeId || null,
        alerte,
        variationPct,
        origine: 'main',
        statut: 'VALIDEE',
      },
    });
    return this.presenter(f);
  }

  async modifier(
    accountId: string,
    id: string,
    dto: {
      fournisseur?: string;
      numero?: string;
      dateFacture?: string | null;
      dateEcheance?: string | null;
      montantHT?: number | null;
      tva?: number | null;
      montantTTC?: number;
      poste?: string | null;
      statut?: StatutFactureFournisseur;
      notes?: string | null;
      enveloppeId?: string | null;
      accepterRib?: boolean;
    },
    userId?: string,
  ) {
    await this.exigerActif(accountId);
    const existante = await this.prisma.factureFournisseur.findFirst({ where: { id, accountId } });
    if (!existante) throw new NotFoundException('Facture introuvable.');
    const data: Prisma.FactureFournisseurUpdateInput = {};
    if (dto.fournisseur !== undefined) data.fournisseur = dto.fournisseur.slice(0, 120);
    if (dto.numero !== undefined) data.numero = dto.numero?.slice(0, 60) ?? null;
    if (dto.dateFacture !== undefined) data.dateFacture = dto.dateFacture ? new Date(dto.dateFacture) : null;
    if (dto.dateEcheance !== undefined) data.dateEcheance = dto.dateEcheance ? new Date(dto.dateEcheance) : null;
    if (dto.montantHT !== undefined) data.montantHT = dto.montantHT;
    if (dto.tva !== undefined) data.tva = dto.tva;
    if (dto.montantTTC !== undefined) data.montantTTC = dto.montantTTC;
    if (dto.poste !== undefined) data.poste = dto.poste && (POSTES as readonly string[]).includes(dto.poste) ? dto.poste : null;
    if (dto.statut !== undefined) data.statut = dto.statut;
    if (dto.notes !== undefined) data.notes = dto.notes?.slice(0, 1000) ?? null;
    if (dto.enveloppeId !== undefined) {
      const env = dto.enveloppeId ? await this.prisma.enveloppeFactures.findFirst({ where: { id: dto.enveloppeId, accountId }, select: { id: true } }) : null;
      data.enveloppe = env ? { connect: { id: env.id } } : { disconnect: true };
    }
    if (dto.accepterRib) await this.fournisseurs.accepterRib(accountId, id);
    // Une relecture humaine efface l'alerte du moteur : c'est elle qui fait foi.
    if (dto.statut && dto.statut !== 'A_VERIFIER' && existante.statut === 'A_VERIFIER') data.alerte = null;
    const f = await this.prisma.factureFournisseur.update({ where: { id }, data });
    await this.frais.journaliser(accountId, userId ?? null, 'facture.modifiee', id, { champs: Object.keys(dto) });
    return this.presenter(f);
  }

  async supprimer(accountId: string, userId: string, role: string, id: string) {
    await this.exigerActif(accountId);
    const f = await this.prisma.factureFournisseur.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException('Facture introuvable.');
    await this.prisma.factureFournisseur.delete({ where: { id } });
    if (f.fileId) await this.files.supprimer(f.fileId, userId, role as never).catch(() => undefined);
    await this.frais.journaliser(accountId, userId, 'facture.supprimee', id, { fournisseur: f.fournisseur, montantTTC: Number(f.montantTTC) });
    return { ok: true };
  }

  /** L'export pour l'expert-comptable : CSV, séparateur point-virgule, décimales à la française. */
  async exportCsv(accountId: string, annee?: number): Promise<string> {
    await this.exigerActif(accountId);
    const factures = await this.prisma.factureFournisseur.findMany({
      where: { accountId },
      orderBy: [{ dateFacture: 'asc' }, { createdAt: 'asc' }],
    });
    const lignes = factures.filter((f) => !annee || (f.dateFacture ?? f.createdAt).getFullYear() === annee);
    const fr = (n: Prisma.Decimal | number | null) => (n === null ? '' : String(Number(n).toFixed(2)).replace('.', ','));
    const date = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const entete = ['Date', 'Échéance', 'Fournisseur', 'Numéro', 'Poste', 'HT', 'TVA', 'TTC', 'Statut', 'Alerte', 'Notes'];
    const corps = lignes.map((f) =>
      [
        date(f.dateFacture),
        date(f.dateEcheance),
        cell(f.fournisseur),
        cell(f.numero ?? ''),
        cell(f.poste ?? ''),
        fr(f.montantHT),
        fr(f.tva),
        fr(f.montantTTC),
        f.statut,
        cell(f.alerte ?? ''),
        cell(f.notes ?? ''),
      ].join(';'),
    );
    return '﻿' + [entete.join(';'), ...corps].join('\r\n');
  }

  private presenter(f: {
    id: string;
    fileId: string | null;
    fournisseur: string;
    numero: string | null;
    dateFacture: Date | null;
    dateEcheance: Date | null;
    montantHT: Prisma.Decimal | null;
    tva: Prisma.Decimal | null;
    montantTTC: Prisma.Decimal;
    devise: string;
    poste: string | null;
    lignes: Prisma.JsonValue | null;
    statut: StatutFactureFournisseur;
    alerte: string | null;
    variationPct: number | null;
    origine: string;
    notes: string | null;
    createdAt: Date;
    siret?: string | null;
    ibanFin?: string | null;
    verification?: Prisma.JsonValue | null;
    enveloppeId?: string | null;
  }) {
    return {
      id: f.id,
      fileId: f.fileId,
      fournisseur: f.fournisseur,
      numero: f.numero,
      dateFacture: f.dateFacture,
      dateEcheance: f.dateEcheance,
      montantHT: f.montantHT === null ? null : Number(f.montantHT),
      tva: f.tva === null ? null : Number(f.tva),
      montantTTC: Number(f.montantTTC),
      devise: f.devise,
      poste: f.poste,
      lignes: Array.isArray(f.lignes) ? f.lignes : [],
      statut: f.statut,
      alerte: f.alerte,
      variationPct: f.variationPct,
      origine: f.origine,
      notes: f.notes,
      deposeLe: f.createdAt,
      siret: f.siret ?? null,
      ibanFin: f.ibanFin ?? null,
      verification: (f.verification as Record<string, unknown> | null) ?? null,
      enveloppeId: f.enveloppeId ?? null,
    };
  }
}
