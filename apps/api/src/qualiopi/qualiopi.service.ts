import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProofDto } from './dto/upsert-proof.dto';

/**
 * Référentiel National Qualité (RNQ) — 7 critères / 32 indicateurs.
 * Libellés synthétiques (support de suivi de conformité, non substituable au
 * texte officiel du décret). Seedés automatiquement, non éditables par les comptes.
 */
const RNQ: { c: number; title: string; indicators: { n: number; label: string }[] }[] = [
  {
    c: 1,
    title: "Conditions d'information du public",
    indicators: [
      { n: 1, label: 'Information accessible au public (objectifs, durée, tarifs, prérequis, contacts, délais, accessibilité)' },
      { n: 2, label: 'Diffusion d’indicateurs de résultats' },
      { n: 3, label: 'Taux d’obtention, de poursuite et d’insertion (certifications)' },
    ],
  },
  {
    c: 2,
    title: 'Identification des objectifs et adaptation des prestations',
    indicators: [
      { n: 4, label: 'Analyse du besoin du bénéficiaire' },
      { n: 5, label: 'Objectifs pédagogiques opérationnels et évaluables' },
      { n: 6, label: 'Contenus et modalités adaptés aux objectifs' },
      { n: 7, label: 'Adéquation au référentiel de la certification visée' },
      { n: 8, label: 'Positionnement et prérequis à l’entrée' },
    ],
  },
  {
    c: 3,
    title: 'Adaptation aux publics : accueil, accompagnement, suivi, évaluation',
    indicators: [
      { n: 9, label: 'Conditions de déroulement communiquées' },
      { n: 10, label: 'Adaptation de l’accompagnement et du suivi' },
      { n: 11, label: 'Évaluation de l’atteinte des objectifs' },
      { n: 12, label: 'Prise en compte des besoins d’adaptation (rythmes, situations)' },
      { n: 13, label: 'Coordination avec l’entreprise (alternance)' },
      { n: 14, label: 'Exercice de la fonction tutorale / maître d’apprentissage' },
      { n: 15, label: 'Information de l’apprenant sur ses droits et devoirs' },
      { n: 16, label: 'Accompagnement et prévention des ruptures de parcours' },
    ],
  },
  {
    c: 4,
    title: 'Moyens pédagogiques, techniques et d’encadrement',
    indicators: [
      { n: 17, label: 'Moyens humains et techniques adaptés + coordination' },
      { n: 18, label: 'Ressources pédagogiques mises à disposition' },
      { n: 19, label: 'Personnels dédiés à l’accompagnement' },
      { n: 20, label: 'Réseau de partenaires socio-économiques' },
      { n: 21, label: 'Accueil des personnes en situation de handicap' },
    ],
  },
  {
    c: 5,
    title: 'Qualification et développement des compétences des personnels',
    indicators: [
      { n: 22, label: 'Qualification et compétences des intervenants' },
      { n: 23, label: 'Développement continu des compétences des personnels' },
      { n: 24, label: 'Actualisation des compétences des équipes pédagogiques' },
    ],
  },
  {
    c: 6,
    title: 'Inscription et investissement dans l’environnement professionnel',
    indicators: [
      { n: 25, label: 'Veille légale, réglementaire et sur les évolutions du secteur' },
      { n: 26, label: 'Veille sur les innovations pédagogiques et technologiques' },
      { n: 27, label: 'Mobilisation d’expertises et sous-traitance maîtrisée' },
    ],
  },
  {
    c: 7,
    title: 'Recueil et prise en compte des appréciations et réclamations',
    indicators: [
      { n: 28, label: 'Recueil des appréciations des parties prenantes' },
      { n: 29, label: 'Traitement des aléas et difficultés rencontrés' },
      { n: 30, label: 'Traitement des réclamations' },
      { n: 31, label: 'Analyse et mesures d’amélioration continue' },
      { n: 32, label: 'Prise en compte du handicap dans l’amélioration continue' },
    ],
  },
];

@Injectable()
export class QualiopiService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  /** Seed idempotent des critères/indicateurs au démarrage. */
  async onModuleInit() {
    try {
      const count = await this.prisma.qualiopiIndicator.count();
      if (count >= 32) return;
      for (const crit of RNQ) {
        const criterion = await this.prisma.qualiopiCriterion.upsert({
          where: { number: crit.c },
          create: { number: crit.c, title: crit.title },
          update: { title: crit.title },
        });
        for (const ind of crit.indicators) {
          await this.prisma.qualiopiIndicator.upsert({
            where: { number: ind.n },
            create: { number: ind.n, label: ind.label, criterionId: criterion.id },
            update: { label: ind.label, criterionId: criterion.id },
          });
        }
      }
    } catch {
      // Table pas encore créée (premier démarrage avant db push) : ignoré.
    }
  }

  /** Résout le compte OF (ADéPA) porteur de la certification. */
  private async resolveOfAccountId(): Promise<string> {
    const adepa = await this.prisma.account.findFirst({
      where: {
        type: 'ESTABLISHMENT',
        OR: [
          { name: { contains: 'adépa', mode: 'insensitive' } },
          { name: { contains: 'adepa', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (adepa) return adepa.id;
    const any = await this.prisma.account.findFirst({
      where: { type: 'ESTABLISHMENT' },
      orderBy: { createdAt: 'asc' },
    });
    if (any) return any.id;
    throw new BadRequestException('Aucun compte OF disponible.');
  }

  /** Matrice de conformité : critères → indicateurs → preuve de l'OF. */
  async conformite() {
    const ofAccountId = await this.resolveOfAccountId();
    const criteria = await this.prisma.qualiopiCriterion.findMany({
      orderBy: { number: 'asc' },
      include: {
        indicators: {
          orderBy: { number: 'asc' },
          include: {
            proofs: { where: { ofAccountId }, take: 1 },
          },
        },
      },
    });

    const indicators = criteria.flatMap((c) => c.indicators);
    const total = indicators.length;
    const byStatus = { TODO: 0, UPLOADED: 0, VALIDATED: 0, REJECTED: 0 };
    for (const ind of indicators) {
      const st = ind.proofs[0]?.status ?? 'TODO';
      byStatus[st as keyof typeof byStatus] += 1;
    }

    return {
      ofAccountId,
      total,
      summary: byStatus,
      criteria: criteria.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        indicators: c.indicators.map((i) => ({
          id: i.id,
          number: i.number,
          label: i.label,
          proof: i.proofs[0]
            ? {
                id: i.proofs[0].id,
                status: i.proofs[0].status,
                label: i.proofs[0].label,
                documentUrl: i.proofs[0].documentUrl,
                updatedAt: i.proofs[0].updatedAt,
              }
            : null,
        })),
      })),
    };
  }

  /** Dépose / met à jour la preuve d'un indicateur pour l'OF. */
  async upsertProof(indicatorId: string, dto: UpsertProofDto) {
    const ofAccountId = await this.resolveOfAccountId();
    const indicator = await this.prisma.qualiopiIndicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) throw new BadRequestException('Indicateur introuvable.');

    return this.prisma.qualiopiProof.upsert({
      where: { indicatorId_ofAccountId: { indicatorId, ofAccountId } },
      create: {
        indicatorId,
        ofAccountId,
        label: dto.label,
        documentUrl: dto.documentUrl,
        status: dto.status ?? 'UPLOADED',
        reviewedAt: dto.status === 'VALIDATED' ? new Date() : undefined,
      },
      update: {
        label: dto.label,
        documentUrl: dto.documentUrl,
        status: dto.status,
        reviewedAt: dto.status === 'VALIDATED' ? new Date() : undefined,
      },
    });
  }
}
