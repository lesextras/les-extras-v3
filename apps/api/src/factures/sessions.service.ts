import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * LE COÛT PAR SESSION (académie).
 *
 * Une enveloppe de type SESSION porte les charges d'une formation (formateur,
 * salle, supports, déplacements). En face, les ventes du cours qu'elle suit
 * (`coursId`) : ce qui a été encaissé, et le nombre d'inscrits. On rend, par
 * session, produits, charges, marge, marge en pourcentage et coût par inscrit
 * : c'est ce qu'un organisme regarde pour fixer son prix et ce que le bilan
 * pédagogique et financier (BPF) demande par action.
 *
 * ⚠ Les produits sont l'ENCAISSÉ (`VenteCours.montantCents`), pas le prix
 * convenu : sur un échéancier, c'est la trésorerie réelle. Une session sans
 * cours relié prend pour produits les recettes de relevé rattachées à son
 * enveloppe.
 */

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async coutParSession(accountId: string, annee: number) {
    const debut = new Date(`${annee}-01-01`);
    const fin = new Date(`${annee + 1}-01-01`);
    const enveloppes = await this.prisma.enveloppeFactures.findMany({ where: { accountId, type: 'SESSION' }, orderBy: { nom: 'asc' } });
    if (!enveloppes.length) return { annee, sessions: [], totaux: { produits: 0, charges: 0, marge: 0, inscrits: 0 } };
    const ids = enveloppes.map((e) => e.id);
    const coursIds = enveloppes.map((e) => e.coursId).filter((x): x is string => !!x);
    const [factures, notes, ops, ventes, inscriptions] = await Promise.all([
      this.prisma.factureFournisseur.findMany({ where: { accountId, enveloppeId: { in: ids } }, select: { enveloppeId: true, montantTTC: true, poste: true } }),
      this.prisma.noteDeFrais.findMany({ where: { accountId, enveloppeId: { in: ids }, statut: { in: ['VALIDEE', 'REMBOURSEE', 'ABANDONNEE'] } }, select: { enveloppeId: true, montant: true, poste: true } }),
      this.prisma.operationBancaire.findMany({ where: { accountId, enveloppeId: { in: ids }, factureId: null }, select: { enveloppeId: true, montant: true, sens: true, poste: true } }),
      coursIds.length
        ? this.prisma.venteCours.findMany({ where: { accountId, coursId: { in: coursIds }, statut: { in: ['PAYEE'] }, createdAt: { gte: debut, lt: fin } }, select: { coursId: true, montantCents: true } })
        : Promise.resolve([] as { coursId: string | null; montantCents: number }[]),
      coursIds.length ? this.prisma.inscriptionCours.groupBy({ by: ['coursId'], where: { coursId: { in: coursIds } }, _count: { _all: true } }) : Promise.resolve([]),
    ]);
    const inscritsPar = new Map<string, number>();
    for (const i of inscriptions as { coursId: string; _count: { _all: number } }[]) inscritsPar.set(i.coursId, i._count._all);

    const sessions = enveloppes.map((e) => {
      const parPoste = new Map<string, number>();
      const ajouter = (poste: string | null, m: number) => parPoste.set(poste ?? 'Sans poste', (parPoste.get(poste ?? 'Sans poste') ?? 0) + m);
      for (const f of factures) if (f.enveloppeId === e.id) ajouter(f.poste, Number(f.montantTTC));
      for (const n of notes) if (n.enveloppeId === e.id) ajouter(n.poste, Number(n.montant));
      let recettesReleve = 0;
      for (const o of ops) {
        if (o.enveloppeId !== e.id) continue;
        if (o.sens === 'DEPENSE') ajouter(o.poste, Math.abs(Number(o.montant)));
        else recettesReleve += Number(o.montant);
      }
      const charges = r2([...parPoste.values()].reduce((a, b) => a + b, 0));
      const encaisse = e.coursId ? r2(ventes.filter((v) => v.coursId === e.coursId).reduce((t, v) => t + v.montantCents, 0) / 100) : 0;
      const produits = e.coursId ? encaisse : r2(recettesReleve);
      const inscrits = e.coursId ? (inscritsPar.get(e.coursId) ?? 0) : 0;
      const marge = r2(produits - charges);
      return {
        id: e.id,
        nom: e.nom,
        coursId: e.coursId,
        produits,
        sourceProduits: e.coursId ? 'ventes encaissées' : 'recettes de relevé rattachées',
        charges,
        chargesParPoste: [...parPoste.entries()].map(([poste, total]) => ({ poste, total: r2(total) })).sort((a, b) => b.total - a.total),
        marge,
        margePct: produits > 0 ? Math.round((marge / produits) * 100) : null,
        inscrits,
        coutParInscrit: inscrits > 0 ? r2(charges / inscrits) : null,
        produitParInscrit: inscrits > 0 ? r2(produits / inscrits) : null,
      };
    });
    const totaux = {
      produits: r2(sessions.reduce((t, s) => t + s.produits, 0)),
      charges: r2(sessions.reduce((t, s) => t + s.charges, 0)),
      marge: r2(sessions.reduce((t, s) => t + s.marge, 0)),
      inscrits: sessions.reduce((t, s) => t + s.inscrits, 0),
    };
    return { annee, sessions: sessions.sort((a, b) => b.charges - a.charges), totaux };
  }
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}
