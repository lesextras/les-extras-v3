import { Injectable, NotFoundException } from '@nestjs/common';
import { ProofStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * LA CERTIFICATION QUALIOPI D'UNE ACADÉMIE.
 *
 * Le référentiel — sept critères, trente-deux indicateurs — est déjà en base :
 * il est le même pour tout le monde et se sème au démarrage du serveur. Ce qui
 * change d'un organisme à l'autre, c'est UNE preuve par indicateur. On lit donc
 * le référentiel entier, en y accrochant la preuve du compte, et rien d'autre.
 *
 * Un indicateur non concerné existe : tous ne s'appliquent pas à tous les
 * organismes (l'alternance, la sous-traitance…). On le marque « sans objet »
 * plutôt que de le laisser rouge à vie — c'est ce que fait un auditeur.
 */

export type EtatPreuve = 'A_FAIRE' | 'DEPOSEE' | 'VALIDEE' | 'SANS_OBJET';

/** Le nom interne de l'état, côté base : on ne change pas le modèle partagé. */
const VERS_BASE: Record<EtatPreuve, ProofStatus> = {
  A_FAIRE: ProofStatus.TODO,
  DEPOSEE: ProofStatus.UPLOADED,
  VALIDEE: ProofStatus.VALIDATED,
  SANS_OBJET: ProofStatus.REJECTED,
};

const DEPUIS_BASE: Record<ProofStatus, EtatPreuve> = {
  [ProofStatus.TODO]: 'A_FAIRE',
  [ProofStatus.UPLOADED]: 'DEPOSEE',
  [ProofStatus.VALIDATED]: 'VALIDEE',
  [ProofStatus.REJECTED]: 'SANS_OBJET',
};

export interface NotePreuveDto {
  etat?: EtatPreuve;
  intitule?: string | null;
  lien?: string | null;
}

@Injectable()
export class CertificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Le référentiel entier, avec la preuve de ce compte accrochée à chaque indicateur. */
  async referentiel(accountId: string) {
    const criteres = await this.prisma.qualiopiCriterion.findMany({
      orderBy: { number: 'asc' },
      include: {
        indicators: {
          orderBy: { number: 'asc' },
          include: { proofs: { where: { ofAccountId: accountId }, take: 1 } },
        },
      },
    });

    const composes = criteres.map((c) => ({
      numero: c.number,
      titre: c.title,
      indicateurs: c.indicators.map((i) => {
        const p = i.proofs[0];
        return {
          id: i.id,
          numero: i.number,
          libelle: i.label,
          etat: p ? DEPUIS_BASE[p.status] : ('A_FAIRE' as EtatPreuve),
          intitule: p?.label ?? null,
          lien: p?.documentUrl ?? null,
          notePosee: p?.updatedAt ?? null,
        };
      }),
    }));

    const tous = composes.flatMap((c) => c.indicateurs);
    const concernes = tous.filter((i) => i.etat !== 'SANS_OBJET');
    const couverts = concernes.filter((i) => i.etat === 'DEPOSEE' || i.etat === 'VALIDEE');

    return {
      criteres: composes,
      total: tous.length,
      concernes: concernes.length,
      couverts: couverts.length,
      pourcentage: concernes.length ? Math.round((couverts.length / concernes.length) * 100) : 0,
    };
  }

  /** Poser ou corriger la preuve d'un indicateur, pour CE compte et lui seul. */
  async noter(accountId: string, indicatorId: string, dto: NotePreuveDto) {
    const indicateur = await this.prisma.qualiopiIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicateur) throw new NotFoundException("Cet indicateur n'existe pas.");

    const intitule = dto.intitule?.trim() || null;
    const lien = dto.lien?.trim() || null;
    // Sans état donné, on déduit : quelque chose est écrit, donc la preuve existe.
    const etat: EtatPreuve = dto.etat ?? (intitule || lien ? 'DEPOSEE' : 'A_FAIRE');
    const status = VERS_BASE[etat];

    const p = await this.prisma.qualiopiProof.upsert({
      where: { indicatorId_ofAccountId: { indicatorId, ofAccountId: accountId } },
      create: { indicatorId, ofAccountId: accountId, status, label: intitule, documentUrl: lien },
      update: {
        status,
        ...(dto.intitule !== undefined ? { label: intitule } : {}),
        ...(dto.lien !== undefined ? { documentUrl: lien } : {}),
      },
    });

    return {
      id: indicateur.id,
      numero: indicateur.number,
      libelle: indicateur.label,
      etat: DEPUIS_BASE[p.status],
      intitule: p.label,
      lien: p.documentUrl,
      notePosee: p.updatedAt,
    };
  }
}
