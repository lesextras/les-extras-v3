import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Poids des critères (somme = 1). Ajustables → moteur transparent & tunable. */
const WEIGHTS = {
  job: 0.30,
  geo: 0.25,
  skills: 0.15,
  availability: 0.15,
  reliability: 0.10,
  responsiveness: 0.05,
};

interface Factor { key: string; label: string; score: number; weight: number; }

function ci(s?: string | null) { return (s ?? '').trim().toLowerCase(); }
function dept(pc?: string | null) { return (pc ?? '').trim().slice(0, 2); }
function tokens(...parts: (string | null | undefined)[]) {
  return parts.join(' ').toLowerCase().split(/[^a-zàâäéèêëïîôöùûüç0-9]+/).filter((t) => t.length > 2);
}

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  // --- scoring unitaire ---------------------------------------------------
  private scoreJob(missionJob?: string | null, missionCat?: string | null, profileJob?: string | null): number {
    const mj = ci(missionJob), pj = ci(profileJob);
    if (!mj) return pj ? 0.6 : 0.4;
    if (!pj) return 0.25;
    if (mj === pj) return 1;
    if (mj.includes(pj) || pj.includes(mj)) return 0.75;
    // proximité par famille de mots
    const overlap = tokens(missionJob, missionCat).filter((t) => pj.includes(t)).length;
    return overlap > 0 ? 0.55 : 0.3;
  }

  private scoreGeo(mCity?: string | null, mPc?: string | null, pCity?: string | null, pPc?: string | null, radiusKm?: number | null): number {
    if (!mCity && !mPc) return 0.6;
    if (mCity && pCity && ci(mCity) === ci(pCity)) return 1;
    if (mPc && pPc && dept(mPc) === dept(pPc)) return 0.78;
    if ((radiusKm ?? 0) >= 50) return 0.45;
    if ((radiusKm ?? 0) >= 30) return 0.3;
    return 0.12;
  }

  private scoreSkills(missionNeeds: string[], skills: string[]): number {
    if (!skills.length) return 0.3;
    if (!missionNeeds.length) return 0.5;
    const s = skills.map(ci);
    const hits = missionNeeds.filter((n) => s.some((sk) => sk.includes(n) || n.includes(sk))).length;
    return Math.min(1, 0.3 + (hits / missionNeeds.length) * 0.9);
  }

  private scoreAvailability(available: boolean, hasConflict: boolean): number {
    if (!available) return 0.1;
    return hasConflict ? 0.4 : 1;
  }

  private scoreReliability(avgRating: number, reviewCount: number): number {
    const r = avgRating > 0 ? avgRating / 5 : 0.5;
    const xp = Math.min(1, reviewCount / 10);
    return r * 0.7 + xp * 0.3;
  }

  private scoreResponsiveness(lastLoginAt?: Date | null): number {
    if (!lastLoginAt) return 0.3;
    const days = (Date.now() - new Date(lastLoginAt).getTime()) / 86400000;
    if (days <= 7) return 1;
    if (days <= 30) return 0.7;
    if (days <= 90) return 0.4;
    return 0.2;
  }

  private label(total: number): string {
    if (total >= 80) return 'Excellent';
    if (total >= 62) return 'Bon';
    if (total >= 42) return 'Correct';
    return 'Faible';
  }

  private compose(factors: Factor[]) {
    const total = Math.round(factors.reduce((acc, f) => acc + f.score * f.weight, 0) * 100);
    return {
      total,
      label: this.label(total),
      breakdown: factors.map((f) => ({
        key: f.key, label: f.label,
        score: Math.round(f.score * 100),
        weight: Math.round(f.weight * 100),
        points: Math.round(f.score * f.weight * 100),
      })),
    };
  }

  // --- Candidats classés pour une mission (côté ESTABLISHMENT) ------------
  async candidatesForMission(missionId: string, accountId: string) {
    const mission = await this.prisma.reliefMission.findFirst({ where: { id: missionId, accountId } });
    if (!mission) return { mission: null, candidates: [] };

    const needs = tokens(mission.title, mission.description, mission.job, mission.category);
    const freelanceAccounts = await this.prisma.account.findMany({
      where: { type: 'FREELANCE' },
      include: { owner: { include: { profile: true } } },
    });

    const results = [];
    for (const acc of freelanceAccounts) {
      const u = acc.owner;
      if (!u) continue;
      const p = u.profile;
      const agg = await this.prisma.review.aggregate({ where: { targetId: u.id }, _avg: { rating: true }, _count: true });
      const avgRating = agg._avg.rating ?? 0;
      const reviewCount = agg._count ?? 0;
      // conflit : shift existant qui chevauche la fenêtre de la mission
      let hasConflict = false;
      if (mission.startDate) {
        const end = mission.endDate ?? mission.startDate;
        const conflict = await this.prisma.shift.count({
          where: { freelanceId: u.id, status: { in: ['PLANNED', 'CONFIRMED'] }, startAt: { lte: end }, endAt: { gte: mission.startDate } },
        });
        hasConflict = conflict > 0;
      }
      const factors: Factor[] = [
        { key: 'job', label: 'Métier', score: this.scoreJob(mission.job, mission.category, p?.job), weight: WEIGHTS.job },
        { key: 'geo', label: 'Proximité', score: this.scoreGeo(mission.city, mission.postalCode, p?.city, p?.postalCode, p?.radiusKm), weight: WEIGHTS.geo },
        { key: 'skills', label: 'Compétences', score: this.scoreSkills(needs, p?.skills ?? []), weight: WEIGHTS.skills },
        { key: 'availability', label: 'Disponibilité', score: this.scoreAvailability(p?.available ?? true, hasConflict), weight: WEIGHTS.availability },
        { key: 'reliability', label: 'Fiabilité', score: this.scoreReliability(avgRating, reviewCount), weight: WEIGHTS.reliability },
        { key: 'responsiveness', label: 'Réactivité', score: this.scoreResponsiveness(u.lastLoginAt), weight: WEIGHTS.responsiveness },
      ];
      const m = this.compose(factors);
      results.push({
        freelanceId: u.id,
        accountId: acc.id,
        email: u.email,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || acc.name,
        job: p?.job ?? null,
        city: p?.city ?? null,
        avatarUrl: u.avatarUrl ?? null,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount,
        available: p?.available ?? true,
        hasConflict,
        ...m,
      });
    }
    results.sort((a, b) => b.total - a.total);
    return { mission: { id: mission.id, title: mission.title }, candidates: results };
  }

  // --- Opportunités classées pour un freelance ---------------------------
  async opportunitiesForFreelance(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) return [];
    const p = user.profile;
    const missions = await this.prisma.reliefMission.findMany({
      where: { status: 'PUBLISHED', visibility: { in: ['PUBLIC', 'RESERVED'] } },
      orderBy: { startDate: 'asc' },
      take: 100,
    });
    const out = missions.map((mission) => {
      const needs = tokens(mission.title, mission.description, mission.job, mission.category);
      const factors: Factor[] = [
        { key: 'job', label: 'Métier', score: this.scoreJob(mission.job, mission.category, p?.job), weight: WEIGHTS.job },
        { key: 'geo', label: 'Proximité', score: this.scoreGeo(mission.city, mission.postalCode, p?.city, p?.postalCode, p?.radiusKm), weight: WEIGHTS.geo },
        { key: 'skills', label: 'Compétences', score: this.scoreSkills(needs, p?.skills ?? []), weight: WEIGHTS.skills },
        { key: 'availability', label: 'Disponibilité', score: this.scoreAvailability(p?.available ?? true, false), weight: WEIGHTS.availability },
        { key: 'reliability', label: 'Fiabilité', score: 0.7, weight: WEIGHTS.reliability },
        { key: 'responsiveness', label: 'Réactivité', score: 0.7, weight: WEIGHTS.responsiveness },
      ];
      return { mission, ...this.compose(factors) };
    });
    out.sort((a, b) => b.total - a.total);
    return out;
  }
}
