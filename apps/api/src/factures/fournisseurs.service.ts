import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { empreinteIban, nettoyerIban, nettoyerSiret, normaliserNom } from './outils';

/**
 * LA FICHE FOURNISSEUR, ET CE QU'ELLE PROTÈGE.
 *
 * La fraude la plus courante contre une association est la fausse facture ou
 * le « nouveau RIB » d'un fournisseur connu. La fiche mémorise donc, pour
 * chaque fournisseur, le SIRET et l'empreinte de l'IBAN vus sur ses factures :
 * une facture dont l'IBAN change ou dont le SIRET est inconnu lève une alerte,
 * et la vérification dans l'annuaire officiel des entreprises dit si le SIRET
 * existe et si l'établissement est encore actif.
 *
 * ⚠ L'IBAN N'EST JAMAIS STOCKÉ EN CLAIR : empreinte SHA-256 + quatre derniers.
 */

const ANNUAIRE = 'https://recherche-entreprises.api.gouv.fr/search';

export interface Verification {
  siretOk: boolean | null;
  etat: 'A' | 'C' | null;
  nomAnnuaire: string | null;
  ibanChange: boolean;
  ibanNouveau: boolean;
  alertes: string[];
  verifieLe: string;
}

@Injectable()
export class FournisseursService {
  private readonly logger = new Logger(FournisseursService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** L'annuaire public : existe-t-il, est-il actif, sous quel nom ? */
  async interrogerAnnuaire(siret: string): Promise<{ etat: 'A' | 'C' | null; nom: string | null; adresse: string | null } | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const params = new URLSearchParams({ q: siret.slice(0, 9), per_page: '5', page: '1' });
      const r = await fetch(`${ANNUAIRE}?${params}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      if (!r.ok) return null;
      const j = (await r.json()) as {
        results?: {
          nom_raison_sociale?: string | null;
          nom_complet?: string | null;
          etat_administratif?: string | null;
          siege?: { siret?: string | null; adresse?: string | null; etat_administratif?: string | null };
          matching_etablissements?: { siret?: string | null; etat_administratif?: string | null; adresse?: string | null }[];
        }[];
      };
      const res = (j.results ?? [])[0];
      if (!res) return null;
      const nom = (res.nom_raison_sociale || res.nom_complet || '').trim() || null;
      const etab = [res.siege, ...(res.matching_etablissements ?? [])].find((e) => e?.siret === siret) ?? res.siege;
      const brut = (etab?.etat_administratif ?? res.etat_administratif ?? null) as string | null;
      const etat = brut === 'A' ? 'A' : brut === 'C' ? 'C' : null;
      return { etat, nom, adresse: etab?.adresse ?? null };
    } catch (err) {
      this.logger.warn(`Annuaire des entreprises injoignable : ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Rattache la facture à sa fiche (créée au besoin), compare SIRET et IBAN,
   * interroge l'annuaire si le SIRET est nouveau. Rend la fiche et le verdict.
   */
  async rattacher(
    accountId: string,
    fournisseur: string,
    lu: { siret?: string | null; iban?: string | null },
  ): Promise<{ ficheId: string; siret: string | null; ibanEmpreinte: string | null; ibanFin: string | null; verification: Verification }> {
    const nomNormalise = normaliserNom(fournisseur) || 'inconnu';
    const siret = nettoyerSiret(lu.siret);
    const iban = nettoyerIban(lu.iban);
    const emp = iban ? empreinteIban(iban) : null;
    const alertes: string[] = [];
    let fiche = await this.prisma.fournisseurPilote.findUnique({ where: { accountId_nomNormalise: { accountId, nomNormalise } } });

    let ibanChange = false;
    let ibanNouveau = false;
    if (fiche) {
      if (emp && fiche.ibanEmpreinte && fiche.ibanEmpreinte !== emp.ibanEmpreinte) {
        ibanChange = true;
        alertes.push(
          `Le RIB de ce fournisseur a changé (fin …${fiche.ibanFin} auparavant, …${emp.ibanFin} sur cette facture). Vérifiez par téléphone avant tout paiement : c'est la fraude la plus courante.`,
        );
      } else if (emp && !fiche.ibanEmpreinte) {
        ibanNouveau = true;
      }
      if (siret && fiche.siret && fiche.siret !== siret) {
        alertes.push(`Le SIRET diffère de celui connu pour ce fournisseur (${fiche.siret}).`);
      }
    } else {
      ibanNouveau = !!emp;
    }

    // Annuaire : seulement quand le SIRET est nouveau pour la fiche (une fois par fournisseur).
    let etat: 'A' | 'C' | null = null;
    let nomAnnuaire: string | null = null;
    let siretOk: boolean | null = null;
    const annuaireConnu = fiche?.annuaire as { etat?: 'A' | 'C' | null; nomAnnuaire?: string | null } | null | undefined;
    let annuaire: Prisma.InputJsonValue | undefined;
    if (siret && (!fiche || fiche.siret !== siret || !annuaireConnu)) {
      const r = await this.interrogerAnnuaire(siret);
      if (r) {
        siretOk = true;
        etat = r.etat;
        nomAnnuaire = r.nom;
        annuaire = { etat: r.etat, nomAnnuaire: r.nom, adresse: r.adresse, verifieLe: new Date().toISOString() };
        if (r.etat === 'C') alertes.push(`Le SIRET ${siret} est fermé dans l'annuaire des entreprises (établissement cessé).`);
        if (r.nom && normaliserNom(r.nom) && !this.nomsCompatibles(r.nom, fournisseur)) {
          alertes.push(`Le SIRET appartient à « ${r.nom} » dans l'annuaire, pas à « ${fournisseur} ».`);
        }
      } else {
        siretOk = false;
        alertes.push(`Le SIRET ${siret} est introuvable dans l'annuaire des entreprises.`);
      }
    } else if (annuaireConnu) {
      siretOk = true;
      etat = annuaireConnu.etat ?? null;
      nomAnnuaire = annuaireConnu.nomAnnuaire ?? null;
    }
    if (!siret) alertes.push('Aucun SIRET lisible sur la facture : les mentions obligatoires manquent peut-être.');

    if (!fiche) {
      fiche = await this.prisma.fournisseurPilote.create({
        data: {
          accountId,
          nom: fournisseur.slice(0, 120),
          nomNormalise,
          siret,
          ibanEmpreinte: emp?.ibanEmpreinte ?? null,
          ibanFin: emp?.ibanFin ?? null,
          annuaire,
        },
      });
    } else {
      // On mémorise le premier IBAN vu ; un IBAN qui change ne remplace pas
      // l'ancien tout seul : c'est la relecture humaine qui tranche (`accepterRib`).
      const data: Prisma.FournisseurPiloteUpdateInput = {};
      if (!fiche.siret && siret) data.siret = siret;
      if (!fiche.ibanEmpreinte && emp) {
        data.ibanEmpreinte = emp.ibanEmpreinte;
        data.ibanFin = emp.ibanFin;
      }
      if (annuaire) data.annuaire = annuaire;
      if (Object.keys(data).length) fiche = await this.prisma.fournisseurPilote.update({ where: { id: fiche.id }, data });
    }

    return {
      ficheId: fiche.id,
      siret,
      ibanEmpreinte: emp?.ibanEmpreinte ?? null,
      ibanFin: emp?.ibanFin ?? null,
      verification: { siretOk, etat, nomAnnuaire, ibanChange, ibanNouveau, alertes, verifieLe: new Date().toISOString() },
    };
  }

  private nomsCompatibles(a: string, b: string) {
    const ma = normaliserNom(a).split(' ').filter((m) => m.length >= 3);
    const mb = normaliserNom(b).split(' ').filter((m) => m.length >= 3);
    if (!ma.length || !mb.length) return true;
    return ma.some((m) => mb.includes(m)) || mb.some((m) => ma.includes(m));
  }

  /** La relecture humaine accepte le nouveau RIB : il devient la référence. */
  async accepterRib(accountId: string, factureId: string) {
    const f = await this.prisma.factureFournisseur.findFirst({ where: { id: factureId, accountId } });
    if (!f || !f.fournisseurId || !f.ibanEmpreinte) return null;
    return this.prisma.fournisseurPilote.update({
      where: { id: f.fournisseurId },
      data: { ibanEmpreinte: f.ibanEmpreinte, ibanFin: f.ibanFin },
    });
  }

  /** Le comparatif : par poste, ce que chaque fournisseur a coûté sur 12 mois, et le prix unitaire moyen quand les lignes le donnent. */
  async comparatif(accountId: string) {
    const depuis = new Date();
    depuis.setMonth(depuis.getMonth() - 12);
    const factures = await this.prisma.factureFournisseur.findMany({
      where: { accountId, OR: [{ dateFacture: { gte: depuis } }, { dateFacture: null, createdAt: { gte: depuis } }] },
      orderBy: { dateFacture: 'asc' },
    });
    const postes = new Map<string, Map<string, { total: number; nombre: number; premiere: number | null; derniere: number | null; unitaires: number[] }>>();
    for (const f of factures) {
      const poste = f.poste ?? 'Sans poste';
      if (!postes.has(poste)) postes.set(poste, new Map());
      const m = postes.get(poste)!;
      const e = m.get(f.fournisseur) ?? { total: 0, nombre: 0, premiere: null, derniere: null, unitaires: [] };
      const ttc = Number(f.montantTTC);
      e.total += ttc;
      e.nombre += 1;
      if (e.premiere === null) e.premiere = ttc;
      e.derniere = ttc;
      const lignes = Array.isArray(f.lignes) ? (f.lignes as { prixUnitaire?: number | null }[]) : [];
      for (const l of lignes) if (typeof l.prixUnitaire === 'number' && l.prixUnitaire > 0) e.unitaires.push(l.prixUnitaire);
      m.set(f.fournisseur, e);
    }
    const fiches = await this.prisma.fournisseurPilote.findMany({ where: { accountId } });
    const parNom = new Map(fiches.map((x) => [x.nomNormalise, x]));
    return [...postes.entries()].map(([poste, m]) => ({
      poste,
      total: [...m.values()].reduce((t, e) => t + e.total, 0),
      fournisseurs: [...m.entries()]
        .map(([fournisseur, e]) => {
          const fiche = parNom.get(normaliserNom(fournisseur));
          const ann = fiche?.annuaire as { etat?: string | null } | null | undefined;
          return {
            fournisseur,
            total: Math.round(e.total * 100) / 100,
            nombre: e.nombre,
            evolutionPct: e.premiere && e.derniere && e.nombre > 1 ? Math.round(((e.derniere - e.premiere) / e.premiere) * 100) : null,
            prixUnitaireMoyen: e.unitaires.length ? Math.round((e.unitaires.reduce((a, b) => a + b, 0) / e.unitaires.length) * 100) / 100 : null,
            siret: fiche?.siret ?? null,
            etat: ann?.etat ?? null,
            ibanFin: fiche?.ibanFin ?? null,
          };
        })
        .sort((a, b) => b.total - a.total),
    })).sort((a, b) => b.total - a.total);
  }

  async liste(accountId: string) {
    const fiches = await this.prisma.fournisseurPilote.findMany({ where: { accountId }, orderBy: { nom: 'asc' } });
    return fiches.map((f) => {
      const ann = f.annuaire as { etat?: string | null; nomAnnuaire?: string | null; verifieLe?: string } | null | undefined;
      return { id: f.id, nom: f.nom, siret: f.siret, ibanFin: f.ibanFin, etat: ann?.etat ?? null, nomAnnuaire: ann?.nomAnnuaire ?? null, verifieLe: ann?.verifieLe ?? null };
    });
  }
}
