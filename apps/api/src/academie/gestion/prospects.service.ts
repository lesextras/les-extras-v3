import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EtapeProspect, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContexteGestion } from './contexte.service';
import { EtapeProspectDto, ModifierProspectDto, ProspectDto } from './dto/gestion.dto';
import { actionEnRetard, resumeProspects } from './financements';

const date = (v: string | null | undefined) => (v ? new Date(v) : null);
const vide = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

const INCLURE = {
  priseEnCharge: { select: { id: true, statut: true } },
  facture: { select: { id: true, numero: true, type: true, statut: true } },
} satisfies Prisma.ProspectInclude;

/**
 * LES PROSPECTS DE L'ACADÉMIE : un CRM court, cinq étapes et une prochaine
 * action datée. Un prospect gagné devient un dossier de financement
 * (`PrisesEnChargeService.depuisProspect`).
 */
@Injectable()
export class ProspectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
  ) {}

  private async charger(accountId: string, id: string) {
    await this.ctx.academie(accountId);
    const p = await this.prisma.prospect.findFirst({ where: { id, accountId }, include: INCLURE });
    if (!p) throw new NotFoundException('Prospect introuvable.');
    return p;
  }

  private presenter<T extends { etape: EtapeProspect; dateProchaineAction: Date | null }>(p: T, maintenant = new Date()) {
    return { ...p, actionEnRetard: actionEnRetard(p, maintenant) };
  }

  async liste(accountId: string) {
    await this.ctx.academie(accountId);
    const prospects = await this.prisma.prospect.findMany({
      where: { accountId },
      orderBy: [{ updatedAt: 'desc' }],
      take: 1000,
      include: INCLURE,
    });
    const maintenant = new Date();
    return { prospects: prospects.map((p) => this.presenter(p, maintenant)), resume: resumeProspects(prospects, maintenant) };
  }

  async resume(accountId: string) {
    await this.ctx.academie(accountId);
    const prospects = await this.prisma.prospect.findMany({
      where: { accountId },
      select: { etape: true, montantEstimeCents: true, dateProchaineAction: true },
    });
    return resumeProspects(prospects);
  }

  async detail(accountId: string, id: string) {
    return this.presenter(await this.charger(accountId, id));
  }

  async creer(accountId: string, dto: ProspectDto) {
    await this.ctx.academie(accountId);
    const p = await this.prisma.prospect.create({
      data: {
        accountId,
        nom: dto.nom.trim(),
        contactNom: vide(dto.contactNom),
        contactEmail: vide(dto.contactEmail),
        telephone: vide(dto.telephone),
        source: vide(dto.source),
        besoin: vide(dto.besoin),
        montantEstimeCents: dto.montantEstimeCents ?? null,
        etape: dto.etape ?? EtapeProspect.NOUVEAU,
        prochaineAction: vide(dto.prochaineAction),
        dateProchaineAction: date(dto.dateProchaineAction),
        notes: vide(dto.notes),
      },
      include: INCLURE,
    });
    return this.presenter(p);
  }

  async modifier(accountId: string, id: string, dto: ModifierProspectDto) {
    await this.charger(accountId, id);
    if (dto.factureId) {
      const f = await this.prisma.factureOrganisme.findFirst({ where: { id: dto.factureId, accountId }, select: { id: true } });
      if (!f) throw new BadRequestException("Ce devis n'appartient pas à ton académie.");
    }
    const data: Prisma.ProspectUncheckedUpdateInput = {};
    if (dto.nom !== undefined) data.nom = dto.nom.trim();
    for (const champ of ['contactNom', 'contactEmail', 'telephone', 'source', 'besoin', 'prochaineAction', 'notes'] as const) {
      if (dto[champ] !== undefined) data[champ] = vide(dto[champ]);
    }
    if (dto.montantEstimeCents !== undefined) data.montantEstimeCents = dto.montantEstimeCents;
    if (dto.dateProchaineAction !== undefined) data.dateProchaineAction = date(dto.dateProchaineAction);
    if (dto.factureId !== undefined) data.factureId = dto.factureId || null;
    const p = await this.prisma.prospect.update({ where: { id }, data, include: INCLURE });
    return this.presenter(p);
  }

  async changerEtape(accountId: string, id: string, dto: EtapeProspectDto) {
    await this.charger(accountId, id);
    const p = await this.prisma.prospect.update({ where: { id }, data: { etape: dto.etape }, include: INCLURE });
    return this.presenter(p);
  }

  async supprimer(accountId: string, id: string) {
    await this.charger(accountId, id);
    await this.prisma.prospect.delete({ where: { id } });
    return { ok: true };
  }
}
