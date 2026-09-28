import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FraisService } from './frais.service';
import { normaliserNom } from './outils';

/**
 * LA TRÉSORERIE PRÉVISIONNELLE À 90 JOURS.
 *
 * La question d'un trésorier d'association n'est pas « combien avons-nous »
 * mais « est-ce qu'on passe le mois prochain ». On part du solde en banque
 * (saisi, ou lu au bas du dernier relevé), on ajoute ce qui est déjà connu :
 *
 *   SORTIES  factures non payées (à l'échéance), notes de frais validées,
 *            devis acceptés pas encore facturés (à la fin de validité),
 *            et les charges RÉCURRENTES repérées dans les relevés (un loyer,
 *            une assurance, un abonnement revient chaque mois au même jour) ;
 *   ENTRÉES  subventions accordées pas encore perçues (à la date de versement
 *            prévue), et les recettes récurrentes des relevés.
 *
 * Le résultat est un solde semaine par semaine sur treize semaines, le point
 * bas, et l'alerte si le solde passe sous zéro. Une entrée sans date connue
 * n'entre PAS dans la courbe : elle est listée à part, sinon la courbe ment.
 *
 * ⚠ Rien ici n'est une prédiction : ce sont des engagements déjà pris. Ce que
 * l'association décidera demain n'y est pas, et la page le dit.
 */

export const HORIZON_JOURS = 91; // 13 semaines pleines

export interface Mouvement {
  date: string; // AAAA-MM-JJ
  libelle: string;
  montant: number; // signé
  type: 'facture' | 'note' | 'devis' | 'recurrent' | 'subvention';
  certain: boolean;
  id?: string;
}

interface OpSimple {
  date: Date;
  libelle: string;
  montant: number;
}

@Injectable()
export class TresorerieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly frais: FraisService,
  ) {}

  async prevision(accountId: string, auj = new Date()) {
    const aujourdhui = jour(auj);
    const fin = new Date(aujourdhui.getTime() + HORIZON_JOURS * 86_400_000);
    const sixMois = new Date(aujourdhui.getTime() - 183 * 86_400_000);
    const [reglages, dernierReleve, ops, factures, notes, devis, enveloppes, recettesEnv] = await Promise.all([
      this.frais.reglages(accountId),
      this.prisma.releveBancaire.findFirst({ where: { accountId, soldeFin: { not: null } }, orderBy: [{ periodeFin: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.operationBancaire.findMany({ where: { accountId, date: { gte: sixMois } }, select: { date: true, libelle: true, montant: true, sens: true, factureId: true } }),
      this.prisma.factureFournisseur.findMany({ where: { accountId, statut: { not: 'PAYEE' } }, select: { id: true, fournisseur: true, montantTTC: true, dateFacture: true, dateEcheance: true } }),
      this.prisma.noteDeFrais.findMany({ where: { accountId, statut: 'VALIDEE', abandon: false }, select: { id: true, beneficiaire: true, montant: true } }),
      this.prisma.devisFournisseur.findMany({ where: { accountId, statut: 'EN_ATTENTE' }, select: { id: true, fournisseur: true, montantTTC: true, dateValidite: true } }),
      this.prisma.enveloppeFactures.findMany({ where: { accountId, type: { in: ['SUBVENTION', 'PROJET'] }, montantAccorde: { not: null } }, select: { id: true, nom: true, financeur: true, montantAccorde: true, dateVersementPrevu: true } }),
      this.prisma.operationBancaire.groupBy({ by: ['enveloppeId'], where: { accountId, sens: 'RECETTE', enveloppeId: { not: null } }, _sum: { montant: true } }),
    ]);

    // ── Le point de départ ──────────────────────────────────────────────────
    let depart: { solde: number; au: Date; source: 'saisi' | 'releve' } | null = null;
    if (reglages.soldeBancaire !== null && reglages.soldeBancaireAu) depart = { solde: reglages.soldeBancaire, au: jour(reglages.soldeBancaireAu), source: 'saisi' };
    else if (dernierReleve?.soldeFin !== null && dernierReleve?.soldeFin !== undefined && dernierReleve.periodeFin) depart = { solde: Number(dernierReleve.soldeFin), au: jour(dernierReleve.periodeFin), source: 'releve' };
    // Les lignes de relevé postérieures au point de départ sont déjà passées en banque.
    let soldeAujourdhui = depart?.solde ?? 0;
    if (depart) for (const o of ops) if (o.date > depart.au && o.date <= aujourdhui) soldeAujourdhui += Number(o.montant);

    const mouvements: Mouvement[] = [];
    const dans = (d: Date) => (d < aujourdhui ? aujourdhui : d);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    // ── Sorties connues ─────────────────────────────────────────────────────
    for (const f of factures) {
      const d = f.dateEcheance ?? (f.dateFacture ? new Date(f.dateFacture.getTime() + 30 * 86_400_000) : aujourdhui);
      mouvements.push({ date: iso(dans(d)), libelle: `Facture ${f.fournisseur}`, montant: -Number(f.montantTTC), type: 'facture', certain: true, id: f.id });
    }
    for (const n of notes) mouvements.push({ date: iso(new Date(aujourdhui.getTime() + 7 * 86_400_000)), libelle: `Note de frais ${n.beneficiaire}`, montant: -Number(n.montant), type: 'note', certain: true, id: n.id });
    for (const d of devis) {
      const quand = d.dateValidite && d.dateValidite > aujourdhui ? d.dateValidite : new Date(aujourdhui.getTime() + 30 * 86_400_000);
      if (quand <= fin) mouvements.push({ date: iso(quand), libelle: `Devis accepté ${d.fournisseur}`, montant: -Number(d.montantTTC), type: 'devis', certain: false, id: d.id });
    }

    // ── Entrées connues : subventions à percevoir ───────────────────────────
    const percuPar = new Map<string, number>();
    for (const r of recettesEnv) if (r.enveloppeId) percuPar.set(r.enveloppeId, Number(r._sum.montant ?? 0));
    const aPercevoirSansDate: { id: string; nom: string; montant: number }[] = [];
    for (const e of enveloppes) {
      const reste = r2(Number(e.montantAccorde) - (percuPar.get(e.id) ?? 0));
      if (reste <= 0) continue;
      const libelle = `${e.nom}${e.financeur ? ` (${e.financeur})` : ''}`;
      if (e.dateVersementPrevu && e.dateVersementPrevu <= fin) mouvements.push({ date: iso(dans(e.dateVersementPrevu)), libelle, montant: reste, type: 'subvention', certain: false, id: e.id });
      else if (!e.dateVersementPrevu) aPercevoirSansDate.push({ id: e.id, nom: libelle, montant: reste });
    }

    // ── Les récurrents, repérés dans six mois de relevés ────────────────────
    const recurrents = detecterRecurrents(ops.filter((o) => !o.factureId).map((o) => ({ date: o.date, libelle: o.libelle, montant: Number(o.montant) })));
    const motsFacturesEnAttente = factures.map((f) => normaliserNom(f.fournisseur));
    for (const rc of recurrents) {
      // Une charge récurrente dont une facture NON payée est déjà dans la liste ne se compte pas deux fois.
      const deja = rc.montant < 0 && motsFacturesEnAttente.some((m) => m && (rc.cle.includes(m) || m.includes(rc.cle)));
      if (deja) continue;
      for (let k = 0; k < 4; k++) {
        const d = prochaineOccurrence(aujourdhui, rc.jourDuMois, k);
        if (d > fin) break;
        mouvements.push({ date: iso(d), libelle: rc.libelle, montant: rc.montant, type: 'recurrent', certain: false });
      }
    }

    mouvements.sort((a, b) => a.date.localeCompare(b.date));

    // ── Semaine par semaine ─────────────────────────────────────────────────
    const semaines: { debut: string; fin: string; entrees: number; sorties: number; solde: number }[] = [];
    let solde = soldeAujourdhui;
    let pointBas = { date: iso(aujourdhui), montant: solde };
    for (let s = 0; s < 13; s++) {
      const d0 = new Date(aujourdhui.getTime() + s * 7 * 86_400_000);
      const d1 = new Date(d0.getTime() + 6 * 86_400_000);
      const [a, b] = [iso(d0), iso(d1)];
      let entrees = 0;
      let sorties = 0;
      for (const m of mouvements) if (m.date >= a && m.date <= b) (m.montant >= 0 ? (entrees += m.montant) : (sorties += -m.montant));
      solde = r2(solde + entrees - sorties);
      if (solde < pointBas.montant) pointBas = { date: b, montant: solde };
      semaines.push({ debut: a, fin: b, entrees: r2(entrees), sorties: r2(sorties), solde });
    }

    const alertes: string[] = [];
    if (!depart) alertes.push('Aucun solde de départ : saisissez le solde de votre compte (onglet Trésorerie) ou déposez un relevé qui porte son solde de fin. La courbe part de zéro.');
    const premiereNegative = semaines.find((s) => s.solde < 0);
    if (premiereNegative && depart) alertes.push(`Le solde passe sous zéro la semaine du ${fr(premiereNegative.debut)} (${premiereNegative.solde.toFixed(2)} €).`);
    if (aPercevoirSansDate.length) alertes.push(`${aPercevoirSansDate.length} subvention${aPercevoirSansDate.length > 1 ? 's' : ''} à percevoir sans date de versement : renseignez la date sur l'enveloppe pour la voir dans la courbe.`);

    return {
      horizonJours: HORIZON_JOURS,
      depart: depart ? { solde: r2(depart.solde), au: depart.au, source: depart.source } : null,
      soldeAujourdhui: r2(soldeAujourdhui),
      soldeFin: semaines[semaines.length - 1]?.solde ?? r2(soldeAujourdhui),
      pointBas,
      totalEntrees: r2(mouvements.filter((m) => m.montant > 0).reduce((t, m) => t + m.montant, 0)),
      totalSorties: r2(mouvements.filter((m) => m.montant < 0).reduce((t, m) => t - m.montant, 0)),
      semaines,
      mouvements: mouvements.filter((m) => m.date <= iso(fin)),
      recurrents: recurrents.map((r) => ({ libelle: r.libelle, montant: r.montant, jourDuMois: r.jourDuMois, occurrences: r.occurrences })),
      aPercevoirSansDate,
      alertes,
    };
  }
}

// ─── Détection des récurrents ───────────────────────────────────────────────

/** Un libellé de banque réduit à ce qui revient d'un mois à l'autre : sans chiffres, sans dates, sans références. */
export function cleRecurrente(libelle: string) {
  return normaliserNom(libelle.replace(/\d+[/.-]\d+([/.-]\d+)?/g, ' ').replace(/\b\w*\d\w*\b/g, ' ').replace(/\b(prlv|prelevement|sepa|cb|carte|vir|virement|paiement|facture|ref|ech|echeance|du|le|de|la|les|au|a)\b/gi, ' '))
    .split(' ')
    .filter((m) => m.length >= 3)
    .slice(0, 4)
    .join(' ');
}

/**
 * Les opérations qui reviennent chaque mois : même clé, au moins trois mois
 * distincts sur six, montants proches (± 20 % de la médiane). Rend le montant
 * médian, signé, et le jour du mois habituel.
 */
export function detecterRecurrents(ops: OpSimple[]) {
  const groupes = new Map<string, OpSimple[]>();
  for (const o of ops) {
    const cle = cleRecurrente(o.libelle);
    if (!cle) continue;
    const k = `${o.montant < 0 ? '-' : '+'}${cle}`;
    if (!groupes.has(k)) groupes.set(k, []);
    groupes.get(k)!.push(o);
  }
  const out: { cle: string; libelle: string; montant: number; jourDuMois: number; occurrences: number }[] = [];
  for (const [k, liste] of groupes) {
    const mois = new Set(liste.map((o) => `${o.date.getUTCFullYear()}-${o.date.getUTCMonth()}`));
    if (mois.size < 3) continue;
    const montants = liste.map((o) => Math.abs(o.montant)).sort((a, b) => a - b);
    const mediane = montants[Math.floor(montants.length / 2)];
    if (!(mediane > 0)) continue;
    const proches = liste.filter((o) => Math.abs(Math.abs(o.montant) - mediane) / mediane <= 0.2);
    if (new Set(proches.map((o) => `${o.date.getUTCFullYear()}-${o.date.getUTCMonth()}`)).size < 3) continue;
    const jours = proches.map((o) => o.date.getUTCDate()).sort((a, b) => a - b);
    const jourDuMois = jours[Math.floor(jours.length / 2)];
    const plusRecent = [...proches].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    out.push({ cle: k.slice(1), libelle: plusRecent.libelle.replace(/\s+/g, ' ').slice(0, 80), montant: r2(k.startsWith('-') ? -mediane : mediane), jourDuMois, occurrences: proches.length });
  }
  return out.sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant));
}

/** La k-ième prochaine occurrence d'un jour du mois, à partir d'aujourd'hui (aujourd'hui compris). */
export function prochaineOccurrence(auj: Date, jourDuMois: number, k: number) {
  let annee = auj.getUTCFullYear();
  let mois = auj.getUTCMonth();
  if (auj.getUTCDate() > jourDuMois) mois += 1;
  mois += k;
  annee += Math.floor(mois / 12);
  mois = ((mois % 12) + 12) % 12;
  const dernier = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  return new Date(Date.UTC(annee, mois, Math.min(jourDuMois, dernier)));
}

function jour(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function fr(iso: string) {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}
