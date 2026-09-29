import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProofDto } from './dto/upsert-proof.dto';

import { planifierReport, RNQ } from './referentiel';

/** Le repère qui dit que les preuves ont été reportées sur la numérotation officielle. */
const REPERE_REPORT = 'qualiopi.rnq.report-numerotation-officielle';

@Injectable()
export class QualiopiService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Le référentiel au démarrage : les 7 critères et 32 indicateurs sont
   * RÉÉCRITS à chaque démarrage (libellés et rattachements), pour qu'une
   * correction du référentiel arrive sans intervention. Avant la première
   * réécriture sur la numérotation officielle, les preuves déjà déposées sont
   * reportées sur le numéro qui porte leur sens (`planifierReport`), après une
   * copie intégrale gardée dans `Reglage`.
   */
  async onModuleInit() {
    try {
      await this.reporterPreuvesSiBesoin();
      for (const crit of RNQ) {
        const criterion = await this.prisma.qualiopiCriterion.upsert({
          where: { number: crit.c },
          create: { number: crit.c, title: crit.title },
          update: { title: crit.title },
        });
        for (const ind of crit.indicators) {
          await this.prisma.qualiopiIndicator.upsert({
            where: { number: ind.n },
            create: { number: ind.n, label: ind.label, criterionId: criterion.id },
            update: { label: ind.label, criterionId: criterion.id },
          });
        }
      }
    } catch {
      // Table pas encore créée (premier démarrage avant db push) : ignoré.
    }
  }

  /**
   * UNE SEULE FOIS : reporter les preuves déposées sous l'ancienne
   * numérotation. On reconnaît l'ancienne base à son indicateur 21, qui y
   * portait le handicap. Rien n'est perdu : copie intégrale d'abord, puis
   * remplacement dans une transaction.
   */
  async reporterPreuvesSiBesoin() {
    const deja = await this.prisma.reglage.findUnique({ where: { cle: REPERE_REPORT } });
    if (deja) return;
    const i21 = await this.prisma.qualiopiIndicator.findUnique({ where: { number: 21 } });
    const ancienne = !!i21 && /handicap/i.test(i21.label);
    const preuves = ancienne ? await this.prisma.qualiopiProof.findMany({ include: { indicator: { select: { number: true } } } }) : [];
    if (preuves.length) {
      const indicateurs = await this.prisma.qualiopiIndicator.findMany({ select: { id: true, number: true } });
      const idDe = new Map(indicateurs.map((i) => [i.number, i.id]));
      const plan = planifierReport(preuves.map((p) => ({ id: p.id, ofAccountId: p.ofAccountId, ancienNumero: p.indicator.number, status: p.status, label: p.label, documentUrl: p.documentUrl, updatedAt: p.updatedAt })));
      const sessionDe = new Map(preuves.map((p) => [p.id, p.sessionId]));
      const reviewedDe = new Map(preuves.map((p) => [p.id, p.reviewedAt]));
      await this.prisma.$transaction(async (tx) => {
        await tx.reglage.create({ data: { cle: `${REPERE_REPORT}.copie`, valeur: JSON.stringify(preuves.map((p) => ({ ...p, ancienNumero: p.indicator.number }))) } });
        await tx.qualiopiProof.deleteMany({ where: { id: { in: preuves.map((p) => p.id) } } });
        for (const r of plan) {
          const indicatorId = idDe.get(r.numero);
          if (!indicatorId) continue;
          await tx.qualiopiProof.create({
            data: { indicatorId, ofAccountId: r.ofAccountId, status: r.status as never, label: r.label, documentUrl: r.documentUrl, sessionId: sessionDe.get(r.depuis[0]) ?? null, reviewedAt: reviewedDe.get(r.depuis[0]) ?? null },
          });
        }
      });
    }
    await this.prisma.reglage.create({ data: { cle: REPERE_REPORT, valeur: JSON.stringify({ le: new Date().toISOString(), ancienne, preuves: preuves.length }) } });
  }

  /** Résout le compte OF (ADéPA) porteur de la certification. */
  private async resolveOfAccountId(): Promise<string> {
    const adepa = await this.prisma.account.findFirst({
      where: {
        type: 'ESTABLISHMENT',
        OR: [
          { name: { contains: 'adépa', mode: 'insensitive' } },
          { name: { contains: 'adepa', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (adepa) return adepa.id;
    const any = await this.prisma.account.findFirst({
      where: { type: 'ESTABLISHMENT' },
      orderBy: { createdAt: 'asc' },
    });
    if (any) return any.id;
    throw new BadRequestException('Aucun compte OF disponible.');
  }

  /** Matrice de conformité : critères → indicateurs → preuve de l'OF. */
  async conformite() {
    const ofAccountId = await this.resolveOfAccountId();
    const criteria = await this.prisma.qualiopiCriterion.findMany({
      orderBy: { number: 'asc' },
      include: {
        indicators: {
          orderBy: { number: 'asc' },
          include: {
            proofs: { where: { ofAccountId }, take: 1 },
          },
        },
      },
    });

    const indicators = criteria.flatMap((c) => c.indicators);
    const total = indicators.length;
    const byStatus = { TODO: 0, UPLOADED: 0, VALIDATED: 0, REJECTED: 0 };
    for (const ind of indicators) {
      const st = ind.proofs[0]?.status ?? 'TODO';
      byStatus[st as keyof typeof byStatus] += 1;
    }

    return {
      ofAccountId,
      total,
      summary: byStatus,
      criteria: criteria.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        indicators: c.indicators.map((i) => ({
          id: i.id,
          number: i.number,
          label: i.label,
          proof: i.proofs[0]
            ? {
                id: i.proofs[0].id,
                status: i.proofs[0].status,
                label: i.proofs[0].label,
                documentUrl: i.proofs[0].documentUrl,
                updatedAt: i.proofs[0].updatedAt,
              }
            : null,
        })),
      })),
    };
  }

  /** Dépose / met à jour la preuve d'un indicateur pour l'OF. */
  async upsertProof(indicatorId: string, dto: UpsertProofDto) {
    const ofAccountId = await this.resolveOfAccountId();
    const indicator = await this.prisma.qualiopiIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new BadRequestException('Indicateur introuvable.');

    return this.prisma.qualiopiProof.upsert({
      where: { indicatorId_ofAccountId: { indicatorId, ofAccountId } },
      create: {
        indicatorId,
        ofAccountId,
        label: dto.label,
        documentUrl: dto.documentUrl,
        status: dto.status ?? 'UPLOADED',
        reviewedAt: dto.status === 'VALIDATED' ? new Date() : undefined,
      },
      update: {
        label: dto.label,
        documentUrl: dto.documentUrl,
        status: dto.status,
        reviewedAt: dto.status === 'VALIDATED' ? new Date() : undefined,
      },
    });
  }
}
