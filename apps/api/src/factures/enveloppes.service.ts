import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TypeEnveloppe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { classeur, type Feuille } from './xlsx';

/**
 * LES ENVELOPPES : ce qu'une facture consomme.
 *
 * Une association vit par enveloppes (la subvention CAF, la subvention Ville,
 * le FDVA, les fonds propres) ; un organisme de formation par sessions. Une
 * facture rattachée à une enveloppe donne le RESTANT, l'alerte quand
 * l'enveloppe s'épuise ou que la date de justification approche, et le compte
 * rendu financier au format que les financeurs demandent (rubriques du Cerfa
 * de compte rendu financier de subvention).
 *
 * Les enveloppes peuvent être importées de ce que Pilote connaît déjà : les
 * dossiers de financement accordés (association) et les cours (académie).
 */

/** Les rubriques du Cerfa 15059 (compte rendu financier), côté charges. */
const RUBRIQUES_CERFA: Record<string, string> = {
  'Matériel et fournitures': '60 · Achats',
  'Alimentation et réception': '60 · Achats',
  'Loyer et charges': '61 · Services extérieurs',
  Assurance: '61 · Services extérieurs',
  'Logiciels et abonnements': '61 · Services extérieurs',
  'Prestations et sous-traitance': '62 · Autres services extérieurs',
  Communication: '62 · Autres services extérieurs',
  Déplacements: '62 · Autres services extérieurs',
  'Frais bancaires': '62 · Autres services extérieurs',
  'Formation et formateurs': '62 · Autres services extérieurs',
  Autre: '65 · Autres charges',
  'Sans poste': '65 · Autres charges',
};

export function rubriqueCerfa(poste: string | null) {
  return RUBRIQUES_CERFA[poste ?? 'Sans poste'] ?? '65 · Autres charges';
}

export interface EnveloppeDto {
  nom: string;
  type?: TypeEnveloppe;
  financeur?: string | null;
  montantAccorde?: number | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  dateJustification?: string | null;
  dateVersementPrevu?: string | null;
  notes?: string | null;
  dossierId?: string | null;
  actionId?: string | null;
  coursId?: string | null;
}

@Injectable()
export class EnveloppesService {
  constructor(private readonly prisma: PrismaService) {}

  async liste(accountId: string) {
    const [enveloppes, factures, frais] = await Promise.all([
      this.prisma.enveloppeFactures.findMany({ where: { accountId }, orderBy: [{ type: 'asc' }, { dateFin: 'asc' }, { nom: 'asc' }] }),
      this.prisma.factureFournisseur.findMany({ where: { accountId, enveloppeId: { not: null } }, select: { enveloppeId: true, montantTTC: true, statut: true } }),
      this.prisma.noteDeFrais.findMany({ where: { accountId, enveloppeId: { not: null }, statut: { in: ['VALIDEE', 'REMBOURSEE', 'ABANDONNEE'] } }, select: { enveloppeId: true, montant: true } }),
    ]);
    const auj = Date.now();
    return enveloppes.map((e) => {
      const fs = factures.filter((f) => f.enveloppeId === e.id);
      const engage = fs.reduce((t, f) => t + Number(f.montantTTC), 0) + frais.filter((n) => n.enveloppeId === e.id).reduce((t, n) => t + Number(n.montant), 0);
      const paye = fs.filter((f) => f.statut === 'PAYEE').reduce((t, f) => t + Number(f.montantTTC), 0);
      const accorde = e.montantAccorde === null ? null : Number(e.montantAccorde);
      const restant = accorde === null ? null : Math.round((accorde - engage) * 100) / 100;
      const alertes: string[] = [];
      if (accorde !== null && accorde > 0 && restant !== null && restant / accorde <= 0.2) alertes.push(restant < 0 ? 'Enveloppe dépassée.' : 'Moins de 20 % restants.');
      if (e.dateJustification) {
        const jours = Math.ceil((e.dateJustification.getTime() - auj) / 86_400_000);
        if (jours < 0) alertes.push('Date de justification dépassée.');
        else if (jours <= 30) alertes.push(`Compte rendu à rendre dans ${jours} jour${jours > 1 ? 's' : ''}.`);
      }
      return {
        id: e.id,
        nom: e.nom,
        type: e.type,
        financeur: e.financeur,
        montantAccorde: accorde,
        engage: Math.round(engage * 100) / 100,
        paye: Math.round(paye * 100) / 100,
        restant,
        pourcentage: accorde ? Math.min(100, Math.round((engage / accorde) * 100)) : null,
        nombreFactures: fs.length,
        dateDebut: e.dateDebut,
        dateFin: e.dateFin,
        dateJustification: e.dateJustification,
        dateVersementPrevu: e.dateVersementPrevu,
        dossierId: e.dossierId,
        actionId: e.actionId,
        coursId: e.coursId,
        notes: e.notes,
        alertes,
      };
    });
  }

  async creer(accountId: string, dto: EnveloppeDto) {
    if (!dto.nom?.trim()) throw new BadRequestException('Un nom est nécessaire.');
    return this.prisma.enveloppeFactures.create({ data: { accountId, ...(this.donnees(dto) as Omit<Prisma.EnveloppeFacturesUncheckedCreateInput, 'accountId'>) } });
  }

  async modifier(accountId: string, id: string, dto: Partial<EnveloppeDto>) {
    const e = await this.prisma.enveloppeFactures.findFirst({ where: { id, accountId } });
    if (!e) throw new NotFoundException('Enveloppe introuvable.');
    return this.prisma.enveloppeFactures.update({ where: { id }, data: this.donnees(dto, true) });
  }

  async supprimer(accountId: string, id: string) {
    const e = await this.prisma.enveloppeFactures.findFirst({ where: { id, accountId } });
    if (!e) throw new NotFoundException('Enveloppe introuvable.');
    // Les factures restent : elles perdent seulement leur rattachement (SetNull).
    await this.prisma.enveloppeFactures.delete({ where: { id } });
    return { ok: true };
  }

  private donnees(dto: Partial<EnveloppeDto>, partiel = false): Prisma.EnveloppeFacturesUncheckedUpdateInput {
    const d: Prisma.EnveloppeFacturesUncheckedUpdateInput = {};
    const date = (v: string | null | undefined) => (v ? new Date(v) : null);
    if (dto.nom !== undefined) d.nom = dto.nom.trim().slice(0, 120);
    if (dto.type !== undefined) d.type = dto.type;
    if (dto.financeur !== undefined) d.financeur = dto.financeur?.trim().slice(0, 120) || null;
    if (dto.montantAccorde !== undefined) d.montantAccorde = dto.montantAccorde === null ? null : dto.montantAccorde;
    if (dto.dateDebut !== undefined) d.dateDebut = date(dto.dateDebut);
    if (dto.dateFin !== undefined) d.dateFin = date(dto.dateFin);
    if (dto.dateJustification !== undefined) d.dateJustification = date(dto.dateJustification);
    if (dto.dateVersementPrevu !== undefined) d.dateVersementPrevu = date(dto.dateVersementPrevu);
    if (dto.notes !== undefined) d.notes = dto.notes?.slice(0, 2000) || null;
    if (dto.dossierId !== undefined) d.dossierId = dto.dossierId || null;
    if (dto.actionId !== undefined) d.actionId = dto.actionId || null;
    if (dto.coursId !== undefined) d.coursId = dto.coursId || null;
    if (!partiel && d.type === undefined) d.type = 'SUBVENTION';
    return d;
  }

  /**
   * Importe ce que Pilote connaît déjà : les subventions accordées du module
   * « Financeurs » (association) et les cours (académie). Idempotent : une
   * enveloppe déjà liée n'est pas recréée.
   */
  async importer(accountId: string) {
    const existantes = await this.prisma.enveloppeFactures.findMany({ where: { accountId }, select: { dossierId: true, coursId: true } });
    const dossiersLies = new Set(existantes.map((e) => e.dossierId).filter(Boolean));
    const coursLies = new Set(existantes.map((e) => e.coursId).filter(Boolean));
    let creees = 0;
    const org = await this.prisma.organisation.findUnique({ where: { accountId }, select: { id: true } });
    if (org) {
      const dossiers = await this.prisma.dossierFinancement.findMany({
        where: { organisationId: org.id, etat: { in: ['ACCORDE', 'SOLDE'] } },
      });
      for (const d of dossiers) {
        if (dossiersLies.has(d.id)) continue;
        await this.prisma.enveloppeFactures.create({
          data: {
            accountId,
            nom: d.intitule,
            type: d.nature === 'APPEL_A_PROJET' ? 'PROJET' : 'SUBVENTION',
            financeur: d.financeur,
            montantAccorde: d.montantAccorde,
            dateJustification: d.dateCompteRendu,
            dossierId: d.id,
          },
        });
        creees++;
      }
    }
    const cours = await this.prisma.cours.findMany({ where: { accountId }, select: { id: true, titre: true } }).catch(() => []);
    for (const c of cours) {
      if (coursLies.has(c.id)) continue;
      await this.prisma.enveloppeFactures.create({ data: { accountId, nom: c.titre, type: 'SESSION', coursId: c.id } });
      creees++;
    }
    return { creees };
  }

  /** Le compte rendu financier d'une enveloppe : un classeur avec la synthèse par rubrique Cerfa et le détail des pièces. */
  async compteRendu(accountId: string, id: string, supplementaires: Feuille[] = []): Promise<{ nom: string; fichier: Buffer }> {
    const e = await this.prisma.enveloppeFactures.findFirst({ where: { id, accountId } });
    if (!e) throw new NotFoundException('Enveloppe introuvable.');
    const [factures, frais, compte] = await Promise.all([
      this.prisma.factureFournisseur.findMany({ where: { accountId, enveloppeId: id }, orderBy: [{ dateFacture: 'asc' }] }),
      this.prisma.noteDeFrais.findMany({ where: { accountId, enveloppeId: id, statut: { in: ['VALIDEE', 'REMBOURSEE', 'ABANDONNEE'] } }, orderBy: { date: 'asc' } }),
      this.prisma.account.findUnique({ where: { id: accountId }, select: { name: true, siret: true } }),
    ]);
    const parRubrique = new Map<string, number>();
    for (const f of factures) parRubrique.set(rubriqueCerfa(f.poste), (parRubrique.get(rubriqueCerfa(f.poste)) ?? 0) + Number(f.montantTTC));
    for (const n of frais) parRubrique.set(rubriqueCerfa(n.poste), (parRubrique.get(rubriqueCerfa(n.poste)) ?? 0) + Number(n.montant));
    const total = [...parRubrique.values()].reduce((a, b) => a + b, 0);
    const accorde = e.montantAccorde === null ? null : Number(e.montantAccorde);
    const synthese: Feuille = {
      nom: 'Compte rendu financier',
      colonnes: [44, 18, 18],
      gras: [0, 2, 3, 5],
      lignes: [
        ['Compte rendu financier', e.nom, ''],
        ['Structure', compte?.name ?? '', compte?.siret ?? ''],
        ['Financeur', e.financeur ?? '', ''],
        ['Montant accordé', accorde, ''],
        ['Période', e.dateDebut ? { d: e.dateDebut } : '', e.dateFin ? { d: e.dateFin } : ''],
        ['Charges par rubrique (Cerfa 15059)', 'Réalisé', 'Nombre de pièces'],
        ...[...parRubrique.entries()].sort().map(([r, m]) => [r, Math.round(m * 100) / 100, factures.filter((f) => rubriqueCerfa(f.poste) === r).length + frais.filter((n) => rubriqueCerfa(n.poste) === r).length]),
        ['Total des charges justifiées', Math.round(total * 100) / 100, factures.length + frais.length],
        ['Restant sur l’enveloppe', accorde === null ? '' : Math.round((accorde - total) * 100) / 100, ''],
        ['', '', ''],
        ['Établi le', { d: new Date() }, 'par Pilote, Mes factures'],
      ],
    };
    const pieces: Feuille = {
      nom: 'Pièces justificatives',
      colonnes: [12, 30, 16, 30, 28, 12, 12, 12, 12],
      lignes: [
        ['Date', 'Fournisseur ou bénéficiaire', 'Numéro', 'Poste', 'Rubrique Cerfa', 'HT', 'TVA', 'TTC', 'Statut'],
        ...factures.map((f) => [
          f.dateFacture ? { d: f.dateFacture } : '',
          f.fournisseur,
          f.numero ?? '',
          f.poste ?? '',
          rubriqueCerfa(f.poste),
          f.montantHT === null ? '' : Number(f.montantHT),
          f.tva === null ? '' : Number(f.tva),
          Number(f.montantTTC),
          f.statut,
        ]),
        ...frais.map((n) => [{ d: n.date }, `Note de frais · ${n.beneficiaire}`, '', n.poste ?? '', rubriqueCerfa(n.poste), '', '', Number(n.montant), n.abandon ? 'Abandon de frais' : n.statut]),
        ['Total', '', '', '', '', '', '', { f: `SUM(H2:H${factures.length + frais.length + 1})` }, ''],
      ],
    };
    return { nom: `compte-rendu-${e.nom.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()}.xlsx`, fichier: classeur([synthese, ...supplementaires, pieces]) };
  }
}
