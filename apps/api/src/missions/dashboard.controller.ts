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
 * CE QUI ATTEND UN GESTE DE CE COMPTE, ÉTAT PAR ÉTAT.
 *
 * ⚠⚠ LE BLOC « À FAIRE » DU TABLEAU DE BORD DISAIT « TOUT EST À JOUR » PENDANT
 * QUE TREIZE RÉSERVATIONS SUR DIX-SEPT ATTENDAIENT QUELQU'UN. Mesuré en
 * production le 21/09/2026 : 5 REQUESTED, 1 ACCEPTED, 8 CONFIRMED, une seule
 * COMPLETED — et six factures en brouillon. L'écran n'avait que quatre
 * sources, dont `upcomingBookings`, qui AGRÈGE `ACCEPTED|CONFIRMED|IN_PROGRESS`
 * en un seul nombre et s'affiche « N interventions à venir ». C'est une
 * information, pas un geste : elle ne dit pas laquelle attend quoi, ni où
 * cliquer. Une file d'attente qui s'annonce vide ne se vide jamais.
 *
 * ⚠ ON COMPTE DU CÔTÉ DE L'OFFREUR, ET C'EST LA SEULE LECTURE JUSTE.
 * `assertOffreur` (bookings.service.ts) réserve `accept`, `confirm`, `start` et
 * `complete` à celui qui a été SOLLICITÉ — l'établissement qui a publié la
 * mission, ou l'intervenant qui propose l'atelier. Compter sur
 * `Booking.accountId` (le DEMANDEUR) mettrait dans la liste des gestes que le
 * serveur refuserait : le bouton mènerait à un 403. C'est le même défaut, en
 * miroir, que celui du compteur « interventions à venir » corrigé le 3/09.
 *
 * ⚠ REQUESTED EST COUPÉ EN DEUX, parce que les deux se réparent sur DEUX
 * ÉCRANS DIFFÉRENTS : une candidature à un renfort s'examine sur le board
 * `/dashboard/renforts` (qui porte la file d'engagement), une demande
 * d'atelier s'accepte sur `/dashboard/ateliers`. Un seul compteur enverrait la
 * moitié des gens au mauvais endroit.
 *
 * ⚠ LES FACTURES COMPTÉES SONT CELLES DONT CE COMPTE EST L'ÉMETTEUR
 * (`Invoice.accountId`), jamais le payeur : `issue` est réservé à l'émetteur
 * (`assertEmetteur`). Un brouillon ne part pas tout seul — c'est le dernier
 * mètre du chemin de l'argent, et personne ne le voyait.
 */
export interface AFaire {
  candidaturesAExaminer: number;
  demandesAAccepter: number;
  aConfirmer: number;
  aDemarrer: number;
  aTerminer: number;
  facturesBrouillon: number;
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

  /**
   * Les files qui attendent un geste de ce compte. Identique pour les deux
   * types de compte : ce n'est pas le type qui décide de ce qu'on peut faire
   * avancer, c'est le fait d'être l'offreur de la réservation.
   */
  private async aFaire(accountId: string): Promise<AFaire> {
    const [parMission, parService, facturesBrouillon] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { mission: { accountId } },
        _count: { _all: true },
      }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { service: { accountId } },
        _count: { _all: true },
      }),
      this.prisma.invoice.count({ where: { accountId, status: 'DRAFT' } }),
    ]);

    const n = (
      lignes: { status: string; _count: { _all: number } }[],
      etat: string,
    ) => lignes.find((l) => l.status === etat)?._count._all ?? 0;

    return {
      candidaturesAExaminer: n(parMission, 'REQUESTED'),
      demandesAAccepter: n(parService, 'REQUESTED'),
      aConfirmer: n(parMission, 'ACCEPTED') + n(parService, 'ACCEPTED'),
      aDemarrer: n(parMission, 'CONFIRMED') + n(parService, 'CONFIRMED'),
      aTerminer: n(parMission, 'IN_PROGRESS') + n(parService, 'IN_PROGRESS'),
      facturesBrouillon,
    };
  }

  @Get('stats')
  async stats(@CurrentAccount() account: AccountCtx) {
    const maintenant = new Date();
    const il30Jours = new Date(maintenant.getTime() - 30 * 86_400_000);

    if (account.type === 'ESTABLISHMENT') {
      const [activeMissions, applications, upcomingBookings, publiees, aFaire] = await Promise.all([
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
        this.aFaire(account.id),
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

      return { activeMissions, applications, upcomingBookings, fillRate, delaiMoyenHeures, aFaire };
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
    const [applications, upcomingBookings, reglees, nonLus, aFaire] = await Promise.all([
      this.prisma.booking.count({ where: { accountId: account.id, status: 'REQUESTED' } }),
      // ⚠ « INTERVENTIONS À VENIR » NE COMPTAIT QUE LA MOITIÉ DU MÉTIER.
      //
      // `Booking.accountId` désigne le compte QUI DEMANDE. Pour un intervenant,
      // il ne vaut le sien que sur ses candidatures à un renfort. Un atelier de
      // son catalogue réservé par un établissement porte l'identifiant de
      // l'ÉTABLISSEMENT — le compteur l'ignorait donc entièrement.
      //
      // Mesuré en production le 3/09/2026 : huit réservations confirmées, et un
      // intervenant qui a un atelier bloqué la semaine prochaine lisait
      // « 0 intervention à venir » sur son tableau de bord. Un compteur faux
      // vaut moins que pas de compteur : il fait croire qu'il n'y a rien à
      // préparer.
      this.prisma.booking.count({
        where: {
          status: { in: ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'] },
          OR: [
            { accountId: account.id },
            { service: { accountId: account.id } },
            { mission: { accountId: account.id } },
          ],
        },
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
      this.aFaire(account.id),
    ]);
    return {
      applications,
      upcomingBookings,
      revenueMonth: Number(reglees._sum.amount ?? 0),
      unreadMessages: nonLus,
      aFaire,
    };
  }
}
