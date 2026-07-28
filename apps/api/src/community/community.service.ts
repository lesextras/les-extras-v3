import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IdeaStatus, PointReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** 10 points = 1 € de réduction. Constante unique, utilisée partout. */
export const POINTS_PAR_EURO = 10;

/** Barème d'attribution — volontairement sobre pour maîtriser la dette. */
export const BAREME = {
  PUBLICATION: 20,
  ARTICLE: 30,
  MISSION: 50,
  AVIS: 25,
  IDEE: 40,
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
    return {
      points,
      euros: Math.floor(points / POINTS_PAR_EURO),
      pointsParEuro: POINTS_PAR_EURO,
      bareme: BAREME,
      historique: lignes,
    };
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
