import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EtapeProspect, Prisma, StatutPriseEnCharge, TypeFinanceur, type PriseEnCharge } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContexteGestion } from './contexte.service';
import { ModifierPriseEnChargeDto, PriseEnChargeDto, StatutPriseEnChargeDto } from './dto/gestion.dto';
import { DATE_DU_STATUT, PIECES_PAR_DEFAUT, PIECE_DU_STATUT, dateLimiteParDefaut, etatDossier, montantDemande, resumeDossiers } from './financements';

const n = (v: Prisma.Decimal | number | null | undefined) => (v === null || v === undefined ? 0 : Number(v));
const date = (v: string | null | undefined) => (v ? new Date(v) : null);
const vide = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

const INCLURE = {
  session: { select: { id: true, title: true, startDate: true, endDate: true, formation: { select: { title: true } } } },
  facture: { select: { id: true, numero: true, statut: true, totalTtc: true } },
  pieces: { orderBy: { ordre: 'asc' } },
} satisfies Prisma.PriseEnChargeInclude;

type DossierCharge = Prisma.PriseEnChargeGetPayload<{ include: typeof INCLURE }>;

/**
 * LES PRISES EN CHARGE : le dossier monté auprès d'un financeur (OPCO,
 * France Travail, CPF, entreprise) pour qu'une formation soit payée.
 *
 * Un dossier appartient au compte académie qui l'a créé ; la session et la
 * facture qu'on lui relie doivent être les siennes aussi (`ContexteGestion`).
 */
@Injectable()
export class PrisesEnChargeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
  ) {}

  private presenter(d: DossierCharge, maintenant = new Date()) {
    return {
      ...d,
      heures: n(d.heures),
      facture: d.facture ? { ...d.facture, totalTtc: n(d.facture.totalTtc) } : null,
      piecesFaites: d.pieces.filter((p) => p.cochee).length,
      ...etatDossier(d, maintenant),
    };
  }

  private async charger(accountId: string, id: string) {
    await this.ctx.academie(accountId);
    const d = await this.prisma.priseEnCharge.findFirst({ where: { id, accountId }, include: INCLURE });
    if (!d) throw new NotFoundException('Dossier introuvable.');
    return d;
  }

  private async verifierFacture(accountId: string, factureId: string) {
    const f = await this.prisma.factureOrganisme.findFirst({ where: { id: factureId, accountId }, select: { id: true } });
    if (!f) throw new BadRequestException("Cette facture n'appartient pas à ton académie.");
  }

  /* ============================================================ lecture */

  async liste(accountId: string, statut?: string) {
    await this.ctx.academie(accountId);
    const tous = await this.prisma.priseEnCharge.findMany({
      where: { accountId },
      orderBy: [{ updatedAt: 'desc' }],
      take: 500,
      include: INCLURE,
    });
    const maintenant = new Date();
    const filtres = statut && statut in StatutPriseEnCharge ? tous.filter((d) => d.statut === statut) : tous;
    return {
      dossiers: filtres.map((d) => this.presenter(d, maintenant)),
      resume: resumeDossiers(tous, maintenant),
    };
  }

  async resume(accountId: string) {
    await this.ctx.academie(accountId);
    const tous = await this.prisma.priseEnCharge.findMany({
      where: { accountId },
      select: { statut: true, dateLimiteDepot: true, dateFacturation: true, montantDemandeCents: true, montantAccordeCents: true },
    });
    return resumeDossiers(tous);
  }

  async detail(accountId: string, id: string) {
    return this.presenter(await this.charger(accountId, id));
  }

  /* ============================================================ écriture */

  async creer(accountId: string, dto: PriseEnChargeDto) {
    await this.ctx.academie(accountId);
    let debut = date(dto.dateDebutFormation);
    let fin = date(dto.dateFinFormation);
    let heures = dto.heures;
    if (dto.sessionId) {
      // Une session d'une autre académie lève ici.
      const s = await this.ctx.session(accountId, dto.sessionId);
      debut = debut ?? s.startDate;
      fin = fin ?? s.endDate ?? null;
      if (heures === undefined && s.dureeHeures) heures = n(s.dureeHeures);
    }
    const nb = dto.nbStagiaires ?? 1;
    const tarif = dto.tarifHoraireCents ?? 0;
    const h = heures ?? 0;

    let prospect: { id: string } | null = null;
    if (dto.prospectId) {
      prospect = await this.prisma.prospect.findFirst({ where: { id: dto.prospectId, accountId }, select: { id: true } });
      if (!prospect) throw new BadRequestException("Ce prospect n'appartient pas à ton académie.");
    }

    const d = await this.prisma.priseEnCharge.create({
      data: {
        accountId,
        sessionId: dto.sessionId ?? null,
        entrepriseNom: dto.entrepriseNom.trim(),
        entrepriseSiret: vide(dto.entrepriseSiret),
        contactNom: vide(dto.contactNom),
        contactEmail: vide(dto.contactEmail),
        financeur: dto.financeur ?? TypeFinanceur.OPCO,
        nomFinanceur: vide(dto.nomFinanceur),
        numeroDossier: vide(dto.numeroDossier),
        nbStagiaires: nb,
        heures: h,
        tarifHoraireCents: tarif,
        montantDemandeCents: dto.montantDemandeCents ?? montantDemande(nb, h, tarif),
        montantAccordeCents: dto.montantAccordeCents ?? null,
        salairesRembourses: dto.salairesRembourses ?? null,
        subrogation: dto.subrogation ?? false,
        dateDebutFormation: debut,
        dateLimiteDepot: date(dto.dateLimiteDepot) ?? dateLimiteParDefaut(debut),
        dateFinFormation: fin,
        notes: vide(dto.notes),
        pieces: { create: PIECES_PAR_DEFAUT.map((libelle, ordre) => ({ libelle, ordre })) },
      },
      include: INCLURE,
    });
    if (prospect) await this.prisma.prospect.update({ where: { id: prospect.id }, data: { priseEnChargeId: d.id } });
    return this.presenter(d);
  }

  async modifier(accountId: string, id: string, dto: ModifierPriseEnChargeDto) {
    const avant = await this.charger(accountId, id);
    if (dto.sessionId) await this.ctx.session(accountId, dto.sessionId);
    if (dto.factureId) await this.verifierFacture(accountId, dto.factureId);

    const data: Prisma.PriseEnChargeUncheckedUpdateInput = {};
    if (dto.entrepriseNom !== undefined) data.entrepriseNom = dto.entrepriseNom.trim();
    if (dto.entrepriseSiret !== undefined) data.entrepriseSiret = vide(dto.entrepriseSiret);
    if (dto.contactNom !== undefined) data.contactNom = vide(dto.contactNom);
    if (dto.contactEmail !== undefined) data.contactEmail = vide(dto.contactEmail);
    if (dto.financeur !== undefined) data.financeur = dto.financeur;
    if (dto.nomFinanceur !== undefined) data.nomFinanceur = vide(dto.nomFinanceur);
    if (dto.numeroDossier !== undefined) data.numeroDossier = vide(dto.numeroDossier);
    if (dto.sessionId !== undefined) data.sessionId = dto.sessionId || null;
    if (dto.factureId !== undefined) data.factureId = dto.factureId || null;
    if (dto.nbStagiaires !== undefined) data.nbStagiaires = dto.nbStagiaires;
    if (dto.heures !== undefined) data.heures = dto.heures;
    if (dto.tarifHoraireCents !== undefined) data.tarifHoraireCents = dto.tarifHoraireCents;
    if (dto.montantAccordeCents !== undefined) data.montantAccordeCents = dto.montantAccordeCents;
    if (dto.salairesRembourses !== undefined) data.salairesRembourses = dto.salairesRembourses;
    if (dto.subrogation !== undefined) data.subrogation = dto.subrogation;
    if (dto.notes !== undefined) data.notes = vide(dto.notes);
    for (const champ of ['dateDepot', 'dateAccord', 'dateFinFormation', 'dateFacturation', 'datePaiement'] as const) {
      if (dto[champ] !== undefined) data[champ] = date(dto[champ]);
    }

    // Le montant demandé suit stagiaires × heures × tarif, sauf s'il est saisi.
    if (dto.montantDemandeCents !== undefined) {
      data.montantDemandeCents = dto.montantDemandeCents;
    } else if (dto.nbStagiaires !== undefined || dto.heures !== undefined || dto.tarifHoraireCents !== undefined) {
      data.montantDemandeCents = montantDemande(
        dto.nbStagiaires ?? avant.nbStagiaires,
        dto.heures ?? n(avant.heures),
        dto.tarifHoraireCents ?? avant.tarifHoraireCents,
      );
    }
    // La date limite suit le début de la formation, sauf si elle est saisie.
    if (dto.dateDebutFormation !== undefined) data.dateDebutFormation = date(dto.dateDebutFormation);
    if (dto.dateLimiteDepot !== undefined) {
      data.dateLimiteDepot = date(dto.dateLimiteDepot);
    } else if (dto.dateDebutFormation !== undefined) {
      data.dateLimiteDepot = dateLimiteParDefaut(date(dto.dateDebutFormation));
    }

    const d = await this.prisma.priseEnCharge.update({ where: { id }, data, include: INCLURE });
    return this.presenter(d);
  }

  /** Change le statut, renseigne la date de l'étape (si vide) et coche la pièce qui va avec. */
  async changerStatut(accountId: string, id: string, dto: StatutPriseEnChargeDto) {
    const avant = await this.charger(accountId, id);
    const quand = dto.date ? new Date(dto.date) : new Date();
    const data: Prisma.PriseEnChargeUncheckedUpdateInput = { statut: dto.statut };
    const champ = DATE_DU_STATUT[dto.statut];
    if (champ && !(avant as PriseEnCharge)[champ]) data[champ] = quand;
    const piece = PIECE_DU_STATUT[dto.statut];
    const aCocher = piece ? avant.pieces.find((p) => p.libelle === piece && !p.cochee) : undefined;
    await this.prisma.$transaction([
      this.prisma.priseEnCharge.update({ where: { id }, data }),
      ...(aCocher ? [this.prisma.piecePriseEnCharge.update({ where: { id: aCocher.id }, data: { cochee: true, cocheeLe: quand } })] : []),
    ]);
    return this.detail(accountId, id);
  }

  async cocherPiece(accountId: string, id: string, pieceId: string, cochee: boolean) {
    const d = await this.charger(accountId, id);
    if (!d.pieces.some((p) => p.id === pieceId)) throw new NotFoundException('Pièce introuvable.');
    await this.prisma.piecePriseEnCharge.update({ where: { id: pieceId }, data: { cochee, cocheeLe: cochee ? new Date() : null } });
    return this.detail(accountId, id);
  }

  async supprimer(accountId: string, id: string) {
    await this.charger(accountId, id);
    await this.prisma.priseEnCharge.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Un prospect gagné devient un dossier de financement : entreprise et
   * contact recopiés, le reste à compléter. Un second clic rouvre le même.
   */
  async depuisProspect(accountId: string, prospectId: string) {
    await this.ctx.academie(accountId);
    const p = await this.prisma.prospect.findFirst({ where: { id: prospectId, accountId } });
    if (!p) throw new NotFoundException('Prospect introuvable.');
    if (p.priseEnChargeId) {
      const existant = await this.prisma.priseEnCharge.findFirst({ where: { id: p.priseEnChargeId, accountId }, include: INCLURE });
      if (existant) return this.presenter(existant);
    }
    if (p.etape !== EtapeProspect.GAGNE) throw new BadRequestException("Le dossier de financement se crée sur un prospect gagné.");
    return this.creer(accountId, {
      entrepriseNom: p.nom,
      contactNom: p.contactNom ?? undefined,
      contactEmail: p.contactEmail ?? undefined,
      montantDemandeCents: p.montantEstimeCents ?? undefined,
      notes: p.besoin ?? undefined,
      prospectId: p.id,
    });
  }
}
