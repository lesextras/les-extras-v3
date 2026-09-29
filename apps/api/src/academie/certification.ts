import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProofStatus } from '@prisma/client';
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

    const activite = await this.preuvesDeLActivite(accountId);
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
          activite: activite[i.number] ?? null,
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

  /**
   * LES PREUVES QUE L'ACTIVITÉ PRODUIT TOUTE SEULE.
   *
   * Un auditeur préfère une trace de l'activité réelle à un document écrit pour
   * l'audit. Ce que l'administration des sessions enregistre (positionnements,
   * convocations, émargements signés, enquêtes, formateurs) est donc proposé en
   * regard de l'indicateur qu'il prouve. ⚠ On ne coche rien à la place de
   * l'organisme : la ligne dit ce qui existe, l'organisme décide de s'en servir.
   */
  async preuvesDeLActivite(accountId: string): Promise<Record<number, string>> {
    const sessions = { session: { formation: { ownerAccountId: accountId } } };
    const [positionnes, sortis, convoques, signes, chauds, froids, commanditaires, formateurs, diplomes, seances] = await Promise.all([
      this.prisma.inscription.count({ where: { ...sessions, positionnementEntree: { not: Prisma.AnyNull } } }).catch(() => 0),
      this.prisma.inscription.count({ where: { ...sessions, positionnementSortie: { not: Prisma.AnyNull } } }).catch(() => 0),
      this.prisma.inscription.count({ where: { ...sessions, convocationEnvoyeeLe: { not: null } } }),
      this.prisma.emargement.count({ where: { session: { formation: { ownerAccountId: accountId } }, signatureTrace: { not: null } } }),
      this.prisma.inscription.count({ where: { ...sessions, satisfactionAt: { not: null } } }),
      this.prisma.inscription.count({ where: { ...sessions, coldAt: { not: null } } }),
      this.prisma.inscription.count({ where: { ...sessions, evaluationCommanditaire: { not: Prisma.AnyNull } } }).catch(() => 0),
      this.prisma.formateurOrganisme.count({ where: { accountId, actif: true } }),
      this.prisma.formateurOrganisme.count({ where: { accountId, actif: true, diplomes: { not: null } } }),
      this.prisma.seanceEmargement.count({ where: { session: { formation: { ownerAccountId: accountId } } } }),
    ]);
    const r: Record<number, string> = {};
    const pl = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;
    if (chauds || froids) r[2] = `Indicateurs de résultats calculés sur ${pl(chauds, 'enquête de fin', 'enquêtes de fin')} et ${pl(froids, 'enquête à froid', 'enquêtes à froid')} (Administration → Qualité).`;
    if (positionnes) {
      r[4] = `${pl(positionnes, 'positionnement', 'positionnements')} d'entrée recueilli${positionnes > 1 ? 's' : ''} auprès des stagiaires.`;
      r[8] = r[4];
    }
    if (convoques) r[9] = `${pl(convoques, 'convocation envoyée', 'convocations envoyées')} avec le programme et les informations pratiques.`;
    if (sortis) r[11] = `${pl(sortis, 'positionnement', 'positionnements')} de sortie : l'évolution par objectif figure sur l'attestation.`;
    if (signes) r[12] = `${pl(signes, 'demi-journée signée', 'demi-journées signées')} par les stagiaires sur ${pl(seances, 'séance', 'séances')} ouvertes : l'assiduité est suivie.`;
    if (formateurs) r[21] = `${pl(formateurs, 'formateur', 'formateurs')} dans l'annuaire, dont ${diplomes} avec diplômes et références renseignés.`;
    if (chauds || froids || commanditaires) {
      r[30] = `Appréciations recueillies : ${chauds} en fin de formation, ${froids} à froid, ${commanditaires} auprès des commanditaires.`;
    }
    return r;
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
