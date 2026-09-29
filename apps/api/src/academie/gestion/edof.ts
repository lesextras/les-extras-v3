import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContexteGestion } from './contexte.service';

export interface PointEdof {
  cle: string;
  libelle: string;
  ok: boolean;
  aide: string;
}

/**
 * PRÉPARER LA MISE EN LIGNE SUR MON COMPTE FORMATION (EDOF).
 *
 * EDOF est l'espace de la Caisse des dépôts où l'on dépose ses formations
 * éligibles au CPF. On n'y écrit PAS à la place de l'organisme : l'accès se
 * fait par ProConnect, avec les identifiants de son représentant, et c'est
 * lui qui déclare. On vérifie en revanche, formation par formation, que tout
 * ce que le formulaire va demander est déjà prêt, et on dit ce qui manque.
 *
 * ⚠ Seules les actions menant à une certification enregistrée (RNCP, RS), un
 * bilan de compétences, une VAE ou certains dispositifs listés par la loi sont
 * éligibles. Une formation « autre » n'y a pas sa place, et l'écran le dit
 * plutôt que de laisser croire qu'il suffit de la déposer.
 */
export function pointsOrganisme(a: { nda: string | null; siret: string | null; qualiopi: string; certifieAu: Date | null }): PointEdof[] {
  const certifie = a.qualiopi === 'CERTIFIE' && (!a.certifieAu || a.certifieAu > new Date());
  return [
    { cle: 'nda', libelle: "Numéro de déclaration d'activité", ok: !!a.nda, aide: "EDOF l'exige : il se renseigne dans « Mon académie »." },
    { cle: 'siret', libelle: 'SIRET', ok: !!a.siret, aide: "C'est lui qui identifie l'organisme auprès de la Caisse des dépôts." },
    {
      cle: 'qualiopi',
      libelle: 'Certification Qualiopi en cours de validité',
      ok: certifie,
      aide: 'Obligatoire depuis 2022 pour toute formation financée par le CPF (art. L6316-1).',
    },
  ];
}

export function pointsFormation(f: {
  objectifBpf: string;
  codeCertification: string | null;
  objectives: string | null;
  prerequisites: string | null;
  program: string | null;
  evaluation: string | null;
  durationHours: number | null;
  durationMinutes?: number | null;
  priceHt?: unknown;
  sessionsAVenir: number;
  accessibilite?: boolean;
}): PointEdof[] {
  const eligible = /^(RNCP_|RS$|BILAN$|VAE$)/.test(f.objectifBpf);
  const certification = f.objectifBpf === 'BILAN' || f.objectifBpf === 'VAE' || !!f.codeCertification;
  return [
    {
      cle: 'eligible',
      libelle: 'Objectif éligible au CPF',
      ok: eligible,
      aide: 'Certification RNCP ou RS, bilan de compétences ou VAE. Règle l’objectif dans le programme (onglet BPF).',
    },
    { cle: 'certification', libelle: 'Code RNCP ou RS renseigné', ok: certification, aide: 'Le code de la fiche France Compétences (RNCP12345 ou RS1234).' },
    { cle: 'objectifs', libelle: 'Objectifs', ok: !!f.objectives?.trim(), aide: 'Formulés en compétences évaluables.' },
    { cle: 'prerequis', libelle: 'Prérequis', ok: !!f.prerequisites?.trim(), aide: '« Aucun » est une réponse valable, le champ vide ne l’est pas.' },
    { cle: 'programme', libelle: 'Programme détaillé', ok: !!f.program?.trim(), aide: 'Le contenu, module par module.' },
    { cle: 'evaluation', libelle: "Modalités d'évaluation", ok: !!f.evaluation?.trim(), aide: 'Comment les acquis sont vérifiés, et comment la certification est passée.' },
    { cle: 'duree', libelle: 'Durée', ok: !!(f.durationHours || f.durationMinutes), aide: 'En heures.' },
    { cle: 'sessions', libelle: 'Au moins une session à venir', ok: f.sessionsAVenir > 0, aide: 'EDOF publie des sessions datées (ou « en entrées-sorties permanentes »).' },
  ];
}

@Injectable()
export class EdofService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
  ) {}

  async preparation(accountId: string) {
    const a = await this.ctx.academie(accountId);
    const formations = await this.prisma.formation.findMany({
      where: { ownerAccountId: accountId, status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        title: true,
        objectifBpf: true,
        codeCertification: true,
        objectives: true,
        prerequisites: true,
        program: true,
        evaluation: true,
        durationHours: true,
        durationMinutes: true,
        sessions: { where: { startDate: { gt: new Date() }, status: { not: 'CANCELLED' } }, select: { id: true } },
      },
      orderBy: { title: 'asc' },
    });
    const organisme = pointsOrganisme(a);
    return {
      organisme,
      organismePret: organisme.every((p) => p.ok),
      formations: formations.map((f) => {
        const points = pointsFormation({ ...f, sessionsAVenir: f.sessions.length });
        return { id: f.id, titre: f.title, eligible: points[0].ok, pret: points.every((p) => p.ok), manque: points.filter((p) => !p.ok).length, points };
      }),
      lien: 'https://www.of.moncompteformation.gouv.fr/',
    };
  }
}
