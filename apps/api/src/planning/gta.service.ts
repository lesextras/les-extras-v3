import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountRole, LeaveStatus, LeaveType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Roles habilites a decider des conges et a derouler des cycles. */
const RESPONSABLES: AccountRole[] = [AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER];

const LIBELLE_TYPE: Record<LeaveType, string> = {
  CONGE: 'Congés payés',
  RTT: 'RTT',
  MALADIE: 'Arrêt maladie',
  SANS_SOLDE: 'Congé sans solde',
  AUTRE: 'Absence',
};

/** Solde annuel de reference (jours ouvres) — parametrable plus tard. */
const SOLDE_CONGES_ANNUEL = 25;

/**
 * GTA : conges avec validation, compteurs par membre, cycles de planning,
 * export des elements de paie. Tout est calcule sur les donnees reelles du
 * compte (shifts + conges approuves) — rien n'est estime.
 */
@Injectable()
export class GtaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Congés ────────────────────────────────────────────────────────────────

  async creerConge(
    accountId: string,
    userId: string,
    dto: { type?: LeaveType; debut: string; fin: string; motif?: string },
  ) {
    const debut = new Date(dto.debut);
    const fin = new Date(dto.fin);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || fin < debut) {
      throw new BadRequestException('Période invalide : la fin doit être après le début.');
    }
    const demande = await this.prisma.leaveRequest.create({
      data: { accountId, userId, type: dto.type ?? 'CONGE', debut, fin, motif: dto.motif ?? null },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    // Prevenir les responsables du compte.
    const responsables = await this.prisma.membership.findMany({
      where: { accountId, role: { in: RESPONSABLES }, status: 'ACTIVE', userId: { not: userId } },
      select: { userId: true },
    });
    const nom = [demande.user.firstName, demande.user.lastName].filter(Boolean).join(' ') || 'Un membre';
    await Promise.allSettled(
      responsables.map((r) =>
        this.notifications.create(r.userId, {
          type: 'CONGE_DEMANDE',
          title: 'Demande de congé',
          body: `${nom} demande ${LIBELLE_TYPE[demande.type].toLowerCase()} du ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}.`,
          link: '/dashboard/conges',
        }),
      ),
    );
    return demande;
  }

  async listerConges(accountId: string, userId: string, role: AccountRole) {
    const where: Prisma.LeaveRequestWhereInput = RESPONSABLES.includes(role)
      ? { accountId }
      : { accountId, userId };
    return this.prisma.leaveRequest.findMany({
      where,
      orderBy: [{ statut: 'asc' }, { debut: 'desc' }],
      take: 200,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async deciderConge(
    accountId: string,
    id: string,
    decideurId: string,
    role: AccountRole,
    statut: 'APPROUVE' | 'REFUSE',
  ) {
    if (!RESPONSABLES.includes(role)) {
      throw new ForbiddenException('Seul un responsable peut décider des congés.');
    }
    const demande = await this.prisma.leaveRequest.findFirst({
      where: { id, accountId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!demande) throw new NotFoundException('Demande introuvable.');
    if (demande.statut !== LeaveStatus.EN_ATTENTE) {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }
    const maj = await this.prisma.leaveRequest.update({
      where: { id },
      data: { statut, decideurId, decideLe: new Date() },
    });
    // Une absence approuvee apparait dans le planning : un shift dedie, non
    // ambigu, qui declenchera les detections de conflits comme le reste.
    if (statut === 'APPROUVE') {
      const nom = [demande.user.firstName, demande.user.lastName].filter(Boolean).join(' ');
      const finJournee = new Date(demande.fin);
      finJournee.setHours(23, 59, 0, 0);
      await this.prisma.shift.create({
        data: {
          accountId,
          title: `${LIBELLE_TYPE[demande.type]} — ${nom}`.trim(),
          startAt: demande.debut,
          endAt: finJournee,
          freelanceId: demande.userId,
          status: 'CONFIRMED',
          notes: demande.motif,
        },
      });
    }
    await this.notifications.create(demande.userId, {
      type: 'CONGE_DECISION',
      title: statut === 'APPROUVE' ? 'Congé approuvé' : 'Congé refusé',
      body: `Votre demande (${LIBELLE_TYPE[demande.type].toLowerCase()}, du ${demande.debut.toLocaleDateString('fr-FR')} au ${demande.fin.toLocaleDateString('fr-FR')}) a été ${statut === 'APPROUVE' ? 'approuvée' : 'refusée'}.`,
      link: '/dashboard/conges',
    });
    return maj;
  }

  // ── Compteurs ────────────────────────────────────────────────────────────

  /**
   * Compteurs par membre : heures planifiees sur le mois (shifts), jours de
   * conges approuves sur l'annee, solde restant (base 25 j), alerte si une
   * semaine du mois depasse 48 h planifiees.
   */
  async compteurs(accountId: string, mois?: string) {
    const reference = mois && /^\d{4}-\d{2}$/.test(mois) ? new Date(`${mois}-01T00:00:00Z`) : new Date();
    const debutMois = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
    const finMois = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));
    const debutAnnee = new Date(Date.UTC(reference.getUTCFullYear(), 0, 1));

    const membres = await this.prisma.membership.findMany({
      where: { accountId, status: 'ACTIVE' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    const userIds = membres.map((m) => m.user.id);

    const [shifts, conges] = await Promise.all([
      this.prisma.shift.findMany({
        where: {
          accountId,
          freelanceId: { in: userIds },
          status: { in: ['PLANNED', 'CONFIRMED', 'DONE'] },
          startAt: { gte: debutMois, lt: finMois },
        },
        select: { freelanceId: true, startAt: true, endAt: true, title: true },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          accountId,
          userId: { in: userIds },
          statut: 'APPROUVE',
          debut: { gte: debutAnnee },
        },
        select: { userId: true, type: true, debut: true, fin: true },
      }),
    ]);

    const jours = (debut: Date, fin: Date) =>
      Math.max(1, Math.round((fin.getTime() - debut.getTime()) / 86_400_000) + 1);

    return membres.map((m) => {
      // Heures planifiees : on exclut les shifts d'absence (crees par la GTA).
      const travail = shifts.filter(
        (s) =>
          s.freelanceId === m.user.id &&
          !Object.values(LIBELLE_TYPE).some((l) => s.title.startsWith(l)),
      );
      const heuresMois =
        Math.round(
          (travail.reduce((acc, s) => acc + (s.endAt.getTime() - s.startAt.getTime()), 0) /
            3_600_000) * 10,
        ) / 10;
      // Alerte 48 h : somme par semaine ISO du mois.
      const parSemaine = new Map<string, number>();
      for (const s of travail) {
        const d = new Date(s.startAt);
        const lundi = new Date(d);
        lundi.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
        const cle = lundi.toISOString().slice(0, 10);
        parSemaine.set(cle, (parSemaine.get(cle) ?? 0) + (s.endAt.getTime() - s.startAt.getTime()) / 3_600_000);
      }
      const semainesChargees = [...parSemaine.entries()]
        .filter(([, h]) => h > 48)
        .map(([semaine, h]) => ({ semaine, heures: Math.round(h * 10) / 10 }));

      const sesConges = conges.filter((c) => c.userId === m.user.id);
      const joursConges = sesConges
        .filter((c) => c.type === 'CONGE' || c.type === 'RTT')
        .reduce((acc, c) => acc + jours(c.debut, c.fin), 0);

      return {
        userId: m.user.id,
        nom: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || '—',
        role: m.role,
        heuresPlanifieesMois: heuresMois,
        joursCongesPris: joursConges,
        soldeConges: Math.max(0, SOLDE_CONGES_ANNUEL - joursConges),
        semainesAuDela48h: semainesChargees,
      };
    });
  }

  // ── Cycles de planning ───────────────────────────────────────────────────

  /**
   * Deroule la semaine [lundi, lundi+7) sur N semaines suivantes : chaque
   * shift est copie en decalant les dates. Les copies en conflit (meme
   * personne, periode chevauchante) sont sautees et signalees.
   */
  async deroulerCycle(accountId: string, role: AccountRole, dto: { lundi: string; semaines: number }) {
    if (!RESPONSABLES.includes(role)) {
      throw new ForbiddenException('Seul un responsable peut dérouler un cycle de planning.');
    }
    const lundi = new Date(dto.lundi);
    const semaines = Math.min(Math.max(dto.semaines | 0, 1), 12);
    if (Number.isNaN(lundi.getTime())) throw new BadRequestException('Date de semaine invalide.');
    const finSemaine = new Date(lundi.getTime() + 7 * 86_400_000);
    const source = await this.prisma.shift.findMany({
      where: { accountId, startAt: { gte: lundi, lt: finSemaine }, bookingId: null },
    });
    if (source.length === 0) {
      throw new BadRequestException('Aucun créneau saisi sur la semaine choisie.');
    }
    let crees = 0;
    const sautes: string[] = [];
    for (let s = 1; s <= semaines; s++) {
      const decalage = s * 7 * 86_400_000;
      for (const shift of source) {
        const startAt = new Date(shift.startAt.getTime() + decalage);
        const endAt = new Date(shift.endAt.getTime() + decalage);
        // Conflit personne (chevauchement) ou copie deja existante -> on saute.
        const existe = await this.prisma.shift.findFirst({
          where: shift.freelanceId
            ? {
                freelanceId: shift.freelanceId,
                status: { in: ['PLANNED', 'CONFIRMED'] },
                startAt: { lt: endAt },
                endAt: { gt: startAt },
              }
            : { accountId, title: shift.title, startAt },
          select: { id: true },
        });
        if (existe) {
          sautes.push(`${shift.title} — semaine +${s}`);
          continue;
        }
        await this.prisma.shift.create({
          data: {
            accountId,
            title: shift.title,
            startAt,
            endAt,
            freelanceId: shift.freelanceId,
            missionId: null,
            notes: shift.notes,
          },
        });
        crees += 1;
      }
    }
    return { crees, sautes };
  }

  // ── Export elements de paie ──────────────────────────────────────────────

  /** CSV par membre : heures planifiees du mois + jours d'absence par type. */
  async exportEvp(accountId: string, mois?: string): Promise<string> {
    const lignesCompteurs = await this.compteurs(accountId, mois);
    const reference = mois && /^\d{4}-\d{2}$/.test(mois) ? mois : new Date().toISOString().slice(0, 7);
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const lignes = [
      ['Mois', 'Membre', 'Role', 'Heures planifiees', 'Jours de conges pris (annee)', 'Solde conges'].join(';'),
    ];
    for (const c of lignesCompteurs) {
      lignes.push(
        [
          reference,
          esc(c.nom),
          c.role,
          String(c.heuresPlanifieesMois).replace('.', ','),
          String(c.joursCongesPris),
          String(c.soldeConges),
        ].join(';'),
      );
    }
    return '﻿' + lignes.join('\r\n');
  }
}
