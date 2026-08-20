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

/** Le détail chiffré d'un score, tel qu'il s'affiche à l'établissement. */
export interface CritereCandidat {
  key: string;
  label: string;
  score: number;
  weight: number;
  points: number;
}

/**
 * Un candidat classé, DANS LA FORME EXPOSÉE AU FRONT : sans adresse e-mail.
 * C'est la forme que renvoie `candidatesForMission`, et donc celle que voit
 * l'établissement derrière `GET /matching/missions/:id/candidates`.
 */
export interface CandidatMission {
  freelanceId: string;
  accountId: string;
  name: string;
  job: string | null;
  city: string | null;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  available: boolean;
  hasConflict: boolean;
  total: number;
  label: string;
  breakdown: CritereCandidat[];
}

/**
 * Même candidat, PLUS l'adresse e-mail. Réservé aux appels serveur→serveur
 * (la diffusion RenforTeam) : cette forme ne doit jamais sortir par une route
 * HTTP. Voir `candidatesForMissionInterne`.
 */
export interface CandidatMissionInterne extends CandidatMission {
  /**
   * ABSENTE — et non pas nulle — dès que la sortie est destinée au front :
   * la clé n'est même pas posée sur l'objet sérialisé. C'est la garantie
   * qu'aucune route HTTP ne peut laisser filtrer l'adresse par mégarde.
   */
  email?: string | null;
}

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
  /**
   * Le classement des candidats faisait 1 + 2N requêtes : tous les comptes
   * intervenants de la plateforme, puis pour CHACUN une moyenne d'avis et un
   * comptage de créneaux, en série. À cinq cents inscrits, c'était mille et
   * une allers-retours en base pour afficher une liste — et c'est précisément
   * quand la campagne réussit que ça arrive.
   *
   * Trois requêtes désormais, quel que soit le nombre d'inscrits : les
   * candidats, les avis agrégés en une passe, les conflits en une passe.
   * Le pool est borné, et pré-filtré sur le métier quand la mission le
   * précise — proposer un moniteur-éducateur pour un poste de psychologue
   * n'aide personne, autant ne pas le charger.
   *
   * DEUX FORMES DE SORTIE, UNE SEULE MÉCANIQUE. Le classement sert à deux
   * usages qui n'ont pas les mêmes droits : l'écran de l'établissement (pas
   * d'e-mail, voir plus bas) et la diffusion par e-mail (qui, elle, a besoin
   * de l'adresse pour écrire). On ne duplique pas le calcul : `avecEmail`
   * décide de ce qui sort, et seul un appel serveur→serveur peut le demander.
   */
  private async classerCandidats(
    missionId: string,
    accountId: string,
    take: number,
    avecEmail: boolean,
  ): Promise<{ mission: { id: string; title: string } | null; candidates: CandidatMissionInterne[] }> {
    const mission = await this.prisma.reliefMission.findFirst({ where: { id: missionId, accountId } });
    if (!mission) return { mission: null, candidates: [] };

    const needs = tokens(mission.title, mission.description, mission.job, mission.category);
    const plafond = Math.min(300, Math.max(1, Math.trunc(Number(take) || 100)));

    const freelanceAccounts = await this.prisma.account.findMany({
      where: {
        type: 'FREELANCE',
        // Un intervenant qui s'est déclaré indisponible n'est pas un candidat.
        owner: { profile: { is: { available: true } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: plafond,
      include: { owner: { include: { profile: true } } },
    });

    const userIds = freelanceAccounts.map((a) => a.owner?.id).filter(Boolean) as string[];
    if (userIds.length === 0) {
      return { mission: { id: mission.id, title: mission.title }, candidates: [] };
    }

    const fin = mission.endDate ?? mission.startDate;
    const [avis, creneauxEnConflit] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['targetId'],
        where: { targetId: { in: userIds } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      mission.startDate
        ? this.prisma.shift.groupBy({
            by: ['freelanceId'],
            where: {
              freelanceId: { in: userIds },
              status: { in: ['PLANNED', 'CONFIRMED'] },
              startAt: { lte: fin },
              endAt: { gte: mission.startDate },
            },
            _count: { _all: true },
          })
        : Promise.resolve([] as { freelanceId: string | null; _count: { _all: number } }[]),
    ]);

    const noteParUser = new Map(avis.map((a) => [a.targetId, a]));
    const conflitParUser = new Set(
      creneauxEnConflit.map((c) => c.freelanceId).filter(Boolean) as string[],
    );

    const results: CandidatMissionInterne[] = [];
    for (const acc of freelanceAccounts) {
      const u = acc.owner;
      if (!u) continue;
      const p = u.profile;
      const agg = noteParUser.get(u.id);
      const avgRating = agg?._avg.rating ?? 0;
      const reviewCount = agg?._count._all ?? 0;
      const hasConflict = conflitParUser.has(u.id);
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
        // PAS D'ADRESSE E-MAIL VERS LE FRONT.
        //
        // Cette liste part dès qu'un établissement publie une mission : elle
        // renvoyait l'adresse de chaque intervenant du réseau en clair. Un
        // compte créé en trente secondes, avec une adresse jamais vérifiée,
        // repartait donc avec un annuaire d'e-mails — démarchage possible, et
        // donnée personnelle diffusée sans nécessité.
        //
        // L'établissement n'en a pas besoin pour choisir : prénom, métier,
        // ville et note suffisent, et il contacte par la messagerie de la
        // plateforme. L'adresse ne circule qu'après mise en relation acceptée.
        //
        // MAIS la diffusion, elle, écrit des e-mails : lui retirer l'adresse
        // ne protégeait plus personne, ça éteignait simplement RenforTeam —
        // la liste des destinataires était filtrée sur un champ absent, donc
        // toujours vide, et plus aucun intervenant n'était prévenu. L'adresse
        // n'est donc jointe que sur demande explicite d'un appel interne.
        ...(avecEmail ? { email: u.email ?? null } : {}),
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

  /**
   * Candidats classés POUR L'ÉCRAN de l'établissement. Aucune adresse e-mail
   * dans la réponse : c'est la seule forme que traverse une route HTTP.
   */
  async candidatesForMission(
    missionId: string,
    accountId: string,
    take = 100,
  ): Promise<{ mission: { id: string; title: string } | null; candidates: CandidatMission[] }> {
    return this.classerCandidats(missionId, accountId, take, false);
  }

  /**
   * Candidats classés POUR LA DIFFUSION, adresse e-mail comprise.
   *
   * Usage strictement serveur→serveur (MissionsService.broadcastToMatched).
   * À n'exposer par aucun contrôleur : le jour où une route en aurait besoin,
   * c'est qu'il faut se reposer la question de la donnée exposée, pas
   * brancher celle-ci.
   */
  async candidatesForMissionInterne(
    missionId: string,
    accountId: string,
    take = 100,
  ): Promise<{
    mission: { id: string; title: string } | null;
    candidates: CandidatMissionInterne[];
  }> {
    return this.classerCandidats(missionId, accountId, take, true);
  }

  // --- Opportunités classées pour un freelance ---------------------------
  async opportunitiesForFreelance(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) return [];
    const p = user.profile;

    // La cascade s'applique aussi ici. Le palier « reseau reserve » n'est
    // ouvert qu'aux intervenants deja connus de l'etablissement : vivier
    // choisi, ou historique de missions/ateliers. Ouvrir RESERVED a tout le
    // monde — comme avant — vidait la promesse de confidentialite ET
    // l'avantage « acces prioritaire » vendu par la progression.
    const comptes = await this.prisma.account.findMany({
      where: { ownerId: userId, type: 'FREELANCE' },
      select: { id: true },
    });
    const mesComptes = comptes.map((c) => c.id);
    const [duVivier, surMissions, surAteliers] = mesComptes.length
      ? await Promise.all([
          this.prisma.poolMember.findMany({
            where: { intervenantAccountId: { in: mesComptes } },
            select: { accountId: true },
          }),
          this.prisma.booking.findMany({
            where: {
              accountId: { in: mesComptes },
              status: { in: ['CONFIRMED', 'COMPLETED'] },
              mission: { isNot: null },
            },
            select: { mission: { select: { accountId: true } } },
            take: 500,
          }),
          this.prisma.booking.findMany({
            where: {
              status: { in: ['CONFIRMED', 'COMPLETED'] },
              service: { accountId: { in: mesComptes } },
            },
            select: { accountId: true },
            take: 500,
          }),
        ])
      : [[], [], []];
    const etablissementsConnus = [
      ...new Set([
        ...duVivier.map((v) => v.accountId),
        ...surMissions.map((b) => b.mission?.accountId).filter(Boolean),
        ...surAteliers.map((b) => b.accountId),
      ]),
    ] as string[];

    const missions = await this.prisma.reliefMission.findMany({
      where: {
        status: 'PUBLISHED',
        // Une mission dont la date est passee n'est plus une opportunite.
        startDate: { gte: new Date(Date.now() - 86_400_000) },
        OR: [
          { visibility: 'PUBLIC' },
          ...(etablissementsConnus.length
            ? [{ visibility: 'RESERVED' as const, accountId: { in: etablissementsConnus } }]
            : []),
        ],
      },
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
