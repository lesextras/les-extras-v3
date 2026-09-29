import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { ExtractionService } from '../assistant/extraction.service';
import { MoteurService } from '../assistant/moteur.service';
import { rubriqueCerfa } from './enveloppes.service';
import { FraisService } from './frais.service';
import {
  CONSIGNE_PREVISIONNEL,
  codeCompte,
  comparer,
  nombre,
  parserPrevisionnel,
  rubriqueRecette,
  tauxAtteinte,
  type LigneBudget,
  type LigneComparee,
  type Objectif,
  type Previsionnel,
  type Public,
} from './previsionnel';
import type { Feuille } from './xlsx';

/**
 * PRÉVU / RÉALISÉ D'UNE SUBVENTION : le dossier validé face à ce qui a été fait.
 *
 * Trois sources du prévu, dans cet ordre de préférence : le dossier validé
 * déposé (lu par le moteur), le budget déjà saisi dans le dossier de
 * financement de Pilote, la saisie à la main. Le budget réalisé vient de Mes
 * factures (factures, notes de frais, sorties et recettes du relevé rattachées à
 * l'enveloppe), plus ce que la personne ajoute à la main (salaires,
 * contributions en nature). Objectifs et publics réalisés sont saisis : ce sont
 * des faits que seule l'association connaît.
 */
@Injectable()
export class PrevisionnelService {
  private readonly logger = new Logger('Previsionnel');

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly extraction: ExtractionService,
    private readonly moteur: MoteurService,
    private readonly frais: FraisService,
  ) {}

  private async enveloppe(accountId: string, enveloppeId: string) {
    const e = await this.prisma.enveloppeFactures.findFirst({ where: { id: enveloppeId, accountId } });
    if (!e) throw new NotFoundException('Enveloppe introuvable.');
    return e;
  }

  /** Lit le dossier validé et enregistre le prévisionnel. Remplace le précédent, jamais le réalisé saisi. */
  async lireDossier(accountId: string, userId: string, enveloppeId: string, fichier: FichierRecu) {
    await this.enveloppe(accountId, enveloppeId);
    const estImage = fichier.mimetype.startsWith('image/');
    const estPdf = fichier.mimetype === 'application/pdf';
    const estWord = /officedocument\.wordprocessingml|msword/.test(fichier.mimetype);
    if (!estImage && !estPdf && !estWord) throw new BadRequestException('Déposez le dossier en PDF, en Word ou en photo.');
    const depose = await this.files.deposer({ fichier, famille: FileKind.COMPLIANCE, userId, accountId });
    const lu = await this.lireAvecMoteur(fichier, estImage);
    const avant = await this.prisma.previsionnelEnveloppe.findUnique({ where: { enveloppeId } });
    const p = await this.enregistrer(accountId, enveloppeId, fusionnerRealise(lu, avant ? versPrevisionnel(avant) : null), {
      fileId: depose.id,
      nomFichier: fichier.originalname.slice(0, 160),
      origine: 'moteur',
    });
    await this.frais.journaliser(accountId, userId, 'previsionnel.lu', enveloppeId, {
      charges: lu.charges.length,
      produits: lu.produits.length,
      objectifs: lu.objectifs.length,
      publics: lu.publics.length,
    });
    return p;
  }

  private async lireAvecMoteur(fichier: FichierRecu, estImage: boolean): Promise<Previsionnel> {
    const options: { system: string; user: string; maxTokens: number; temperature: number; pieces?: { mimeType: string; base64: string }[] } = {
      system: CONSIGNE_PREVISIONNEL,
      user: '',
      maxTokens: 4000,
      temperature: 0,
    };
    if (estImage) {
      options.user = 'Voici la photo du dossier. Réponds en JSON.';
      options.pieces = [{ mimeType: fichier.mimetype, base64: fichier.buffer.toString('base64') }];
    } else {
      let t = '';
      try {
        t = await this.extraction.extraire(fichier.buffer, fichier.mimetype, fichier.originalname);
      } catch {
        t = '';
      }
      if (t.length >= 200) {
        // Un Cerfa 12156 fait une dizaine de pages : le budget est vers la fin,
        // on garde donc large (40 000 caractères) au lieu des 12 000 d'une facture.
        options.user = `Voici le texte du dossier :\n\n${t.slice(0, 40_000)}`;
      } else if (fichier.mimetype === 'application/pdf') {
        options.user = 'Voici le dossier en PDF. Réponds en JSON.';
        options.pieces = [{ mimeType: 'application/pdf', base64: fichier.buffer.toString('base64') }];
      } else {
        throw new BadRequestException('Ce document ne contient pas de texte lisible. Déposez-le en PDF.');
      }
    }
    try {
      return parserPrevisionnel(await this.moteur.completer(options));
    } catch (err) {
      this.logger.warn(`Lecture impossible : ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException("Le dossier n'a pas pu être lu. Réessayez, ou saisissez le prévisionnel à la main.");
    }
  }

  /** Reprend le budget déjà saisi dans le dossier de financement de Pilote rattaché à l'enveloppe. */
  async depuisDossierPilote(accountId: string, userId: string, enveloppeId: string) {
    const e = await this.enveloppe(accountId, enveloppeId);
    if (!e.dossierId) throw new BadRequestException("Cette enveloppe n'est reliée à aucun dossier de financement de Pilote.");
    const d = await this.prisma.dossierFinancement.findUnique({ where: { id: e.dossierId } });
    const lignes = Array.isArray(d?.budgetPrevu) ? (d!.budgetPrevu as { libelle?: string; montant?: unknown; sens?: string }[]) : [];
    if (!lignes.length) throw new BadRequestException("Le dossier de financement n'a pas de budget prévisionnel saisi.");
    const versLigne = (l: { libelle?: string; montant?: unknown }, defaut: string): LigneBudget => ({
      code: codeCompte(l.libelle) ?? defaut,
      libelle: (l.libelle ?? '').slice(0, 160) || defaut,
      prevu: nombre(l.montant),
    });
    const lu: Previsionnel = {
      intitule: d!.intitule,
      periodeDebut: null,
      periodeFin: null,
      charges: lignes.filter((l) => l.sens !== 'RECETTE').map((l) => versLigne(l, '60')),
      produits: lignes.filter((l) => l.sens === 'RECETTE').map((l) => versLigne(l, '74')),
      objectifs: [],
      publics: d!.nombreBeneficiaires ? [{ categorie: 'Bénéficiaires', prevu: d!.nombreBeneficiaires }] : [],
      remarque: 'Repris du dossier de financement de Pilote. Vérifiez les numéros de compte : ils ont été devinés d’après les libellés quand ils n’y figuraient pas.',
    };
    const avant = await this.prisma.previsionnelEnveloppe.findUnique({ where: { enveloppeId } });
    const p = await this.enregistrer(accountId, enveloppeId, fusionnerRealise(lu, avant ? versPrevisionnel(avant) : null), { origine: 'dossier' });
    await this.frais.journaliser(accountId, userId, 'previsionnel.dossier', enveloppeId);
    return p;
  }

  /** La saisie à la main : corrections du prévu, réalisés des objectifs et publics, ajouts manuels au budget. */
  async saisir(accountId: string, userId: string, enveloppeId: string, dto: SaisiePrevisionnel) {
    await this.enveloppe(accountId, enveloppeId);
    const avant = await this.prisma.previsionnelEnveloppe.findUnique({ where: { enveloppeId } });
    const base = avant ? versPrevisionnel(avant) : { intitule: null, periodeDebut: null, periodeFin: null, charges: [], produits: [], objectifs: [], publics: [], remarque: null };
    const p = await this.enregistrer(
      accountId,
      enveloppeId,
      {
        intitule: dto.intitule !== undefined ? dto.intitule : base.intitule,
        periodeDebut: dto.periodeDebut !== undefined ? dto.periodeDebut : base.periodeDebut,
        periodeFin: dto.periodeFin !== undefined ? dto.periodeFin : base.periodeFin,
        charges: dto.charges ? (dto.charges as LigneBudget[]) : base.charges,
        produits: dto.produits ? (dto.produits as LigneBudget[]) : base.produits,
        objectifs: dto.objectifs
          ? dto.objectifs.map((o) => ({ intitule: o.intitule, indicateur: o.indicateur ?? null, cible: nombre(o.cible), unite: o.unite ?? null, realise: nombre(o.realise), commentaire: o.commentaire ?? null }))
          : base.objectifs,
        publics: dto.publics ? dto.publics.map((x) => ({ categorie: x.categorie, prevu: nombre(x.prevu), realise: nombre(x.realise), commentaire: x.commentaire ?? null })) : base.publics,
        remarque: base.remarque,
      },
      { origine: avant?.origine ?? 'main', seuilEcart: dto.seuilEcart },
    );
    await this.frais.journaliser(accountId, userId, 'previsionnel.saisi', enveloppeId);
    return p;
  }

  private async enregistrer(accountId: string, enveloppeId: string, p: Previsionnel, extra: { fileId?: string; nomFichier?: string; origine: string; seuilEcart?: number }) {
    const data = {
      intitule: p.intitule?.slice(0, 200) ?? null,
      periodeDebut: p.periodeDebut ? new Date(p.periodeDebut) : null,
      periodeFin: p.periodeFin ? new Date(p.periodeFin) : null,
      charges: nettoyerLignes(p.charges) as unknown as Prisma.InputJsonValue,
      produits: nettoyerLignes(p.produits) as unknown as Prisma.InputJsonValue,
      objectifs: p.objectifs.slice(0, 40) as unknown as Prisma.InputJsonValue,
      publics: p.publics.slice(0, 30) as unknown as Prisma.InputJsonValue,
      remarque: p.remarque?.slice(0, 500) ?? null,
      origine: extra.origine,
      ...(extra.fileId ? { fileId: extra.fileId, nomFichier: extra.nomFichier ?? null } : {}),
      ...(extra.seuilEcart !== undefined ? { seuilEcart: Math.max(1, Math.min(100, Math.round(extra.seuilEcart))) } : {}),
    };
    await this.prisma.previsionnelEnveloppe.upsert({
      where: { enveloppeId },
      create: { accountId, enveloppeId, ...data },
      update: data,
    });
    return this.analyse(accountId, enveloppeId);
  }

  /** Ce que Mes factures a réellement enregistré pour l'enveloppe, par rubrique à deux chiffres. */
  async realise(accountId: string, enveloppeId: string) {
    const [factures, notes, operations] = await Promise.all([
      this.prisma.factureFournisseur.findMany({ where: { accountId, enveloppeId }, select: { poste: true, montantTTC: true } }),
      this.prisma.noteDeFrais.findMany({ where: { accountId, enveloppeId, statut: { in: ['VALIDEE', 'REMBOURSEE', 'ABANDONNEE'] } }, select: { poste: true, montant: true } }),
      this.prisma.operationBancaire.findMany({ where: { accountId, enveloppeId }, select: { poste: true, montant: true, sens: true, factureId: true } }),
    ]);
    const charges: Record<string, number> = {};
    const produits: Record<string, number> = {};
    const ajouter = (t: Record<string, number>, code: string, m: number) => (t[code] = (t[code] ?? 0) + m);
    for (const f of factures) ajouter(charges, rubriqueCerfa(f.poste).slice(0, 2), Number(f.montantTTC));
    for (const n of notes) ajouter(charges, rubriqueCerfa(n.poste).slice(0, 2), Number(n.montant));
    for (const o of operations) {
      const m = Math.abs(Number(o.montant));
      // Une sortie rapprochée d'une facture est déjà comptée par la facture.
      if (o.sens === 'DEPENSE' && !o.factureId) ajouter(charges, rubriqueCerfa(o.poste).slice(0, 2), m);
      if (o.sens === 'RECETTE') ajouter(produits, rubriqueRecette(o.poste), m);
    }
    return { charges, produits, pieces: factures.length + notes.length + operations.length };
  }

  /** La comparaison complète, prête à afficher. */
  async analyse(accountId: string, enveloppeId: string) {
    const e = await this.enveloppe(accountId, enveloppeId);
    const p = await this.prisma.previsionnelEnveloppe.findUnique({ where: { enveloppeId } });
    const r = await this.realise(accountId, enveloppeId);
    const dossierPilote = !!e.dossierId;
    if (!p) return { existe: false as const, dossierPilote, realise: r };
    const prev = versPrevisionnel(p);
    const charges = comparer(prev.charges, r.charges, p.seuilEcart);
    const produits = comparer(prev.produits, r.produits, p.seuilEcart);
    const somme = (l: { prevu: number; realise: number }[], k: 'prevu' | 'realise') => Math.round(l.reduce((t, x) => t + x[k], 0) * 100) / 100;
    const objectifs = prev.objectifs.map((o) => ({ ...o, taux: tauxAtteinte(o.cible, o.realise) }));
    const publics = prev.publics.map((x) => ({ ...x, taux: tauxAtteinte(x.prevu, x.realise) }));
    const totPublicPrevu = publics.reduce((t, x) => t + (x.prevu ?? 0), 0);
    const totPublicRealise = publics.reduce((t, x) => t + (x.realise ?? 0), 0);
    const tauxObjectifs = objectifs.filter((o) => o.taux !== null);
    return {
      existe: true as const,
      dossierPilote,
      enveloppe: { id: e.id, nom: e.nom, financeur: e.financeur, montantAccorde: e.montantAccorde === null ? null : Number(e.montantAccorde) },
      fichier: p.fileId ? { id: p.fileId, nom: p.nomFichier } : null,
      origine: p.origine,
      intitule: p.intitule,
      periodeDebut: p.periodeDebut,
      periodeFin: p.periodeFin,
      seuilEcart: p.seuilEcart,
      remarque: p.remarque,
      saisie: prev,
      charges,
      produits,
      objectifs,
      publics,
      synthese: {
        chargesPrevues: somme(charges, 'prevu'),
        chargesRealisees: somme(charges, 'realise'),
        produitsPrevus: somme(produits, 'prevu'),
        produitsRealises: somme(produits, 'realise'),
        aExpliquer: charges.filter((c) => c.aExpliquer).length + produits.filter((c) => c.aExpliquer).length,
        objectifsMesures: tauxObjectifs.length,
        objectifsAtteints: tauxObjectifs.filter((o) => (o.taux ?? 0) >= 100).length,
        objectifsTotal: objectifs.length,
        publicPrevu: totPublicPrevu,
        publicRealise: totPublicRealise,
        tauxPublic: tauxAtteinte(totPublicPrevu, publics.some((x) => x.realise !== null && x.realise !== undefined) ? totPublicRealise : null),
      },
      pieces: r.pieces,
    };
  }

  /** Les trois feuilles du prévu / réalisé, ajoutées au compte rendu financier. */
  async feuilles(accountId: string, enveloppeId: string): Promise<Feuille[]> {
    const a = await this.analyse(accountId, enveloppeId);
    if (!a.existe) return [];
    const ligne = (c: LigneComparee) => [`${c.code} · ${c.libelle}`, c.prevu, c.realise, c.ecart, c.ecartPct === null ? '' : c.ecartPct, c.aExpliquer ? 'À expliquer' : '', c.commentaire ?? ''];
    const budget: Feuille = {
      nom: 'Budget prévu et réalisé',
      colonnes: [42, 14, 14, 14, 10, 14, 40],
      gras: [0, 1, 2 + a.charges.length, 3 + a.charges.length, 4 + a.charges.length + a.produits.length],
      lignes: [
        ['CHARGES', 'Prévu', 'Réalisé', 'Écart', 'Écart %', `Seuil ${a.seuilEcart} %`, 'Explication de l’écart'],
        ...a.charges.map(ligne),
        ['Total des charges', a.synthese.chargesPrevues, a.synthese.chargesRealisees, Math.round((a.synthese.chargesRealisees - a.synthese.chargesPrevues) * 100) / 100, '', '', ''],
        ['PRODUITS', 'Prévu', 'Réalisé', 'Écart', 'Écart %', '', ''],
        ...a.produits.map(ligne),
        ['Total des produits', a.synthese.produitsPrevus, a.synthese.produitsRealises, Math.round((a.synthese.produitsRealises - a.synthese.produitsPrevus) * 100) / 100, '', '', ''],
      ],
    };
    const objectifs: Feuille = {
      nom: 'Objectifs',
      colonnes: [50, 36, 12, 12, 14, 10, 40],
      gras: [0],
      lignes: [
        ['Objectif', 'Indicateur', 'Cible', 'Réalisé', 'Unité', 'Atteinte (%)', 'Commentaire'],
        ...a.objectifs.map((o) => [o.intitule, o.indicateur ?? '', o.cible ?? '', o.realise ?? '', o.unite ?? '', o.taux === null ? '' : o.taux, o.commentaire ?? '']),
      ],
    };
    const publics: Feuille = {
      nom: 'Public',
      colonnes: [44, 12, 12, 10, 40],
      gras: [0, 1 + a.publics.length],
      lignes: [
        ['Public', 'Prévu', 'Touché', 'Atteinte (%)', 'Commentaire'],
        ...a.publics.map((x) => [x.categorie, x.prevu ?? '', x.realise ?? '', x.taux === null ? '' : x.taux, x.commentaire ?? '']),
        ['Total', a.synthese.publicPrevu, a.synthese.publicRealise, a.synthese.tauxPublic === null ? '' : a.synthese.tauxPublic, ''],
      ],
    };
    return [budget, objectifs, publics];
  }
}

/** Ce que l'écran envoie : tout est facultatif, les nombres peuvent manquer. */
export interface SaisiePrevisionnel {
  intitule?: string | null;
  periodeDebut?: string | null;
  periodeFin?: string | null;
  charges?: { code: string; libelle: string; prevu?: number | null; realiseManuel?: number | null; commentaire?: string | null }[];
  produits?: { code: string; libelle: string; prevu?: number | null; realiseManuel?: number | null; commentaire?: string | null }[];
  objectifs?: { intitule: string; indicateur?: string | null; cible?: number | null; unite?: string | null; realise?: number | null; commentaire?: string | null }[];
  publics?: { categorie: string; prevu?: number | null; realise?: number | null; commentaire?: string | null }[];
  seuilEcart?: number;
}

/** Relit ce que la base garde, en tolérant un JSON abîmé. */
export function versPrevisionnel(p: { intitule: string | null; periodeDebut: Date | null; periodeFin: Date | null; charges: unknown; produits: unknown; objectifs: unknown; publics: unknown; remarque: string | null }): Previsionnel {
  const tableau = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  return {
    intitule: p.intitule,
    periodeDebut: p.periodeDebut ? p.periodeDebut.toISOString().slice(0, 10) : null,
    periodeFin: p.periodeFin ? p.periodeFin.toISOString().slice(0, 10) : null,
    charges: tableau<LigneBudget>(p.charges),
    produits: tableau<LigneBudget>(p.produits),
    objectifs: tableau<Objectif>(p.objectifs),
    publics: tableau<Public>(p.publics),
    remarque: p.remarque,
  };
}

/**
 * Un nouveau dossier lu ne doit pas effacer ce que la personne a déjà saisi
 * comme réalisé : on le reporte sur la ligne de même code, l'objectif de même
 * intitulé, le public de même catégorie.
 */
export function fusionnerRealise(nouveau: Previsionnel, ancien: Previsionnel | null): Previsionnel {
  if (!ancien) return nouveau;
  const cle = (s: string) => s.trim().toLowerCase();
  const reporter = (lignes: LigneBudget[], anciennes: LigneBudget[]) =>
    lignes.map((l) => {
      const a = anciennes.find((x) => x.code === l.code);
      return a ? { ...l, realiseManuel: a.realiseManuel ?? null, commentaire: a.commentaire ?? null } : l;
    });
  return {
    ...nouveau,
    charges: reporter(nouveau.charges, ancien.charges),
    produits: reporter(nouveau.produits, ancien.produits),
    objectifs: nouveau.objectifs.map((o) => {
      const a = ancien.objectifs.find((x) => cle(x.intitule) === cle(o.intitule));
      return a ? { ...o, realise: a.realise ?? null, commentaire: a.commentaire ?? null } : o;
    }),
    publics: nouveau.publics.map((x) => {
      const a = ancien.publics.find((y) => cle(y.categorie) === cle(x.categorie));
      return a ? { ...x, realise: a.realise ?? null, commentaire: a.commentaire ?? null } : x;
    }),
  };
}

function nettoyerLignes(l: LigneBudget[]): LigneBudget[] {
  return l
    .filter((x) => x && typeof x.code === 'string' && /^\d{2,6}$/.test(x.code))
    .slice(0, 80)
    .map((x) => ({
      code: x.code,
      libelle: String(x.libelle ?? x.code).slice(0, 160),
      prevu: nombre(x.prevu),
      realiseManuel: nombre(x.realiseManuel),
      commentaire: x.commentaire ? String(x.commentaire).slice(0, 500) : null,
    }));
}
