import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { ExtractionService } from '../assistant/extraction.service';
import { MoteurService } from '../assistant/moteur.service';
import { devinerPoste, empreinteOperation, lireCsvReleve, natureRecette, scoreRapprochement, sensOperation, type LigneReleve } from './outils';
import { POSTES } from './factures.service';

/**
 * LE RELEVÉ DE COMPTE MENSUEL.
 *
 * On dépose le relevé (CSV exporté de la banque, ou PDF), chaque ligne devient
 * une opération. Puis trois choses, dans l'ordre :
 *  1. le RAPPROCHEMENT : une sortie qui a le montant d'une facture connue, à
 *     une date qui colle, est rattachée à la facture, qui passe « payée » ;
 *  2. le CLASSEMENT : les sorties sans facture reçoivent un poste (mots-clés,
 *     puis le moteur pour ce qui reste), les entrées une nature (subvention,
 *     cotisations, dons, ventes) ;
 *  3. le BUDGET RÉALISÉ : factures + opérations non rapprochées = ce que
 *     l'année a vraiment coûté, poste par poste, sans double compte.
 *
 * Aucune connexion bancaire : un fichier, jamais un identifiant.
 */

const CONSIGNE_PDF = `Tu lis un relevé de compte bancaire français. Réponds UNIQUEMENT par un JSON :
{"periodeDebut":"AAAA-MM-JJ"|null,"periodeFin":"AAAA-MM-JJ"|null,"soldeDebut":number|null,"soldeFin":number|null,
 "operations":[{"date":"AAAA-MM-JJ","libelle":string,"montant":number}]}
Règles : montant SIGNÉ (négatif pour un débit, positif pour un crédit), nombres décimaux avec un point ; une ligne par opération ; ne rien inventer.`;

const CONSIGNE_POSTES = (libelles: string[]) => `Classe chaque libellé d'opération bancaire d'une association ou d'un organisme de formation dans l'un de ces postes :
${POSTES.map((p) => `"${p}"`).join(', ')}.
Réponds UNIQUEMENT par un tableau JSON de chaînes, dans le même ordre que les libellés, avec exactement ${libelles.length} éléments.
Libellés :
${libelles.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;

@Injectable()
export class RelevesService {
  private readonly logger = new Logger(RelevesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly extraction: ExtractionService,
    private readonly moteur: MoteurService,
  ) {}

  async deposer(accountId: string, userId: string, fichier: FichierRecu) {
    const type = fichier.mimetype;
    const nom = fichier.originalname.toLowerCase();
    const estCsv = type.includes('csv') || type === 'text/plain' || nom.endsWith('.csv') || nom.endsWith('.txt');
    const estPdf = type === 'application/pdf' || nom.endsWith('.pdf');
    if (!estCsv && !estPdf) throw new BadRequestException('Déposez le relevé en CSV (export de la banque) ou en PDF.');

    let lignes: LigneReleve[] = [];
    let entete: { periodeDebut: string | null; periodeFin: string | null; soldeDebut: number | null; soldeFin: number | null } = {
      periodeDebut: null,
      periodeFin: null,
      soldeDebut: null,
      soldeFin: null,
    };
    if (estCsv) {
      lignes = lireCsvReleve(fichier.buffer.toString('utf8').replace(/\u0000/g, '') || fichier.buffer.toString('latin1'));
      if (!lignes.length) lignes = lireCsvReleve(fichier.buffer.toString('latin1'));
    } else {
      const lu = await this.lirePdf(fichier);
      lignes = lu.operations;
      entete = lu;
    }
    if (!lignes.length) throw new BadRequestException("Aucune opération lisible dans ce relevé : vérifiez l'export (une ligne par opération, avec date, libellé et montant).");

    // Le PDF de la banque va au coffre (pièce probante) ; un export CSV n'est
    // qu'une table, ses lignes sont les opérations elles-mêmes : on ne le garde pas.
    const depose = estPdf ? await this.files.deposer({ fichier, famille: FileKind.COMPLIANCE, userId, accountId }) : null;
    const dates = lignes.map((l) => l.date).sort();
    const releve = await this.prisma.releveBancaire.create({
      data: {
        accountId,
        fileId: depose?.id ?? null,
        libelle: fichier.originalname.slice(0, 120),
        periodeDebut: new Date(entete.periodeDebut ?? dates[0]),
        periodeFin: new Date(entete.periodeFin ?? dates[dates.length - 1]),
        soldeDebut: entete.soldeDebut,
        soldeFin: entete.soldeFin,
      },
    });

    // Les opérations, sans doublon (empreinte unique par compte).
    let creees = 0;
    const nouvelles: { id: string; date: Date; libelle: string; montant: number; sens: string }[] = [];
    for (const l of lignes) {
      const empreinte = empreinteOperation(accountId, l.date, l.libelle, l.montant);
      const sens = sensOperation(l.montant, l.libelle);
      try {
        const op = await this.prisma.operationBancaire.create({
          data: { accountId, releveId: releve.id, date: new Date(l.date), libelle: l.libelle, montant: l.montant, sens, empreinte, poste: sens === 'RECETTE' ? natureRecette(l.libelle) : devinerPoste(l.libelle) },
        });
        nouvelles.push({ id: op.id, date: op.date, libelle: op.libelle, montant: l.montant, sens });
        creees++;
      } catch (err) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      }
    }
    await this.prisma.releveBancaire.update({ where: { id: releve.id }, data: { nbOperations: creees } });

    const rapprochees = await this.rapprocher(accountId, nouvelles);
    const classees = await this.classerParMoteur(accountId, nouvelles.filter((o) => o.sens === 'DEPENSE'));
    return { releveId: releve.id, operations: creees, doublonsIgnores: lignes.length - creees, rapprochees, classeesParMoteur: classees };
  }

  private async lirePdf(fichier: FichierRecu) {
    const vide = { periodeDebut: null, periodeFin: null, soldeDebut: null, soldeFin: null, operations: [] as LigneReleve[] };
    const options: { system: string; user: string; maxTokens: number; temperature: number; pieces?: { mimeType: string; base64: string }[] } = {
      system: CONSIGNE_PDF,
      user: '',
      maxTokens: 6000,
      temperature: 0,
    };
    let texte = '';
    try {
      texte = await this.extraction.extraire(fichier.buffer, 'application/pdf', fichier.originalname);
    } catch {
      texte = '';
    }
    if (texte.length >= 200) options.user = `Voici le texte du relevé :\n\n${texte.slice(0, 40_000)}`;
    else {
      options.user = 'Voici le relevé en PDF. Lis-le et réponds en JSON.';
      options.pieces = [{ mimeType: 'application/pdf', base64: fichier.buffer.toString('base64') }];
    }
    let brut = '';
    try {
      brut = await this.moteur.completer(options);
    } catch (err) {
      this.logger.warn(`Lecture de relevé impossible : ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException("Le moteur n'a pas pu lire ce relevé. Essayez l'export CSV de votre banque.");
    }
    const a = brut.indexOf('{');
    const b = brut.lastIndexOf('}');
    if (a < 0 || b < a) return vide;
    try {
      const j = JSON.parse(brut.slice(a, b + 1)) as { periodeDebut?: unknown; periodeFin?: unknown; soldeDebut?: unknown; soldeFin?: unknown; operations?: unknown[] };
      const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
      const operations = (Array.isArray(j.operations) ? j.operations : [])
        .map((o) => {
          const x = o as { date?: unknown; libelle?: unknown; montant?: unknown };
          const d = date(x.date);
          const m = num(x.montant);
          return d && m !== null && m !== 0 ? { date: d, libelle: typeof x.libelle === 'string' ? x.libelle.slice(0, 200) : '', montant: m } : null;
        })
        .filter((o): o is LigneReleve => o !== null);
      return { periodeDebut: date(j.periodeDebut), periodeFin: date(j.periodeFin), soldeDebut: num(j.soldeDebut), soldeFin: num(j.soldeFin), operations };
    } catch {
      return vide;
    }
  }

  /** Les sorties qui ont le montant d'une facture non rapprochée, à une date qui colle. */
  private async rapprocher(accountId: string, ops: { id: string; date: Date; libelle: string; montant: number; sens: string }[]) {
    const sorties = ops.filter((o) => o.sens === 'DEPENSE');
    if (!sorties.length) return 0;
    const factures = await this.prisma.factureFournisseur.findMany({
      where: { accountId, operations: { none: {} } },
      select: { id: true, fournisseur: true, montantTTC: true, dateFacture: true, dateEcheance: true, statut: true, enveloppeId: true, poste: true },
    });
    const prises = new Set<string>();
    let n = 0;
    for (const op of sorties) {
      let meilleure: { id: string; score: number; enveloppeId: string | null; poste: string | null } | null = null;
      for (const f of factures) {
        if (prises.has(f.id)) continue;
        const score = scoreRapprochement(op, { fournisseur: f.fournisseur, montantTTC: Number(f.montantTTC), dateFacture: f.dateFacture, dateEcheance: f.dateEcheance });
        if (score >= 2 && (!meilleure || score > meilleure.score)) meilleure = { id: f.id, score, enveloppeId: f.enveloppeId, poste: f.poste };
      }
      if (!meilleure) continue;
      prises.add(meilleure.id);
      await this.prisma.$transaction([
        this.prisma.operationBancaire.update({ where: { id: op.id }, data: { factureId: meilleure.id, rapprochement: 'AUTO', enveloppeId: meilleure.enveloppeId, poste: meilleure.poste } }),
        this.prisma.factureFournisseur.update({ where: { id: meilleure.id }, data: { statut: 'PAYEE' } }),
      ]);
      n++;
    }
    return n;
  }

  /** Les sorties sans poste : le moteur classe par lots de 40 libellés. Un échec laisse « Autre » à la relecture. */
  private async classerParMoteur(accountId: string, ops: { id: string; libelle: string }[]) {
    const sans = await this.prisma.operationBancaire.findMany({ where: { accountId, id: { in: ops.map((o) => o.id) }, poste: null, factureId: null }, select: { id: true, libelle: true } });
    let n = 0;
    for (let i = 0; i < sans.length; i += 40) {
      const lot = sans.slice(i, i + 40);
      let brut = '';
      try {
        brut = await this.moteur.completer({ system: 'Tu classes des opérations bancaires. Réponds en JSON strict.', user: CONSIGNE_POSTES(lot.map((o) => o.libelle)), maxTokens: 1500, temperature: 0 });
      } catch {
        continue;
      }
      const a = brut.indexOf('[');
      const b = brut.lastIndexOf(']');
      if (a < 0 || b < a) continue;
      let postes: unknown;
      try {
        postes = JSON.parse(brut.slice(a, b + 1));
      } catch {
        continue;
      }
      if (!Array.isArray(postes)) continue;
      for (let k = 0; k < lot.length; k++) {
        const p = postes[k];
        if (typeof p === 'string' && (POSTES as readonly string[]).includes(p)) {
          await this.prisma.operationBancaire.update({ where: { id: lot[k].id }, data: { poste: p } });
          n++;
        }
      }
    }
    return n;
  }

  async liste(accountId: string, annee?: number) {
    const a = annee ?? new Date().getFullYear();
    const [releves, operations] = await Promise.all([
      this.prisma.releveBancaire.findMany({ where: { accountId }, orderBy: { periodeDebut: 'desc' }, take: 60 }),
      this.prisma.operationBancaire.findMany({
        where: { accountId, date: { gte: new Date(`${a}-01-01`), lt: new Date(`${a + 1}-01-01`) } },
        orderBy: { date: 'desc' },
        include: { facture: { select: { id: true, fournisseur: true, numero: true } } },
        take: 2000,
      }),
    ]);
    const recettes = operations.filter((o) => o.sens === 'RECETTE');
    const depenses = operations.filter((o) => o.sens === 'DEPENSE');
    const somme = (l: typeof operations) => Math.round(l.reduce((t, o) => t + Math.abs(Number(o.montant)), 0) * 100) / 100;
    const parNature = new Map<string, number>();
    for (const r of recettes) parNature.set(r.poste ?? 'Autres recettes', (parNature.get(r.poste ?? 'Autres recettes') ?? 0) + Number(r.montant));
    const parMois = { recettes: Array.from({ length: 12 }, () => 0), depenses: Array.from({ length: 12 }, () => 0) };
    for (const o of operations) parMois[o.sens === 'RECETTE' ? 'recettes' : 'depenses'][o.date.getMonth()] += Math.abs(Number(o.montant));
    return {
      annee: a,
      releves: releves.map((r) => ({ id: r.id, libelle: r.libelle, periodeDebut: r.periodeDebut, periodeFin: r.periodeFin, soldeDebut: r.soldeDebut === null ? null : Number(r.soldeDebut), soldeFin: r.soldeFin === null ? null : Number(r.soldeFin), nbOperations: r.nbOperations, deposeLe: r.createdAt })),
      resume: {
        recettes: somme(recettes),
        depenses: somme(depenses),
        rapprochees: depenses.filter((o) => o.factureId).length,
        sansFacture: depenses.filter((o) => !o.factureId).length,
        sansPoste: depenses.filter((o) => !o.factureId && !o.poste).length,
        parNature: [...parNature.entries()].map(([nature, total]) => ({ nature, total: Math.round(total * 100) / 100 })).sort((x, y) => y.total - x.total),
        parMois,
      },
      operations: operations.map((o) => ({
        id: o.id,
        date: o.date,
        libelle: o.libelle,
        montant: Number(o.montant),
        sens: o.sens,
        poste: o.poste,
        enveloppeId: o.enveloppeId,
        rapprochement: o.rapprochement,
        facture: o.facture ? { id: o.facture.id, fournisseur: o.facture.fournisseur, numero: o.facture.numero } : null,
      })),
    };
  }

  async modifierOperation(accountId: string, id: string, dto: { poste?: string | null; enveloppeId?: string | null; factureId?: string | null }) {
    const op = await this.prisma.operationBancaire.findFirst({ where: { id, accountId } });
    if (!op) throw new NotFoundException('Opération introuvable.');
    const data: Prisma.OperationBancaireUncheckedUpdateInput = {};
    if (dto.poste !== undefined) data.poste = dto.poste || null;
    if (dto.enveloppeId !== undefined) data.enveloppeId = dto.enveloppeId || null;
    if (dto.factureId !== undefined) {
      if (dto.factureId) {
        const f = await this.prisma.factureFournisseur.findFirst({ where: { id: dto.factureId, accountId } });
        if (!f) throw new NotFoundException('Facture introuvable.');
        data.factureId = f.id;
        data.rapprochement = 'MANUEL';
        data.poste = f.poste;
        data.enveloppeId = f.enveloppeId;
        await this.prisma.factureFournisseur.update({ where: { id: f.id }, data: { statut: 'PAYEE' } });
      } else {
        data.factureId = null;
        data.rapprochement = null;
      }
    }
    return this.prisma.operationBancaire.update({ where: { id }, data });
  }

  async supprimerReleve(accountId: string, userId: string, role: string, id: string) {
    const r = await this.prisma.releveBancaire.findFirst({ where: { id, accountId } });
    if (!r) throw new NotFoundException('Relevé introuvable.');
    await this.prisma.releveBancaire.delete({ where: { id } });
    if (r.fileId) await this.files.supprimer(r.fileId, userId, role as never).catch(() => undefined);
    return { ok: true };
  }

  /**
   * LE BUDGET RÉALISÉ de l'année, poste par poste, sans double compte : les
   * factures (payées ou non), plus les sorties de relevé qui n'ont pas de
   * facture. En face, le prévu : les enveloppes accordées.
   */
  async budgetRealise(accountId: string, annee: number) {
    const debut = new Date(`${annee}-01-01`);
    const fin = new Date(`${annee + 1}-01-01`);
    const [factures, ops, frais] = await Promise.all([
      this.prisma.factureFournisseur.findMany({ where: { accountId, OR: [{ dateFacture: { gte: debut, lt: fin } }, { dateFacture: null, createdAt: { gte: debut, lt: fin } }] }, select: { poste: true, montantTTC: true } }),
      this.prisma.operationBancaire.findMany({ where: { accountId, date: { gte: debut, lt: fin }, sens: 'DEPENSE', factureId: null }, select: { poste: true, montant: true } }),
      this.prisma.noteDeFrais.findMany({ where: { accountId, date: { gte: debut, lt: fin }, statut: { in: ['VALIDEE', 'REMBOURSEE', 'ABANDONNEE'] } }, select: { poste: true, montant: true } }),
    ]);
    const m = new Map<string, { factures: number; releve: number; frais: number }>();
    const cle = (p: string | null) => p ?? 'Sans poste';
    const get = (p: string | null) => {
      if (!m.has(cle(p))) m.set(cle(p), { factures: 0, releve: 0, frais: 0 });
      return m.get(cle(p))!;
    };
    for (const f of factures) get(f.poste).factures += Number(f.montantTTC);
    for (const o of ops) get(o.poste).releve += Math.abs(Number(o.montant));
    for (const n of frais) get(n.poste).frais += Number(n.montant);
    const lignes = [...m.entries()].map(([poste, v]) => ({ poste, factures: r2(v.factures), releve: r2(v.releve), frais: r2(v.frais), total: r2(v.factures + v.releve + v.frais) })).sort((a, b) => b.total - a.total);
    return { annee, lignes, total: r2(lignes.reduce((t, l) => t + l.total, 0)) };
  }
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}
