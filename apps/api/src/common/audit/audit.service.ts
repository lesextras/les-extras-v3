import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Entrée à écrire dans le journal d'audit.
 * `action` est un code court et stable (ex. "booking.time_entry.validated"),
 * `summary` la phrase lisible affichée telle quelle dans le back-office.
 */
export interface AuditLogInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  actorId?: string | null;
  accountId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/** Filtres de consultation du journal (tous optionnels). */
export interface AuditListFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  /** Début de période (ISO ou Date). */
  from?: string | Date;
  /** Fin de période (ISO ou Date), incluse. */
  to?: string | Date;
  page?: number;
  perPage?: number;
}

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;

/** Convertit une valeur en date valide, ou `undefined` si inexploitable. */
function toDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * JOURNAL D'AUDIT — écriture et consultation.
 *
 * Règle d'or : `log()` ne lève JAMAIS d'exception. Un échec de journalisation
 * (base indisponible, contrainte inattendue…) ne doit jamais faire échouer
 * l'action métier qu'il accompagne : on se contente de tracer l'incident.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Écrit une entrée dans le journal. Ne rejette jamais.
   * Renvoie l'identifiant de l'entrée créée, ou `null` si l'écriture a échoué.
   */
  async log(input: AuditLogInput): Promise<string | null> {
    try {
      const entry = await this.prisma.auditLog.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? null,
          summary: input.summary,
          actorId: input.actorId ?? null,
          accountId: input.accountId ?? null,
          metadata:
            input.metadata == null
              ? Prisma.DbNull
              : (input.metadata as unknown as Prisma.InputJsonValue),
          ip: input.ip ?? null,
        },
        select: { id: true },
      });
      return entry.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Volontairement en warn : c'est une perte de traçabilité, pas une panne métier.
      this.logger.warn(
        `Journal d'audit — écriture impossible pour l'action « ${input.action} » : ${message}`,
      );
      return null;
    }
  }

  /** Liste paginée du journal, la plus récente en premier. */
  async list(filters: AuditListFilters = {}) {
    const page = Math.max(1, Math.trunc(Number(filters.page) || 1));
    const perPageRaw = Math.trunc(Number(filters.perPage) || DEFAULT_PER_PAGE);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, perPageRaw));

    const where: Prisma.AuditLogWhereInput = {};
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorId) where.actorId = filters.actorId;

    const from = toDate(filters.from);
    const to = toDate(filters.to);
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
          account: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
}
