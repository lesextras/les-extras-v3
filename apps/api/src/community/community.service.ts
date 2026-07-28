import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IdeaStatus, PointReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** 10 points = 1 € de réduction. Constante unique, utilisée partout. */
export const POINTS_PAR_EURO = 10;

/** Une réduction ne peut jamais dépasser 30 % d'une facture : la dette de
 *  points reste bornée et la marge protégée. */
export const PLAFOND_REDUCTION = 0.3;

/** Les points expirent au bout de 12 mois : la dette ne s'accumule pas
 *  indéfiniment au passif de l'association. */
export const VALIDITE_MOIS = 12;

/** Barème d'attribution — volontairement sobre pour maîtriser la dette. */
export const BAREME = {
  PUBLICATION: 20,
  ARTICLE: 30,
  MISSION: 50,
  AVIS: 25,
  IDEE: 40,
  /// Répondre à un pair dans l'Entraide.
  REPONSE: 15,
  /// Réponse désignée comme utile par celui qui avait le problème : c'est le
  /// seul signal de qualité qui vaille, il est le mieux récompensé après la
  /// mission réalisée.
  REPONSE_RETENUE: 40,
} as const;

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Points ───────────────────────────────────────────────────────────────

  /** Crédite des points et met à jour le solde, en une transaction. */
  async crediter(accountId: string, reason: PointReason, label: string, amount?: number) {
    const montant = amount ?? BAREME[reason as keyof typeof BAREME] ?? 0;
    if (!montant) return null;
    const [ligne] = await this.prisma.$transaction([
      this.prisma.loyaltyPoint.create({
        data: { accountId, amount: montant, reason, label },
      }),
      this.prisma.account.update({
        where: { id: accountId },
        data: { points: { increment: montant } },
      }),
    ]);
    return ligne;
  }

  /** Solde + historique + équivalent en euros. */
  async solde(accountId: string) {
    const [compte, lignes] = await Promise.all([
      this.prisma.account.findUnique({
        where: { id: accountId },
        select: { points: true },
      }),
      this.prisma.loyaltyPoint.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);
    const points = compte?.points ?? 0;
    // Points expirés : gagnés il y a plus de VALIDITE_MOIS et non dépensés.
    const limite = new Date();
    limite.setMonth(limite.getMonth() - VALIDITE_MOIS);
    const bientotPerimes = lignes
      .filter((l) => l.amount > 0 && l.createdAt < new Date(limite.getTime() + 60 * 86_400_000))
      .reduce((t, l) => t + l.amount, 0);
    return {
      points,
      euros: Math.floor(points / POINTS_PAR_EURO),
      pointsParEuro: POINTS_PAR_EURO,
      plafondReduction: PLAFOND_REDUCTION,
      validiteMois: VALIDITE_MOIS,
      bientotPerimes,
      bareme: BAREME,
      historique: lignes,
    };
  }

  /**
   * Réduction utilisable sur un montant donné : bornée par le solde ET par
   * le plafond de 30 % de la facture.
   */
  async reductionApplicable(accountId: string, montantHt: number) {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { points: true },
    });
    const dispo = Math.floor((compte?.points ?? 0) / POINTS_PAR_EURO);
    const plafond = Math.floor(montantHt * PLAFOND_REDUCTION);
    const reduction = Math.max(0, Math.min(dispo, plafond));
    return { reduction, pointsUtilises: reduction * POINTS_PAR_EURO, plafond, dispo };
  }

  // ── Boîte à idées ────────────────────────────────────────────────────────

  async listerIdees(userId: string) {
    const idees = await this.prisma.idea.findMany({
      where: { status: { not: IdeaStatus.DECLINED } },
      orderBy: [{ createdAt: 'desc' }],
      include: { votes: { select: { userId: true } }, account: { select: { name: true } } },
      take: 60,
    });
    return idees
      .map((i) => ({
        id: i.id,
        title: i.title,
        content: i.content,
        status: i.status,
        reply: i.reply,
        auteur: i.account?.name ?? '—',
        votes: i.votes.length,
        aVote: i.votes.some((v) => v.userId === userId),
        createdAt: i.createdAt,
      }))
      .sort((a, b) => b.votes - a.votes);
  }

  async creerIdee(accountId: string, authorId: string, dto: { title: string; content: string }) {
    const idee = await this.prisma.idea.create({
      data: { accountId, authorId, title: dto.title, content: dto.content },
    });
    // L'auteur vote automatiquement pour sa propre idée.
    await this.prisma.ideaVote.create({ data: { ideaId: idee.id, userId: authorId } }).catch(() => undefined);
    return idee;
  }

  /** Bascule le vote (un utilisateur = une voix par idée). */
  async voter(ideaId: string, userId: string) {
    const existe = await this.prisma.ideaVote.findUnique({
      where: { ideaId_userId: { ideaId, userId } },
    });
    if (existe) {
      await this.prisma.ideaVote.delete({ where: { id: existe.id } });
      return { vote: false };
    }
    const idee = await this.prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idee) throw new NotFoundException('Idée introuvable.');
    await this.prisma.ideaVote.create({ data: { ideaId, userId } });
    return { vote: true };
  }

  /** Arbitrage de l'équipe : statut + réponse publique (+ points si retenue). */
  async arbitrer(id: string, dto: { status: IdeaStatus; reply?: string }, estAdmin: boolean) {
    if (!estAdmin) throw new ForbiddenException('Réservé à l’équipe.');
    const idee = await this.prisma.idea.update({
      where: { id },
      data: { status: dto.status, reply: dto.reply },
    });
    if (dto.status === IdeaStatus.PLANNED || dto.status === IdeaStatus.DONE) {
      await this.crediter(idee.accountId, PointReason.IDEE, `Idée retenue : ${idee.title}`).catch(
        () => undefined,
      );
    }
    return idee;
  }
}
