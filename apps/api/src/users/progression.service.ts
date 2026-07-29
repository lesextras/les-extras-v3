import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Programme de progression des intervenants — l'equivalent du « Super Talent »
 * de Brigad, calcule uniquement sur des faits verifiables en base :
 * missions terminees, taux d'annulation, note moyenne recue, avis recus.
 *
 * Trois paliers :
 *  - NOUVEAU      : tout le monde au depart.
 *  - CONFIRME     : 3 missions terminees, note >= 4, annulations <= 20 %.
 *  - SUPER_EXTRA  : 10 missions terminees, note >= 4,5 sur au moins 3 avis,
 *                   annulations <= 5 %.
 *
 * Avantage concret : les SUPER_EXTRA sont sollicites des le palier « reserve »
 * de la cascade de diffusion, avant l'ouverture au reseau complet.
 */

export type Palier = 'NOUVEAU' | 'CONFIRME' | 'SUPER_EXTRA';

export interface Critere {
  libelle: string;
  atteint: boolean;
  valeur: string;
  cible: string;
}

const SEUILS = {
  CONFIRME: { missions: 3, note: 4, avis: 1, annulationMax: 0.2 },
  SUPER_EXTRA: { missions: 10, note: 4.5, avis: 3, annulationMax: 0.05 },
} as const;

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Statistiques brutes d'un compte intervenant. */
  private async stats(accountId: string, ownerId: string) {
    const [terminees, annulees, note] = await Promise.all([
      this.prisma.booking.count({ where: { accountId, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { accountId, status: 'CANCELLED' } }),
      this.prisma.review.aggregate({
        where: { targetId: ownerId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);
    const total = terminees + annulees;
    return {
      terminees,
      annulees,
      tauxAnnulation: total > 0 ? annulees / total : 0,
      noteMoyenne: note._avg.rating,
      nbAvis: note._count.rating,
    };
  }

  private palierDepuisStats(s: {
    terminees: number;
    tauxAnnulation: number;
    noteMoyenne: number | null;
    nbAvis: number;
  }): Palier {
    const superOk =
      s.terminees >= SEUILS.SUPER_EXTRA.missions &&
      s.nbAvis >= SEUILS.SUPER_EXTRA.avis &&
      (s.noteMoyenne ?? 0) >= SEUILS.SUPER_EXTRA.note &&
      s.tauxAnnulation <= SEUILS.SUPER_EXTRA.annulationMax;
    if (superOk) return 'SUPER_EXTRA';
    const confirmeOk =
      s.terminees >= SEUILS.CONFIRME.missions &&
      s.nbAvis >= SEUILS.CONFIRME.avis &&
      (s.noteMoyenne ?? 0) >= SEUILS.CONFIRME.note &&
      s.tauxAnnulation <= SEUILS.CONFIRME.annulationMax;
    return confirmeOk ? 'CONFIRME' : 'NOUVEAU';
  }

  /** Palier seul (usage interne : cascade de diffusion). */
  async palier(accountId: string): Promise<Palier> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { ownerId: true },
    });
    if (!account) return 'NOUVEAU';
    const s = await this.stats(accountId, account.ownerId);
    return this.palierDepuisStats(s);
  }

  /**
   * Parmi une liste de comptes, ceux qui sont SUPER_EXTRA.
   * Requetes groupees pour rester economes lors des diffusions de missions.
   */
  async superExtrasParmi(accountIds: string[]): Promise<Set<string>> {
    if (accountIds.length === 0) return new Set();
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, ownerId: true },
    });
    const resultat = new Set<string>();
    // Peu de candidats par diffusion (<= 100) : le calcul par compte reste raisonnable.
    await Promise.all(
      accounts.map(async (a) => {
        const s = await this.stats(a.id, a.ownerId);
        if (this.palierDepuisStats(s) === 'SUPER_EXTRA') resultat.add(a.id);
      }),
    );
    return resultat;
  }

  /** Vue complete pour la page « Ma progression » du dashboard intervenant. */
  async progressionPourUser(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { ownerId: userId, type: 'FREELANCE' },
      select: { id: true, ownerId: true, createdAt: true },
    });
    if (!account) {
      throw new NotFoundException("Aucun compte intervenant rattache a cet utilisateur.");
    }
    const s = await this.stats(account.id, account.ownerId);
    const palier = this.palierDepuisStats(s);

    const pct = (x: number) => `${Math.round(x * 100)} %`;
    const note = s.noteMoyenne != null ? s.noteMoyenne.toFixed(1).replace('.', ',') : '—';

    const criteres = (seuils: (typeof SEUILS)['CONFIRME' | 'SUPER_EXTRA']): Critere[] => [
      {
        libelle: 'Missions terminees',
        atteint: s.terminees >= seuils.missions,
        valeur: String(s.terminees),
        cible: `${seuils.missions}`,
      },
      {
        libelle: 'Note moyenne',
        atteint: s.nbAvis >= seuils.avis && (s.noteMoyenne ?? 0) >= seuils.note,
        valeur: s.nbAvis > 0 ? `${note} (${s.nbAvis} avis)` : 'aucun avis',
        cible: `${String(seuils.note).replace('.', ',')} sur ${seuils.avis} avis min.`,
      },
      {
        libelle: "Taux d'annulation",
        atteint: s.tauxAnnulation <= seuils.annulationMax,
        valeur: pct(s.tauxAnnulation),
        cible: `${pct(seuils.annulationMax)} max.`,
      },
    ];

    const prochain: Palier | null =
      palier === 'NOUVEAU' ? 'CONFIRME' : palier === 'CONFIRME' ? 'SUPER_EXTRA' : null;

    return {
      palier,
      stats: {
        missionsTerminees: s.terminees,
        missionsAnnulees: s.annulees,
        tauxAnnulation: s.tauxAnnulation,
        noteMoyenne: s.noteMoyenne,
        nbAvis: s.nbAvis,
        membreDepuis: account.createdAt,
      },
      prochainPalier: prochain,
      criteresProchainPalier: prochain ? criteres(SEUILS[prochain]) : [],
      avantages: {
        NOUVEAU: "Acces aux missions publiques du reseau.",
        CONFIRME: 'Badge « Confirme » visible sur votre profil public.',
        SUPER_EXTRA:
          'Badge « Super Extra » + acces prioritaire : vous etes sollicite avant l’ouverture des missions au reseau complet.',
      },
    };
  }
}
