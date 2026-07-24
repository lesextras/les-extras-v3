import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ComplianceDocType, ComplianceStatus, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertComplianceDto } from './dto/upsert-compliance.dto';

/** Fenêtre d'alerte "échéance proche" (jours). */
const EXPIRY_WARNING_DAYS = 60;
/** Durée de validité usuelle d'un bulletin n°3 (mois) avant de le redemander. */
const CRIMINAL_RECORD_MAX_MONTHS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Type d'utilisateur simplifié renvoyé dans les vues de conformité. */
type ComplianceUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  job: string | null;
};

/** Ligne de complétude renvoyée par membre. */
export interface Completeness {
  total: number;
  valid: number;
  pct: number;
  expiringSoon: number;
  missing: number;
}

@Injectable()
export class ConformiteService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pièces obligatoires suivies pour tout intervenant (médico-social). */
  static readonly REQUIRED_TYPES: ComplianceDocType[] = [
    ComplianceDocType.IDENTITY,
    ComplianceDocType.CRIMINAL_RECORD,
    ComplianceDocType.DRIVING_LICENSE,
    ComplianceDocType.IBAN,
    ComplianceDocType.AUTOENTREPRENEUR,
  ];

  /** Ordre d'affichage complet (obligatoires puis optionnelles). */
  static readonly ALL_TYPES: ComplianceDocType[] = [
    ...ConformiteService.REQUIRED_TYPES,
    ComplianceDocType.VITALE,
    ComplianceDocType.OTHER,
  ];

  private get requiredTypes(): ComplianceDocType[] {
    return ConformiteService.REQUIRED_TYPES;
  }

  // --- Recalcul automatique du statut EXPIRED ------------------------------

  /** Passe en EXPIRED toute pièce arrivée à échéance (persisté). */
  private async refreshExpired(accountId: string, userId?: string): Promise<void> {
    await this.prisma.complianceDocument.updateMany({
      where: {
        accountId,
        ...(userId ? { userId } : {}),
        expiresAt: { lt: new Date() },
        status: { in: [ComplianceStatus.VALID, ComplianceStatus.PENDING] },
      },
      data: { status: ComplianceStatus.EXPIRED },
    });
  }

  /** Une pièce est-elle en alerte d'échéance ou de renouvellement ? */
  private isExpiringSoon(doc: { type: ComplianceDocType; expiresAt: Date | null; issuedAt: Date | null }): boolean {
    const now = Date.now();
    if (doc.expiresAt && doc.expiresAt.getTime() <= now + EXPIRY_WARNING_DAYS * DAY_MS) {
      return true;
    }
    if (doc.type === ComplianceDocType.CRIMINAL_RECORD && doc.issuedAt) {
      const limit = now - CRIMINAL_RECORD_MAX_MONTHS * 30 * DAY_MS;
      if (doc.issuedAt.getTime() < limit) return true;
    }
    return false;
  }

  /** Calcule la complétude d'un dossier à partir de ses pièces réelles. */
  private computeCompleteness(
    docs: { type: ComplianceDocType; status: ComplianceStatus; expiresAt: Date | null; issuedAt: Date | null }[],
  ): Completeness {
    const total = this.requiredTypes.length;
    let valid = 0;
    let expiringSoon = 0;

    for (const doc of docs) {
      if (this.requiredTypes.includes(doc.type) && doc.status === ComplianceStatus.VALID) {
        valid += 1;
      }
      if (this.isExpiringSoon(doc)) {
        expiringSoon += 1;
      }
    }

    const missing = this.requiredTypes.filter((type) => {
      const doc = docs.find((d) => d.type === type);
      return !doc || doc.status === ComplianceStatus.MISSING;
    }).length;

    const pct = total ? Math.round((valid / total) * 100) : 0;
    return { total, valid, pct, expiringSoon, missing };
  }

  // --- Vues -----------------------------------------------------------------

  /** Synthèse de conformité pour chaque membre du compte. */
  async summaryForAccount(accountId: string) {
    await this.refreshExpired(accountId);

    const memberships = await this.prisma.membership.findMany({
      where: { accountId, status: MembershipStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            profile: { select: { job: true } },
          },
        },
      },
    });

    const docs = await this.prisma.complianceDocument.findMany({ where: { accountId } });
    const docsByUser = new Map<string, typeof docs>();
    for (const doc of docs) {
      const list = docsByUser.get(doc.userId) ?? [];
      list.push(doc);
      docsByUser.set(doc.userId, list);
    }

    const members = memberships.map((m) => {
      const userDocs = docsByUser.get(m.userId) ?? [];
      const user: ComplianceUser = {
        id: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        avatarUrl: m.user.avatarUrl,
        job: m.user.profile?.job ?? null,
      };
      return { membershipRole: m.role, user, completeness: this.computeCompleteness(userDocs) };
    });

    return {
      accountId,
      requiredTypes: this.requiredTypes,
      totalMembers: members.length,
      members,
    };
  }

  /** Détail des pièces d'un membre, avec entrées virtuelles MISSING pour les types requis absents. */
  async listForUser(accountId: string, userId: string) {
    await this.refreshExpired(accountId, userId);

    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            profile: { select: { job: true } },
          },
        },
      },
    });
    if (!membership) {
      throw new NotFoundException("Ce membre n'appartient pas à ce compte.");
    }

    const docs = await this.prisma.complianceDocument.findMany({
      where: { accountId, userId },
    });
    const byType = new Map(docs.map((d) => [d.type, d]));

    const documents = [
      // Types obligatoires : réel ou entrée virtuelle MISSING.
      ...this.requiredTypes.map((type) => {
        const doc = byType.get(type);
        return doc ? this.serialize(doc, true) : this.virtualEntry(type, true);
      }),
      // Pièces optionnelles réellement déposées (VITALE, OTHER).
      ...docs
        .filter((d) => !this.requiredTypes.includes(d.type))
        .map((d) => this.serialize(d, false)),
    ];

    const user: ComplianceUser = {
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      avatarUrl: membership.user.avatarUrl,
      job: membership.user.profile?.job ?? null,
    };

    return {
      accountId,
      user,
      completeness: this.computeCompleteness(docs),
      documents,
    };
  }

  /** Crée / met à jour une pièce sur la clé unique (userId, accountId, type). */
  async upsertDocument(accountId: string, userId: string, dto: UpsertComplianceDto) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership) {
      throw new BadRequestException("Ce membre n'appartient pas à ce compte.");
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : undefined;

    // Recalcul EXPIRED automatique si la date d'échéance est passée.
    let status = dto.status;
    if (expiresAt && expiresAt.getTime() < Date.now() && status && status !== ComplianceStatus.MISSING) {
      status = ComplianceStatus.EXPIRED;
    }

    return this.prisma.complianceDocument.upsert({
      where: { userId_accountId_type: { userId, accountId, type: dto.type } },
      create: {
        userId,
        accountId,
        type: dto.type,
        label: dto.label,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        issuedAt,
        expiresAt,
        status: status ?? ComplianceStatus.PENDING,
      },
      update: {
        label: dto.label,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        issuedAt,
        expiresAt,
        status,
      },
    });
  }

  // --- ADMIN plateforme -----------------------------------------------------

  /** Complétude agrégée de TOUS les comptes établissements (back-office ADMIN). */
  async summaryForAllEstablishments() {
    const accounts = await this.prisma.account.findMany({
      where: { type: 'ESTABLISHMENT' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, city: true },
    });

    const rows = await Promise.all(
      accounts.map(async (account) => {
        const summary = await this.summaryForAccount(account.id);
        const members = summary.members;
        const memberCount = members.length;
        const pctAvg = memberCount
          ? Math.round(members.reduce((acc, m) => acc + m.completeness.pct, 0) / memberCount)
          : 0;
        const expiringSoon = members.reduce((acc, m) => acc + m.completeness.expiringSoon, 0);
        const missing = members.reduce((acc, m) => acc + m.completeness.missing, 0);
        const fullyCompliant = members.filter((m) => m.completeness.pct === 100).length;
        return {
          account,
          memberCount,
          pctAvg,
          expiringSoon,
          missing,
          fullyCompliant,
        };
      }),
    );

    return {
      requiredTypes: this.requiredTypes,
      totalAccounts: rows.length,
      accounts: rows,
    };
  }

  // --- Helpers de sérialisation --------------------------------------------

  private serialize(
    doc: {
      id: string;
      type: ComplianceDocType;
      label: string | null;
      status: ComplianceStatus;
      fileUrl: string | null;
      issuedAt: Date | null;
      expiresAt: Date | null;
      notes: string | null;
      updatedAt: Date;
    },
    required: boolean,
  ) {
    return {
      id: doc.id as string | null,
      type: doc.type,
      label: doc.label,
      status: doc.status,
      fileUrl: doc.fileUrl,
      issuedAt: doc.issuedAt,
      expiresAt: doc.expiresAt,
      notes: doc.notes,
      required,
      expiringSoon: this.isExpiringSoon(doc),
      updatedAt: doc.updatedAt as Date | null,
    };
  }

  private virtualEntry(type: ComplianceDocType, required: boolean) {
    return {
      id: null as string | null,
      type,
      label: null,
      status: ComplianceStatus.MISSING,
      fileUrl: null,
      issuedAt: null as Date | null,
      expiresAt: null as Date | null,
      notes: null,
      required,
      expiringSoon: false,
      updatedAt: null as Date | null,
    };
  }
}
