import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PointReason, Prisma, QuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PseudonymiseurService } from '../assistant/pseudonymiseur.service';
import { CommunityService } from '../community/community.service';
import { CreateAnswerDto, CreateQuestionDto, QueryQuestionsDto } from './dto/question.dto';

/** Compte les occurrences et trie du plus fréquent au moins fréquent. */
function compter(valeurs: string[]): { valeur: string; nb: number }[] {
  const table = new Map<string, number>();
  for (const v of valeurs) table.set(v, (table.get(v) ?? 0) + 1);
  return [...table.entries()]
    .map(([valeur, nb]) => ({ valeur, nb }))
    .sort((a, b) => b.nb - a.nb);
}

/** Ce qu'on montre publiquement d'un auteur : jamais son identité complète. */
function signature(anonyme: boolean, metier: string, compte?: { name?: string | null } | null) {
  return anonyme ? `Un·e ${metier.toLowerCase()}` : (compte?.name ?? `Un·e ${metier.toLowerCase()}`);
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pseudo: PseudonymiseurService,
    private readonly community: CommunityService,
  ) {}

  /**
   * Masquage à l'écriture. On parle de personnes accompagnées réelles : les
   * prénoms et les coordonnées ne doivent JAMAIS être stockés en clair dans un
   * espace lisible par des tiers. Contrairement à l'assistant, on ne restaure
   * rien : le texte reste masqué, définitivement.
   */
  private anonymiser(texte: string): string {
    const { texte: masque } = this.pseudo.masquer(texte);
    return masque
      .replace(/\[PERSONNE-[A-Z]+\]/g, '[prénom masqué]')
      .replace(/\[CONTACT-\d+\]/g, '[coordonnée masquée]')
      // Les dates ne sont pas identifiantes dans un récit de situation : on
      // les laisse, sinon le contexte devient incompréhensible.
      .replace(/\[DATE-(\d+)\]/g, 'à cette date');
  }

  // ── Lecture publique ─────────────────────────────────────────────────────

  async lister(query: QueryQuestionsDto, userId?: string) {
    const where: Prisma.QuestionWhereInput = { status: { not: QuestionStatus.FERMEE } };
    if (query.metier) where.metier = query.metier;
    if (query.publicVise) where.publicVise = query.publicVise;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { situation: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.tri === 'sans-reponse') where.answers = { none: {} };

    const take = Math.min(query.take ?? 20, 40);
    const [lignes, total, facettes, sansReponse] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        orderBy:
          query.tri === 'populaires'
            ? [{ views: 'desc' }, { createdAt: 'desc' }]
            : [{ createdAt: 'desc' }],
        take,
        skip: query.skip ?? 0,
        include: {
          account: { select: { name: true } },
          _count: { select: { answers: true } },
        },
      }),
      this.prisma.question.count({ where }),
      // Comptage des facettes : une seule lecture des deux colonnes, agrégée
      // en mémoire. Plus lisible qu'un groupBy et suffisant à cette échelle.
      this.prisma.question.findMany({
        where: { status: { not: QuestionStatus.FERMEE } },
        select: { metier: true, publicVise: true },
      }),
      this.prisma.question.count({
        where: { status: QuestionStatus.OUVERTE, answers: { none: {} } },
      }),
    ]);

    return {
      items: lignes.map((q) => ({
        id: q.id,
        title: q.title,
        extrait: q.situation.slice(0, 220),
        metier: q.metier,
        publicVise: q.publicVise,
        status: q.status,
        views: q.views,
        nbReponses: q._count.answers,
        auteur: signature(q.anonyme, q.metier, q.account),
        estMienne: userId ? q.authorId === userId : false,
        createdAt: q.createdAt,
      })),
      total,
      sansReponse,
      metiers: compter(facettes.map((f) => f.metier)),
      publics: compter(facettes.map((f) => f.publicVise)),
    };
  }

  /** Fiche complète. Incrémente le compteur de vues, sans bloquer la réponse. */
  async detail(id: string, userId?: string) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: {
        account: { select: { name: true } },
        answers: {
          orderBy: [{ retenue: 'desc' }, { createdAt: 'asc' }],
          include: {
            account: { select: { name: true } },
            votes: { select: { userId: true } },
          },
        },
      },
    });
    if (!q || q.status === QuestionStatus.FERMEE) {
      throw new NotFoundException('Question introuvable.');
    }

    this.prisma.question
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    return {
      id: q.id,
      title: q.title,
      situation: q.situation,
      tente: q.tente,
      metier: q.metier,
      publicVise: q.publicVise,
      status: q.status,
      views: q.views,
      auteur: signature(q.anonyme, q.metier, q.account),
      estMienne: userId ? q.authorId === userId : false,
      createdAt: q.createdAt,
      reponses: q.answers.map((r) => ({
        id: r.id,
        content: r.content,
        retenue: r.retenue,
        auteur: signature(r.anonyme, q.metier, r.account),
        votes: r.votes.length,
        aVote: userId ? r.votes.some((v) => v.userId === userId) : false,
        estMienne: userId ? r.authorId === userId : false,
        createdAt: r.createdAt,
      })),
    };
  }

  // ── Écriture ─────────────────────────────────────────────────────────────

  async creer(accountId: string, authorId: string, dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        accountId,
        authorId,
        title: this.anonymiser(dto.title.trim()),
        situation: this.anonymiser(dto.situation.trim()),
        tente: dto.tente ? this.anonymiser(dto.tente.trim()) : null,
        metier: dto.metier,
        publicVise: dto.publicVise,
        anonyme: dto.anonyme ?? true,
      },
      select: { id: true, title: true },
    });
  }

  async repondre(questionId: string, accountId: string, authorId: string, dto: CreateAnswerDto) {
    const q = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, status: true, authorId: true },
    });
    if (!q) throw new NotFoundException('Question introuvable.');
    if (q.status === QuestionStatus.FERMEE) {
      throw new BadRequestException('Cette question est fermée.');
    }
    if (q.authorId === authorId) {
      throw new BadRequestException(
        'Complétez plutôt votre question : les réponses sont réservées aux autres professionnels.',
      );
    }

    const reponse = await this.prisma.answer.create({
      data: {
        questionId,
        accountId,
        authorId,
        content: this.anonymiser(dto.content.trim()),
        anonyme: dto.anonyme ?? true,
      },
      select: { id: true },
    });

    // Répondre à un pair, c'est la contribution la plus utile au réseau.
    await this.community
      .crediter(accountId, PointReason.REPONSE, 'Réponse apportée dans l’Entraide')
      .catch(() => undefined);

    return reponse;
  }

  /** Vote « utile » — une voix par personne, réversible. */
  async voter(answerId: string, userId: string) {
    const existant = await this.prisma.answerVote.findUnique({
      where: { answerId_userId: { answerId, userId } },
    });
    if (existant) {
      await this.prisma.answerVote.delete({ where: { id: existant.id } });
      return { vote: false };
    }
    const reponse = await this.prisma.answer.findUnique({ where: { id: answerId } });
    if (!reponse) throw new NotFoundException('Réponse introuvable.');
    await this.prisma.answerVote.create({ data: { answerId, userId } });
    return { vote: true };
  }

  /**
   * L'auteur de la question désigne la réponse qui l'a aidé. C'est le seul
   * signal de qualité qui vaille : il vient de celui qui avait le problème.
   */
  async retenir(answerId: string, userId: string) {
    const reponse = await this.prisma.answer.findUnique({
      where: { id: answerId },
      include: { question: { select: { id: true, authorId: true } } },
    });
    if (!reponse) throw new NotFoundException('Réponse introuvable.');
    if (reponse.question.authorId !== userId) {
      throw new ForbiddenException('Seul l’auteur de la question peut retenir une réponse.');
    }

    await this.prisma.$transaction([
      this.prisma.answer.updateMany({
        where: { questionId: reponse.question.id },
        data: { retenue: false },
      }),
      this.prisma.answer.update({ where: { id: answerId }, data: { retenue: true } }),
      this.prisma.question.update({
        where: { id: reponse.question.id },
        data: { status: QuestionStatus.RESOLUE },
      }),
    ]);

    await this.community
      .crediter(reponse.accountId, PointReason.REPONSE_RETENUE, 'Réponse retenue comme utile')
      .catch(() => undefined);

    return { retenue: true };
  }

  /** Fermeture : l'auteur ou l'équipe. */
  async fermer(id: string, userId: string, estAdmin: boolean) {
    const q = await this.prisma.question.findUnique({ where: { id }, select: { authorId: true } });
    if (!q) throw new NotFoundException('Question introuvable.');
    if (!estAdmin && q.authorId !== userId) {
      throw new ForbiddenException('Action réservée à l’auteur ou à l’équipe.');
    }
    await this.prisma.question.update({ where: { id }, data: { status: QuestionStatus.FERMEE } });
    return { ferme: true };
  }
}
