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
  /// Créer sa toute première fiche, même en brouillon. Volontairement petit :
  /// ce n'est pas une contribution au catalogue, juste un encouragement à
  /// franchir le pas. La vraie récompense arrive à la publication (20).
  PREMIERE_FICHE: 2,
  /// Filleul parraine qui termine sa premiere mission : verse au parrain ET
  /// au filleul. La recompense arrive quand la valeur est prouvee, pas a
  /// l'inscription (sinon on paie des comptes vides).
  PARRAINAGE: 40,
  PUBLICATION: 20,
  ARTICLE: 30,
  MISSION: 50,
  AVIS: 25,
  IDEE: 40,
  /// Répondre à un pair dans le GAP (groupe d'analyse de pratique).
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
  /** Filleuls du compte : inscrits, et actifs (au moins une mission terminee). */
  async parrainage(accountId: string) {
    const filleuls = await this.prisma.account.findMany({
      where: { parrainAccountId: accountId },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const actifs = filleuls.length
      ? await this.prisma.booking.groupBy({
          by: ['accountId'],
          where: { accountId: { in: filleuls.map((f) => f.id) }, status: 'COMPLETED' },
        })
      : [];
    return {
      accountId,
      filleuls: filleuls.map((f) => ({ nom: f.name, depuis: f.createdAt })),
      inscrits: filleuls.length,
      actifs: actifs.length,
      pointsParFilleulActif: BAREME.PARRAINAGE,
    };
  }

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

  // ── Contributeurs ────────────────────────────────────────────────────────

  /**
   * Les contributions du mois.
   *
   * Volontairement SANS podium ni classement numéroté : le médico-social
   * déteste la compétition frontale, et un « 7ᵉ place » démobilise plus qu'il
   * ne motive. On montre qui a fait vivre le réseau ce mois-ci, et ce qu'ils
   * ont fait — c'est de la reconnaissance, pas un tableau de chasse.
   */
  async contributeurs() {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const lignes = await this.prisma.loyaltyPoint.findMany({
      where: { createdAt: { gte: debutMois }, amount: { gt: 0 } },
      select: {
        amount: true,
        reason: true,
        account: { select: { id: true, name: true, type: true, logoUrl: true, city: true } },
      },
    });

    const parCompte = new Map<
      string,
      {
        id: string;
        nom: string;
        type: string;
        logoUrl: string | null;
        ville: string | null;
        points: number;
        actions: Record<string, number>;
      }
    >();

    for (const l of lignes) {
      if (!l.account) continue;
      const cle = l.account.id;
      const courant = parCompte.get(cle) ?? {
        id: l.account.id,
        nom: l.account.name,
        type: l.account.type,
        logoUrl: l.account.logoUrl,
        ville: l.account.city,
        points: 0,
        actions: {} as Record<string, number>,
      };
      courant.points += l.amount;
      courant.actions[l.reason] = (courant.actions[l.reason] ?? 0) + 1;
      parCompte.set(cle, courant);
    }

    const contributeurs = [...parCompte.values()]
      .sort((a, b) => b.points - a.points)
      .slice(0, 12);

    // Totaux du mois : ce que la communauté a produit ensemble.
    const totaux = lignes.reduce<Record<string, number>>((acc, l) => {
      acc[l.reason] = (acc[l.reason] ?? 0) + 1;
      return acc;
    }, {});

    return {
      mois: debutMois,
      contributeurs,
      totaux,
      nbContributeurs: parCompte.size,
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
