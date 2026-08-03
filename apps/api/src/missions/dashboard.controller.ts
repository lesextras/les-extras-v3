import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface AccountCtx {
  id: string;
  type: string;
}


/**
 * Statistiques du hub de tableau de bord. Tout est calcule sur les donnees
 * reelles du compte — la carte « Taux de couverture » et le delai moyen de
 * pourvoi sont les deux chiffres que les etablissements comparent d'une
 * plateforme a l'autre.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, AccountGuard)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats(@CurrentAccount() account: AccountCtx) {
    const maintenant = new Date();
    const il30Jours = new Date(maintenant.getTime() - 30 * 86_400_000);

    if (account.type === 'ESTABLISHMENT') {
      const [activeMissions, applications, upcomingBookings, publiees] = await Promise.all([
        this.prisma.reliefMission.count({
          where: { accountId: account.id, status: 'PUBLISHED' },
        }),
        this.prisma.booking.count({
          where: { mission: { accountId: account.id }, status: 'REQUESTED' },
        }),
        this.prisma.booking.count({
          where: {
            mission: { accountId: account.id },
            status: { in: ['ACCEPTED', 'CONFIRMED'] },
          },
        }),
        // Missions publiees sur 30 jours, avec leurs reservations retenues :
        // base du taux de couverture et du delai moyen de pourvoi.
        this.prisma.reliefMission.findMany({
          where: {
            accountId: account.id,
            publishedAt: { gte: il30Jours },
            status: { not: 'DRAFT' },
          },
          select: {
            publishedAt: true,
            bookings: {
              where: { status: { in: ['ACCEPTED', 'CONFIRMED', 'COMPLETED'] } },
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { createdAt: true },
            },
          },
        }),
      ]);

      const pourvues = publiees.filter((m) => m.bookings.length > 0);
      const fillRate = publiees.length > 0 ? Math.round((pourvues.length / publiees.length) * 100) : 0;
      const delais = pourvues
        .filter((m) => m.publishedAt)
        .map((m) => m.bookings[0].createdAt.getTime() - m.publishedAt!.getTime())
        .filter((d) => d >= 0);
      const delaiMoyenHeures =
        delais.length > 0
          ? Math.round((delais.reduce((a, b) => a + b, 0) / delais.length / 3_600_000) * 10) / 10
          : null;

      return { activeMissions, applications, upcomingBookings, fillRate, delaiMoyenHeures };
    }

    // FREELANCE : ses candidatures en cours, ses missions a venir, et les
    // deux chiffres que l'ecran affichait sans que personne ne les calcule —
    // « Revenus du mois » et « messages non lus » restaient a zero a vie.
    const debutDuMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const compte = await this.prisma.account.findUnique({
      where: { id: account.id },
      select: { ownerId: true },
    });
    const ownerId = compte?.ownerId ?? '';
    const [applications, upcomingBookings, reglees, nonLus] = await Promise.all([
      this.prisma.booking.count({ where: { accountId: account.id, status: 'REQUESTED' } }),
      this.prisma.booking.count({
        where: { accountId: account.id, status: { in: ['ACCEPTED', 'CONFIRMED'] } },
      }),
      this.prisma.invoice.aggregate({
        where: {
          accountId: account.id,
          status: 'PAID',
          createdAt: { gte: debutDuMois },
        },
        _sum: { amount: true },
      }),
      this.prisma.message.count({
        where: {
          readAt: null,
          senderId: { not: ownerId },
          conversation: {
            messages: { some: { senderId: ownerId } },
          },
        },
      }),
    ]);
    return {
      applications,
      upcomingBookings,
      revenueMonth: Number(reglees._sum.amount ?? 0),
      unreadMessages: nonLus,
    };
  }
}
