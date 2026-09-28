import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rubriqueCerfa } from './enveloppes.service';
import { RelevesService } from './releves.service';
import { EnveloppesService } from './enveloppes.service';
import { FournisseursService } from './fournisseurs.service';
import { TresorerieService } from './tresorerie.service';
import { SessionsService } from './sessions.service';
import { classeur, type Cellule, type Feuille } from './xlsx';

/**
 * LE BILAN FINANCIER DE L'EXERCICE, EN CLASSEUR EXCEL, REMPLI TOUT SEUL.
 *
 * Ce que l'assemblée générale, le financeur ou le comptable demandent chaque
 * année : les charges par nature, les produits par origine, le résultat, les
 * subventions et leur restant, la trésorerie mois par mois, et le détail des
 * pièces. Tout vient des factures, des relevés, des notes de frais et des
 * enveloppes ; rien n'est ressaisi.
 *
 * ⚠ Les PRODUITS viennent du relevé de compte quand l'année en a (ce qui est
 * réellement entré) ; sinon des ventes de l'école (académie) et des mouvements
 * saisis dans « Ma comptabilité » (association). La feuille le dit.
 */

@Injectable()
export class BilanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly releves: RelevesService,
    private readonly enveloppes: EnveloppesService,
    private readonly fournisseurs: FournisseursService,
    private readonly tresorerieService: TresorerieService,
    private readonly sessions: SessionsService,
  ) {}

  async resume(accountId: string, annee: number) {
    const debut = new Date(`${annee}-01-01`);
    const fin = new Date(`${annee + 1}-01-01`);
    const [budget, relevesAnnee, compte] = await Promise.all([
      this.releves.budgetRealise(accountId, annee),
      this.releves.liste(accountId, annee),
      this.prisma.account.findUnique({ where: { id: accountId }, select: { name: true, siret: true, type: true } }),
    ]);
    const charges = new Map<string, number>();
    for (const l of budget.lignes) charges.set(rubriqueCerfa(l.poste === 'Sans poste' ? null : l.poste), (charges.get(rubriqueCerfa(l.poste === 'Sans poste' ? null : l.poste)) ?? 0) + l.total);

    let produits: { origine: string; total: number }[] = [];
    let sourceProduits = 'Relevés de compte déposés';
    if (relevesAnnee.resume.recettes > 0) {
      produits = relevesAnnee.resume.parNature.map((n) => ({ origine: n.nature, total: n.total }));
    } else {
      sourceProduits = 'Aucun relevé déposé : ventes et mouvements saisis dans Pilote';
      if (compte?.type === 'ACADEMIE') {
        const ventes = await this.prisma.venteCours.findMany({ where: { accountId, statut: 'PAYEE', createdAt: { gte: debut, lt: fin } }, select: { montantCents: true } });
        const t = ventes.reduce((s, v) => s + (v.montantCents ?? 0), 0) / 100;
        if (t) produits.push({ origine: 'Ventes de formations', total: Math.round(t * 100) / 100 });
      } else {
        const org = await this.prisma.organisation.findUnique({ where: { accountId }, select: { id: true } });
        if (org) {
          const mv = await this.prisma.mouvementAssociation.findMany({ where: { organisationId: org.id, sens: 'RECETTE', date: { gte: debut, lt: fin } }, select: { nature: true, montant: true } });
          const m = new Map<string, number>();
          for (const x of mv) m.set(String(x.nature), (m.get(String(x.nature)) ?? 0) + Number(x.montant));
          produits = [...m.entries()].map(([origine, total]) => ({ origine, total: Math.round(total * 100) / 100 }));
        }
      }
    }
    const totalCharges = Math.round([...charges.values()].reduce((a, b) => a + b, 0) * 100) / 100;
    const totalProduits = Math.round(produits.reduce((a, b) => a + b.total, 0) * 100) / 100;
    return {
      annee,
      structure: compte?.name ?? '',
      siret: compte?.siret ?? null,
      charges: [...charges.entries()].map(([rubrique, total]) => ({ rubrique, total: Math.round(total * 100) / 100 })).sort((a, b) => a.rubrique.localeCompare(b.rubrique)),
      produits,
      sourceProduits,
      totalCharges,
      totalProduits,
      resultat: Math.round((totalProduits - totalCharges) * 100) / 100,
      budget,
      tresorerie: relevesAnnee.resume.parMois,
    };
  }

  async classeur(accountId: string, annee: number): Promise<{ nom: string; fichier: Buffer }> {
    const [r, envs, comparatif, factures, ops, frais, prevision, sessions] = await Promise.all([
      this.resume(accountId, annee),
      this.enveloppes.liste(accountId),
      this.fournisseurs.comparatif(accountId),
      this.prisma.factureFournisseur.findMany({ where: { accountId, OR: [{ dateFacture: { gte: new Date(`${annee}-01-01`), lt: new Date(`${annee + 1}-01-01`) } }, { dateFacture: null, createdAt: { gte: new Date(`${annee}-01-01`), lt: new Date(`${annee + 1}-01-01`) } }] }, orderBy: [{ dateFacture: 'asc' }], include: { enveloppe: { select: { nom: true } } } }),
      this.releves.liste(accountId, annee),
      this.prisma.noteDeFrais.findMany({ where: { accountId, date: { gte: new Date(`${annee}-01-01`), lt: new Date(`${annee + 1}-01-01`) } }, orderBy: { date: 'asc' } }),
      this.tresorerieService.prevision(accountId),
      this.sessions.coutParSession(accountId, annee),
    ]);
    const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const nc = r.charges.length;
    const np = r.produits.length;
    const synthese: Feuille = {
      nom: `Bilan ${annee}`,
      colonnes: [46, 18, 4, 40, 18],
      gras: [0, 3, 4 + Math.max(nc, np) + 1, 4 + Math.max(nc, np) + 2],
      lignes: [
        [`Bilan financier de l'exercice ${annee}`, '', '', r.structure, r.siret ?? ''],
        ['Établi le', { d: new Date() }, '', 'par Pilote, Mes factures', ''],
        ['', '', '', '', ''],
        ['CHARGES (par rubrique du plan comptable)', 'Montant', '', `PRODUITS (${r.sourceProduits})`, 'Montant'],
        ...Array.from({ length: Math.max(nc, np) }, (_, i): Cellule[] => [r.charges[i]?.rubrique ?? '', r.charges[i]?.total ?? '', '', r.produits[i]?.origine ?? '', r.produits[i]?.total ?? '']),
        ['', '', '', '', ''],
        ['Total des charges', { f: `SUM(B5:B${4 + Math.max(nc, np)})` }, '', 'Total des produits', { f: `SUM(E5:E${4 + Math.max(nc, np)})` }],
        ['Résultat de l’exercice (produits − charges)', { f: `E${4 + Math.max(nc, np) + 2}-B${4 + Math.max(nc, np) + 2}` }, '', '', ''],
        ['', '', '', '', ''],
        ['Ce classeur est rempli automatiquement depuis les factures, les relevés de compte, les notes de frais et les enveloppes de subvention de Pilote. Les chiffres se relisent avant l’assemblée générale ; le comptable garde le dernier mot.', '', '', '', ''],
      ],
    };

    const chargesPoste: Feuille = {
      nom: 'Charges par poste',
      colonnes: [34, 16, 16, 16, 16, 30],
      lignes: [
        ['Poste', 'Factures', 'Relevé sans facture', 'Notes de frais', 'Total', 'Rubrique'],
        ...r.budget.lignes.map((l): Cellule[] => [l.poste, l.factures, l.releve, l.frais, l.total, rubriqueCerfa(l.poste === 'Sans poste' ? null : l.poste)]),
        ['Total', { f: `SUM(B2:B${r.budget.lignes.length + 1})` }, { f: `SUM(C2:C${r.budget.lignes.length + 1})` }, { f: `SUM(D2:D${r.budget.lignes.length + 1})` }, { f: `SUM(E2:E${r.budget.lignes.length + 1})` }, ''],
      ],
    };

    const subventions: Feuille = {
      nom: 'Subventions et projets',
      colonnes: [36, 14, 26, 16, 16, 16, 16, 14, 14],
      lignes: [
        ['Enveloppe', 'Type', 'Financeur', 'Accordé', 'Engagé', 'Payé', 'Restant', 'Justification', 'Alertes'],
        ...envs.map((e): Cellule[] => [e.nom, e.type, e.financeur ?? '', e.montantAccorde ?? '', e.engage, e.paye, e.restant ?? '', e.dateJustification ? { d: new Date(e.dateJustification) } : '', e.alertes.join(' ')]),
      ],
    };

    const tresorerie: Feuille = {
      nom: 'Trésorerie',
      colonnes: [14, 16, 16, 16, 18],
      lignes: [
        ['Mois', 'Entrées', 'Sorties', 'Solde du mois', 'Cumul'],
        ...MOIS.map((m, i): Cellule[] => [m, Math.round(r.tresorerie.recettes[i] * 100) / 100, Math.round(r.tresorerie.depenses[i] * 100) / 100, { f: `B${i + 2}-C${i + 2}` }, { f: i === 0 ? `D2` : `E${i + 1}+D${i + 2}` }]),
        ['Total', { f: 'SUM(B2:B13)' }, { f: 'SUM(C2:C13)' }, { f: 'SUM(D2:D13)' }, ''],
      ],
    };

    const facturesF: Feuille = {
      nom: 'Factures',
      colonnes: [12, 12, 30, 16, 28, 26, 12, 12, 12, 12, 40],
      lignes: [
        ['Date', 'Échéance', 'Fournisseur', 'Numéro', 'Poste', 'Enveloppe', 'HT', 'TVA', 'TTC', 'Statut', 'Alerte'],
        ...factures.map((f): Cellule[] => [f.dateFacture ? { d: f.dateFacture } : '', f.dateEcheance ? { d: f.dateEcheance } : '', f.fournisseur, f.numero ?? '', f.poste ?? '', f.enveloppe?.nom ?? '', f.montantHT === null ? '' : Number(f.montantHT), f.tva === null ? '' : Number(f.tva), Number(f.montantTTC), f.statut, f.alerte ?? '']),
        ['Total', '', '', '', '', '', '', '', { f: `SUM(I2:I${factures.length + 1})` }, '', ''],
      ],
    };

    const relevesF: Feuille = {
      nom: 'Relevés',
      colonnes: [12, 50, 14, 10, 28, 30],
      lignes: [
        ['Date', 'Libellé', 'Montant', 'Sens', 'Poste ou nature', 'Facture rapprochée'],
        ...ops.operations.map((o): Cellule[] => [{ d: new Date(o.date) }, o.libelle, o.montant, o.sens, o.poste ?? '', o.facture ? `${o.facture.fournisseur} ${o.facture.numero ?? ''}`.trim() : '']),
      ],
    };

    const fournisseursF: Feuille = {
      nom: 'Fournisseurs',
      colonnes: [28, 30, 14, 10, 14, 16, 16, 8],
      lignes: [
        ['Poste', 'Fournisseur', 'Total 12 mois', 'Factures', 'Évolution %', 'Prix unitaire moyen', 'SIRET', 'État'],
        ...comparatif.flatMap((p) => p.fournisseurs.map((f): Cellule[] => [p.poste, f.fournisseur, f.total, f.nombre, f.evolutionPct ?? '', f.prixUnitaireMoyen ?? '', f.siret ?? '', f.etat === 'A' ? 'Actif' : f.etat === 'C' ? 'Fermé' : ''])),
      ],
    };

    const fraisF: Feuille = {
      nom: 'Notes de frais',
      colonnes: [12, 26, 40, 12, 26, 14, 14],
      lignes: [
        ['Date', 'Bénéficiaire', 'Objet', 'Montant', 'Poste', 'Statut', 'Reçu'],
        ...frais.map((n): Cellule[] => [{ d: n.date }, n.beneficiaire, n.objet, Number(n.montant), n.poste ?? '', n.abandon ? 'Abandon de frais' : n.statut, n.recuNumero ?? '']),
      ],
    };

    const previsionF: Feuille = {
      nom: 'Trésorerie 90 jours',
      colonnes: [14, 14, 16, 16, 18, 4, 12, 44, 14, 14],
      gras: [0, 2, 17],
      lignes: [
        ['Trésorerie prévisionnelle', '', '', '', '', '', '', '', '', ''],
        ['Solde de départ', prevision.depart ? prevision.depart.solde : 'non renseigné', prevision.depart ? { d: new Date(prevision.depart.au) } : '', `Solde à ce jour : ${prevision.soldeAujourdhui.toFixed(2)}`, '', '', '', prevision.alertes.join(' '), '', ''],
        ['Semaine du', 'au', 'Entrées', 'Sorties', 'Solde en fin de semaine', '', 'Date', 'Mouvement attendu', 'Montant', 'Certain'],
        ...Array.from({ length: Math.max(prevision.semaines.length, prevision.mouvements.length) }, (_, i): Cellule[] => {
          const sm = prevision.semaines[i];
          const mv = prevision.mouvements[i];
          return [sm ? { d: new Date(sm.debut) } : '', sm ? { d: new Date(sm.fin) } : '', sm ? sm.entrees : '', sm ? sm.sorties : '', sm ? sm.solde : '', '', mv ? { d: new Date(mv.date) } : '', mv ? mv.libelle : '', mv ? mv.montant : '', mv ? (mv.certain ? 'oui' : 'estimé') : ''];
        }),
        ['', '', '', '', '', '', '', '', '', ''],
        ['Ce sont des engagements déjà pris (factures à payer, notes validées, devis acceptés, charges qui reviennent chaque mois, subventions accordées avec date de versement), pas une prédiction.', '', '', '', '', '', '', '', '', ''],
      ],
    };

    const feuilles = [synthese, chargesPoste, subventions, tresorerie, previsionF, facturesF, relevesF, fournisseursF, fraisF];
    if (sessions.sessions.length) {
      feuilles.splice(3, 0, {
        nom: 'Coût par session',
        colonnes: [36, 16, 16, 16, 12, 10, 16, 16, 30],
        lignes: [
          ['Session', 'Produits', 'Charges', 'Marge', 'Marge %', 'Inscrits', 'Coût par inscrit', 'Produit par inscrit', 'Origine des produits'],
          ...sessions.sessions.map((x): Cellule[] => [x.nom, x.produits, x.charges, x.marge, x.margePct ?? '', x.inscrits, x.coutParInscrit ?? '', x.produitParInscrit ?? '', x.sourceProduits]),
          ['Total', sessions.totaux.produits, sessions.totaux.charges, sessions.totaux.marge, '', sessions.totaux.inscrits, '', '', ''],
        ],
      });
    }
    return { nom: `bilan-financier-${annee}.xlsx`, fichier: classeur(feuilles) };
  }
}
