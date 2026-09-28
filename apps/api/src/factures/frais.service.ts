import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FileKind, Prisma, StatutNoteDeFrais } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { POSTES } from './factures.service';

/**
 * NOTES DE FRAIS, VALIDATION À DEUX, JOURNAL, RÉGLAGES.
 *
 * - Une note de frais est un ticket d'un bénévole ou d'un salarié. Elle se
 *   valide, se rembourse, ou fait l'objet d'un ABANDON : la personne renonce au
 *   remboursement, ce qui vaut don en nature pour une association d'intérêt
 *   général (reçu fiscal possible, art. 200 du CGI). L'outil produit le numéro
 *   de reçu et sa trace ; c'est l'association qui vérifie son éligibilité.
 * - La validation à deux : au-dessus du seuil réglé pour l'espace, une facture
 *   attend deux personnes différentes avant d'être « validée ».
 * - Le journal : qui a fait quoi, jamais modifié, pour un commissaire aux
 *   comptes ou un financeur.
 */

@Injectable()
export class FraisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  // ─── Journal ──────────────────────────────────────────────────────────────

  async journaliser(accountId: string, userId: string | null, action: string, cible?: string, detail?: Prisma.InputJsonValue) {
    await this.prisma.journalFactures.create({ data: { accountId, userId, action, cible: cible ?? null, detail } }).catch(() => undefined);
  }

  async journal(accountId: string) {
    const lignes = await this.prisma.journalFactures.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' }, take: 300 });
    const ids = [...new Set(lignes.map((l) => l.userId).filter((x): x is string => !!x))];
    const users = ids.length ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true, email: true } }) : [];
    const nom = new Map(users.map((u) => [u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email]));
    return lignes.map((l) => ({ id: l.id, le: l.createdAt, par: l.userId ? (nom.get(l.userId) ?? 'Compte supprimé') : 'Système', action: l.action, cible: l.cible, detail: l.detail }));
  }

  // ─── Réglages ─────────────────────────────────────────────────────────────

  async reglages(accountId: string) {
    const r = await this.prisma.reglagesFactures.findUnique({ where: { accountId } });
    return { seuilDoubleValidation: r?.seuilDoubleValidation === null || r?.seuilDoubleValidation === undefined ? null : Number(r.seuilDoubleValidation) };
  }

  async regler(accountId: string, userId: string, dto: { seuilDoubleValidation?: number | null }) {
    const data: Prisma.ReglagesFacturesUncheckedUpdateInput = {};
    if (dto.seuilDoubleValidation !== undefined) data.seuilDoubleValidation = dto.seuilDoubleValidation === null ? null : dto.seuilDoubleValidation;
    await this.prisma.reglagesFactures.upsert({ where: { accountId }, create: { accountId, seuilDoubleValidation: dto.seuilDoubleValidation ?? null }, update: data });
    await this.journaliser(accountId, userId, 'reglages.modifies', undefined, dto as Prisma.InputJsonValue);
    return this.reglages(accountId);
  }

  // ─── Validation à deux ────────────────────────────────────────────────────

  /**
   * Une personne valide. Sous le seuil (ou sans seuil), la facture passe
   * VALIDEE tout de suite ; au-dessus, il faut une seconde personne, différente.
   */
  async valider(accountId: string, userId: string, factureId: string) {
    const f = await this.prisma.factureFournisseur.findFirst({ where: { id: factureId, accountId }, include: { validations: true } });
    if (!f) throw new NotFoundException('Facture introuvable.');
    const r = await this.prisma.reglagesFactures.findUnique({ where: { accountId } });
    const seuil = r?.seuilDoubleValidation === null || r?.seuilDoubleValidation === undefined ? null : Number(r.seuilDoubleValidation);
    const besoin = seuil !== null && Number(f.montantTTC) >= seuil ? 2 : 1;
    if (f.validations.some((v) => v.userId === userId)) throw new BadRequestException('Vous avez déjà validé cette facture : il faut une seconde personne.');
    await this.prisma.validationFacture.create({ data: { factureId, userId } });
    const total = f.validations.length + 1;
    const complete = total >= besoin;
    if (complete && f.statut === 'A_VERIFIER') {
      await this.prisma.factureFournisseur.update({ where: { id: factureId }, data: { statut: 'VALIDEE', alerte: null } });
    }
    await this.journaliser(accountId, userId, complete ? 'facture.validee' : 'facture.validation-partielle', factureId, { montantTTC: Number(f.montantTTC), validations: total, requises: besoin });
    return { validations: total, requises: besoin, complete };
  }

  async etatValidation(accountId: string, factureIds: string[]) {
    const r = await this.prisma.reglagesFactures.findUnique({ where: { accountId } });
    const seuil = r?.seuilDoubleValidation === null || r?.seuilDoubleValidation === undefined ? null : Number(r.seuilDoubleValidation);
    const vs = await this.prisma.validationFacture.findMany({ where: { factureId: { in: factureIds } }, select: { factureId: true, userId: true } });
    const par = new Map<string, string[]>();
    for (const v of vs) par.set(v.factureId, [...(par.get(v.factureId) ?? []), v.userId]);
    return { seuil, par };
  }

  // ─── Notes de frais ───────────────────────────────────────────────────────

  async liste(accountId: string, annee?: number) {
    const a = annee ?? new Date().getFullYear();
    const notes = await this.prisma.noteDeFrais.findMany({ where: { accountId, date: { gte: new Date(`${a}-01-01`), lt: new Date(`${a + 1}-01-01`) } }, orderBy: { date: 'desc' } });
    const somme = (l: typeof notes) => Math.round(l.reduce((t, n) => t + Number(n.montant), 0) * 100) / 100;
    return {
      annee: a,
      resume: {
        aValider: somme(notes.filter((n) => n.statut === 'A_VALIDER')),
        aRembourser: somme(notes.filter((n) => n.statut === 'VALIDEE' && !n.abandon)),
        rembourse: somme(notes.filter((n) => n.statut === 'REMBOURSEE')),
        abandonne: somme(notes.filter((n) => n.statut === 'ABANDONNEE')),
      },
      notes: notes.map((n) => this.presenter(n)),
    };
  }

  async creer(accountId: string, userId: string, dto: { beneficiaire: string; date: string; objet: string; montant: number; poste?: string | null; enveloppeId?: string | null; abandon?: boolean; notes?: string | null }, fichier?: FichierRecu) {
    if (!dto.beneficiaire?.trim() || !dto.objet?.trim()) throw new BadRequestException('Bénéficiaire et objet sont nécessaires.');
    if (!(dto.montant > 0)) throw new BadRequestException('Le montant doit être positif.');
    let fileId: string | null = null;
    if (fichier) {
      if (!fichier.mimetype.startsWith('image/') && fichier.mimetype !== 'application/pdf') throw new BadRequestException('Le justificatif est une photo ou un PDF.');
      fileId = (await this.files.deposer({ fichier, famille: FileKind.COMPLIANCE, userId, accountId })).id;
    }
    const n = await this.prisma.noteDeFrais.create({
      data: {
        accountId,
        userId,
        beneficiaire: dto.beneficiaire.trim().slice(0, 120),
        date: new Date(dto.date),
        objet: dto.objet.trim().slice(0, 300),
        montant: Math.round(dto.montant * 100) / 100,
        poste: dto.poste && (POSTES as readonly string[]).includes(dto.poste) ? dto.poste : null,
        enveloppeId: dto.enveloppeId || null,
        abandon: !!dto.abandon,
        fileId,
        notes: dto.notes?.slice(0, 1000) ?? null,
      },
    });
    await this.journaliser(accountId, userId, 'note-de-frais.deposee', n.id, { montant: Number(n.montant), beneficiaire: n.beneficiaire });
    return this.presenter(n);
  }

  async changerStatut(accountId: string, userId: string, id: string, statut: StatutNoteDeFrais) {
    const n = await this.prisma.noteDeFrais.findFirst({ where: { id, accountId } });
    if (!n) throw new NotFoundException('Note de frais introuvable.');
    const data: Prisma.NoteDeFraisUncheckedUpdateInput = { statut };
    if (statut === 'ABANDONNEE') {
      data.abandon = true;
      // Numéro de reçu : année + compteur par espace, une fois pour toutes.
      if (!n.recuNumero) {
        const annee = n.date.getFullYear();
        const nb = await this.prisma.noteDeFrais.count({ where: { accountId, recuNumero: { startsWith: `AF-${annee}-` } } });
        data.recuNumero = `AF-${annee}-${String(nb + 1).padStart(4, '0')}`;
      }
    }
    const maj = await this.prisma.noteDeFrais.update({ where: { id }, data });
    await this.journaliser(accountId, userId, `note-de-frais.${statut.toLowerCase()}`, id, { montant: Number(n.montant), recu: maj.recuNumero });
    return this.presenter(maj);
  }

  async supprimer(accountId: string, userId: string, role: string, id: string) {
    const n = await this.prisma.noteDeFrais.findFirst({ where: { id, accountId } });
    if (!n) throw new NotFoundException('Note de frais introuvable.');
    if (n.statut === 'REMBOURSEE' || n.statut === 'ABANDONNEE') throw new BadRequestException('Une note remboursée ou abandonnée se garde : elle a une valeur comptable.');
    await this.prisma.noteDeFrais.delete({ where: { id } });
    if (n.fileId) await this.files.supprimer(n.fileId, userId, role as never).catch(() => undefined);
    await this.journaliser(accountId, userId, 'note-de-frais.supprimee', id);
    return { ok: true };
  }

  private presenter(n: { id: string; beneficiaire: string; date: Date; objet: string; montant: Prisma.Decimal; poste: string | null; fileId: string | null; statut: StatutNoteDeFrais; abandon: boolean; recuNumero: string | null; enveloppeId: string | null; notes: string | null; createdAt: Date }) {
    return { id: n.id, beneficiaire: n.beneficiaire, date: n.date, objet: n.objet, montant: Number(n.montant), poste: n.poste, fileId: n.fileId, statut: n.statut, abandon: n.abandon, recuNumero: n.recuNumero, enveloppeId: n.enveloppeId, notes: n.notes, deposeLe: n.createdAt };
  }
}
