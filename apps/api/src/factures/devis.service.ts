import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { ExtractionService } from '../assistant/extraction.service';
import { MoteurService } from '../assistant/moteur.service';
import { FraisService } from './frais.service';
import { CONSIGNE_DEVIS, lireAvecMoteur, POSTES } from './lecture';
import { lirePdfFacturX } from './facturx';
import { normaliserNom } from './outils';

/**
 * LES DEVIS FOURNISSEURS, ET LE RAPPROCHEMENT DEVIS ↔ FACTURE.
 *
 * On dépose le devis quand on l'accepte ; il est lu comme une facture. Quand
 * la facture arrive (par l'écran, par e-mail, ou saisie à la main), on cherche
 * le devis EN ATTENTE du même fournisseur au montant le plus proche : à ± 2 %
 * c'est le même document, il passe FACTURÉ ; au-delà, on rapproche quand même
 * (même fournisseur, montant dans les 25 %) mais on écrit l'écart en alerte sur
 * la facture, en clair : « Facture supérieure au devis de 12 % (+ 48,00 €) ».
 * Un devis dont la validité est passée sans facture est signalé dans la liste.
 *
 * ⚠ Le rapprochement ne se fait jamais sur un devis déjà FACTURÉ ou ANNULÉ, et
 * jamais entre deux fournisseurs dont les noms normalisés ne partagent aucun mot.
 */

const TOLERANCE_MEME_DOCUMENT = 0.02;
const TOLERANCE_RAPPROCHEMENT = 0.25;

@Injectable()
export class DevisService {
  private readonly logger = new Logger(DevisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly extraction: ExtractionService,
    private readonly moteur: MoteurService,
    private readonly frais: FraisService,
  ) {}

  async liste(accountId: string) {
    const devis = await this.prisma.devisFournisseur.findMany({
      where: { accountId },
      orderBy: [{ statut: 'asc' }, { dateDevis: 'desc' }, { createdAt: 'desc' }],
      take: 300,
      include: { facture: { select: { id: true, numero: true, montantTTC: true, dateFacture: true, statut: true } } },
    });
    const auj = Date.now();
    const lignes = devis.map((d) => this.presenter(d, auj));
    const enAttente = lignes.filter((d) => d.statut === 'EN_ATTENTE');
    return {
      resume: {
        enAttente: enAttente.length,
        engageSansFacture: r2(enAttente.reduce((t, d) => t + d.montantTTC, 0)),
        perimes: enAttente.filter((d) => d.perime).length,
        ecarts: lignes.filter((d) => d.ecartPct !== null && Math.abs(d.ecartPct) > 2).length,
      },
      devis: lignes,
    };
  }

  async deposer(accountId: string, userId: string, fichier: FichierRecu, poste?: string) {
    const estImage = fichier.mimetype.startsWith('image/');
    const estPdf = fichier.mimetype === 'application/pdf';
    if (!estImage && !estPdf) throw new BadRequestException('Déposez une photo (JPEG, PNG, WebP) ou un PDF du devis.');
    const depose = await this.files.deposer({ fichier, famille: FileKind.COMPLIANCE, userId, accountId });
    const lecture = (estPdf ? lirePdfFacturX(fichier.buffer) : null) ?? (await lireAvecMoteur(this.moteur, this.extraction, fichier, CONSIGNE_DEVIS, this.logger));
    const ttc = lecture.montantTTC ?? lecture.montantHT ?? 0;
    const d = await this.prisma.devisFournisseur.create({
      data: {
        accountId,
        fileId: depose.id,
        fournisseur: (lecture.fournisseur || 'Fournisseur non lu').slice(0, 120),
        reference: lecture.numero?.slice(0, 60) ?? null,
        dateDevis: lecture.dateFacture ? new Date(lecture.dateFacture) : null,
        dateValidite: lecture.dateEcheance ? new Date(lecture.dateEcheance) : null,
        montantHT: lecture.montantHT,
        tva: lecture.tva,
        montantTTC: ttc,
        poste: (poste && (POSTES as readonly string[]).includes(poste) ? poste : lecture.poste) ?? null,
        lignes: lecture.lignes as unknown as Prisma.InputJsonValue,
        alerte: lecture.remarque,
        origine: 'moteur',
      },
    });
    await this.frais.journaliser(accountId, userId, 'devis.depose', d.id, { fournisseur: d.fournisseur, montantTTC: ttc });
    return this.presenter(d, Date.now());
  }

  async saisir(accountId: string, userId: string, dto: { fournisseur: string; montantTTC: number; reference?: string; dateDevis?: string; dateValidite?: string; poste?: string; notes?: string }) {
    const d = await this.prisma.devisFournisseur.create({
      data: {
        accountId,
        fournisseur: dto.fournisseur.slice(0, 120),
        montantTTC: dto.montantTTC,
        reference: dto.reference?.slice(0, 60) ?? null,
        dateDevis: dto.dateDevis ? new Date(dto.dateDevis) : null,
        dateValidite: dto.dateValidite ? new Date(dto.dateValidite) : null,
        poste: dto.poste && (POSTES as readonly string[]).includes(dto.poste) ? dto.poste : null,
        notes: dto.notes?.slice(0, 1000) ?? null,
        origine: 'main',
      },
    });
    await this.frais.journaliser(accountId, userId, 'devis.saisi', d.id, { fournisseur: d.fournisseur, montantTTC: dto.montantTTC });
    return this.presenter(d, Date.now());
  }

  async modifier(accountId: string, userId: string, id: string, dto: { fournisseur?: string; reference?: string | null; dateDevis?: string | null; dateValidite?: string | null; montantTTC?: number; poste?: string | null; statut?: 'EN_ATTENTE' | 'ANNULE'; notes?: string | null; factureId?: string | null }) {
    const d = await this.prisma.devisFournisseur.findFirst({ where: { id, accountId } });
    if (!d) throw new NotFoundException('Devis introuvable.');
    const data: Prisma.DevisFournisseurUncheckedUpdateInput = {};
    if (dto.fournisseur !== undefined) data.fournisseur = dto.fournisseur.slice(0, 120);
    if (dto.reference !== undefined) data.reference = dto.reference?.slice(0, 60) ?? null;
    if (dto.dateDevis !== undefined) data.dateDevis = dto.dateDevis ? new Date(dto.dateDevis) : null;
    if (dto.dateValidite !== undefined) data.dateValidite = dto.dateValidite ? new Date(dto.dateValidite) : null;
    if (dto.montantTTC !== undefined) data.montantTTC = dto.montantTTC;
    if (dto.poste !== undefined) data.poste = dto.poste && (POSTES as readonly string[]).includes(dto.poste) ? dto.poste : null;
    if (dto.notes !== undefined) data.notes = dto.notes?.slice(0, 1000) ?? null;
    if (dto.statut !== undefined) {
      data.statut = dto.statut;
      if (dto.statut === 'EN_ATTENTE') {
        data.factureId = null;
        data.ecartPct = null;
      }
    }
    // Rapprochement À LA MAIN : on désigne la facture, l'écart se calcule.
    if (dto.factureId !== undefined) {
      if (dto.factureId) {
        const f = await this.prisma.factureFournisseur.findFirst({ where: { id: dto.factureId, accountId } });
        if (!f) throw new NotFoundException('Facture introuvable.');
        const dejaPris = await this.prisma.devisFournisseur.findFirst({ where: { factureId: f.id, NOT: { id } }, select: { id: true } });
        if (dejaPris) throw new BadRequestException('Cette facture solde déjà un autre devis.');
        data.factureId = f.id;
        data.statut = 'FACTURE';
        data.ecartPct = ecart(Number(dto.montantTTC ?? d.montantTTC), Number(f.montantTTC));
      } else {
        data.factureId = null;
        data.ecartPct = null;
        data.statut = 'EN_ATTENTE';
      }
    }
    const maj = await this.prisma.devisFournisseur.update({ where: { id }, data });
    await this.frais.journaliser(accountId, userId, 'devis.modifie', id, { champs: Object.keys(dto) });
    return this.presenter(maj, Date.now());
  }

  async supprimer(accountId: string, userId: string, role: string, id: string) {
    const d = await this.prisma.devisFournisseur.findFirst({ where: { id, accountId } });
    if (!d) throw new NotFoundException('Devis introuvable.');
    await this.prisma.devisFournisseur.delete({ where: { id } });
    if (d.fileId) await this.files.supprimer(d.fileId, userId, role as never).catch(() => undefined);
    await this.frais.journaliser(accountId, userId, 'devis.supprime', id, { fournisseur: d.fournisseur });
    return { ok: true };
  }

  /**
   * Appelé à chaque facture qui entre. Rend le devis rapproché et, s'il y a
   * un écart au-delà de 2 %, la phrase à écrire en alerte sur la facture.
   */
  async rapprocherFacture(accountId: string, userId: string | null, facture: { id: string; fournisseur: string; montantTTC: Prisma.Decimal | number }) {
    const ttc = Number(facture.montantTTC);
    if (!(ttc > 0)) return null;
    const candidats = await this.prisma.devisFournisseur.findMany({ where: { accountId, statut: 'EN_ATTENTE', factureId: null } });
    const motsF = mots(facture.fournisseur);
    let meilleur: { d: (typeof candidats)[number]; distance: number } | null = null;
    for (const d of candidats) {
      const m = mots(d.fournisseur);
      if (!m.some((x) => motsF.includes(x))) continue;
      const montant = Number(d.montantTTC);
      if (!(montant > 0)) continue;
      const distance = Math.abs(ttc - montant) / montant;
      if (distance > TOLERANCE_RAPPROCHEMENT) continue;
      if (!meilleur || distance < meilleur.distance) meilleur = { d, distance };
    }
    if (!meilleur) return null;
    const pct = ecart(Number(meilleur.d.montantTTC), ttc);
    const maj = await this.prisma.devisFournisseur.update({ where: { id: meilleur.d.id }, data: { factureId: facture.id, statut: 'FACTURE', ecartPct: pct } });
    await this.frais.journaliser(accountId, userId, 'devis.rapproche', maj.id, { factureId: facture.id, ecartPct: pct });
    const difference = r2(ttc - Number(meilleur.d.montantTTC));
    const alerte =
      meilleur.distance > TOLERANCE_MEME_DOCUMENT
        ? `Facture ${difference > 0 ? 'supérieure' : 'inférieure'} au devis ${maj.reference ?? ''} de ${Math.abs(pct)} % (${difference > 0 ? '+' : '−'} ${Math.abs(difference).toFixed(2)} €).`
        : null;
    return { devis: this.presenter(maj, Date.now()), alerte };
  }

  private presenter(d: {
    id: string;
    fileId: string | null;
    fournisseur: string;
    reference: string | null;
    dateDevis: Date | null;
    dateValidite: Date | null;
    montantHT: Prisma.Decimal | null;
    tva: Prisma.Decimal | null;
    montantTTC: Prisma.Decimal;
    poste: string | null;
    lignes: Prisma.JsonValue | null;
    statut: string;
    factureId: string | null;
    ecartPct: number | null;
    alerte: string | null;
    origine: string;
    notes: string | null;
    createdAt: Date;
    facture?: { id: string; numero: string | null; montantTTC: Prisma.Decimal; dateFacture: Date | null; statut: string } | null;
  }, auj: number) {
    const perime = d.statut === 'EN_ATTENTE' && !!d.dateValidite && d.dateValidite.getTime() < auj;
    return {
      id: d.id,
      fileId: d.fileId,
      fournisseur: d.fournisseur,
      reference: d.reference,
      dateDevis: d.dateDevis,
      dateValidite: d.dateValidite,
      montantHT: d.montantHT === null ? null : Number(d.montantHT),
      tva: d.tva === null ? null : Number(d.tva),
      montantTTC: Number(d.montantTTC),
      poste: d.poste,
      lignes: Array.isArray(d.lignes) ? d.lignes : [],
      statut: d.statut as 'EN_ATTENTE' | 'FACTURE' | 'ANNULE',
      factureId: d.factureId,
      facture: d.facture ? { id: d.facture.id, numero: d.facture.numero, montantTTC: Number(d.facture.montantTTC), dateFacture: d.facture.dateFacture, statut: d.facture.statut } : null,
      ecartPct: d.ecartPct,
      alerte: d.alerte,
      origine: d.origine,
      notes: d.notes,
      deposeLe: d.createdAt,
      perime,
    };
  }
}

function mots(nom: string) {
  return normaliserNom(nom).split(' ').filter((m) => m.length >= 3);
}

/** L'écart facture − devis, en pour cent du devis, arrondi. */
export function ecart(devis: number, facture: number): number {
  if (!(devis > 0)) return 0;
  return Math.round(((facture - devis) / devis) * 100);
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}
