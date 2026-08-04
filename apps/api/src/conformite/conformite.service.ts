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

  /**
   * Pièces OBLIGATOIRES pour intervenir (médico-social).
   *
   * Le permis de conduire et l'attestation d'auto-entrepreneur en faisaient
   * partie. Résultat à l'écran : une art-thérapeute qui ne conduit pas, et un
   * salarié qui n'est pas auto-entrepreneur, apparaissaient tous deux en
   * « dossier incomplet » pour des pièces qu'ils n'ont aucune raison de
   * fournir. Une obligation qui ne s'applique pas à tout le monde n'est pas
   * une obligation : c'est un reproche adressé au hasard.
   *
   * On garde les quatre qui valent pour quiconque intervient auprès de
   * publics vulnérables et se fait payer : identité, diplôme, casier
   * judiciaire (bulletin n° 3, art. L. 133-6 CASF) et coordonnées bancaires.
   * Les deux autres restent suivies, mais selon la situation.
   */
  static readonly REQUIRED_TYPES: ComplianceDocType[] = [
    ComplianceDocType.IDENTITY,
    ComplianceDocType.DIPLOMA,
    ComplianceDocType.CRIMINAL_RECORD,
    ComplianceDocType.IBAN,
  ];

  /** Ordre d'affichage complet (obligatoires puis selon la situation). */
  static readonly ALL_TYPES: ComplianceDocType[] = [
    ...ConformiteService.REQUIRED_TYPES,
    ComplianceDocType.DRIVING_LICENSE,
    ComplianceDocType.AUTOENTREPRENEUR,
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

  /**
   * Complétude du dossier de plusieurs personnes d'un coup.
   *
   * Écrit pour être appelé sur UNE PAGE de résultats, pas sur tout le compte :
   * la liste d'équipe affiche vingt-cinq personnes, elle demande la complétude
   * de ces vingt-cinq-là. C'est ce qui permet d'afficher une colonne
   * « conformité » sans charger le coffre-fort entier à chaque affichage.
   */
  async completenessForUsers(
    accountId: string,
    userIds: string[],
  ): Promise<Map<string, Completeness>> {
    const parUtilisateur = new Map<string, Completeness>();
    if (userIds.length === 0) return parUtilisateur;

    const docs = await this.prisma.complianceDocument.findMany({
      where: { accountId, userId: { in: userIds } },
      select: { userId: true, type: true, status: true, expiresAt: true, issuedAt: true },
    });

    const groupes = new Map<string, typeof docs>();
    for (const doc of docs) {
      const liste = groupes.get(doc.userId) ?? [];
      liste.push(doc);
      groupes.set(doc.userId, liste);
    }
    for (const id of userIds) {
      parUtilisateur.set(id, this.computeCompleteness(groupes.get(id) ?? []));
    }
    return parUtilisateur;
  }

  /**
   * LES DOSSIERS EN DÉFAUT, triés par urgence.
   *
   * L'ancien écran listait tout le monde, du plus conforme au moins conforme,
   * et laissait le responsable chercher. Or ce qu'il vient chercher, c'est
   * l'inverse : qui n'est pas en règle, et pour quoi. On ne renvoie donc que
   * les dossiers incomplets ou proches de l'échéance, le pire en premier.
   *
   * L'urgence est calculée ainsi : une pièce obligatoire manquante pèse plus
   * qu'une pièce qui expire bientôt, et le casier judiciaire pèse plus que le
   * reste — c'est la pièce qu'une inspection regarde d'abord quand des mineurs
   * sont accompagnés.
   */
  async alertes(
    accountId: string,
    filtres: { page?: number; perPage?: number; orgUnitId?: string } = {},
  ) {
    await this.refreshExpired(accountId);
    const page = Math.max(1, Math.trunc(Number(filtres.page) || 1));
    const perPage = Math.min(100, Math.max(1, Math.trunc(Number(filtres.perPage) || 25)));

    const memberships = await this.prisma.membership.findMany({
      where: {
        accountId,
        status: MembershipStatus.ACTIVE,
        ...(filtres.orgUnitId ? { orgUnitId: filtres.orgUnitId } : {}),
      },
      select: {
        role: true,
        orgUnit: { select: { id: true, name: true } },
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

    const completudes = await this.completenessForUsers(
      accountId,
      memberships.map((m) => m.user.id),
    );

    const enDefaut = memberships
      .map((m) => {
        const c = completudes.get(m.user.id) ?? {
          total: this.requiredTypes.length,
          valid: 0,
          pct: 0,
          expiringSoon: 0,
          missing: this.requiredTypes.length,
        };
        return {
          user: {
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            avatarUrl: m.user.avatarUrl,
            job: m.user.profile?.job ?? null,
          },
          membershipRole: m.role,
          orgUnit: m.orgUnit,
          completeness: c,
          urgence: c.missing * 10 + c.expiringSoon,
        };
      })
      .filter((l) => l.completeness.missing > 0 || l.completeness.expiringSoon > 0)
      .sort((a, b) => b.urgence - a.urgence);

    return {
      items: enDefaut.slice((page - 1) * perPage, page * perPage),
      total: enDefaut.length,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(enDefaut.length / perPage)),
      membresActifs: memberships.length,
      requiredTypes: this.requiredTypes,
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
      include: {
        file: {
          select: { id: true, originalName: true, mimeType: true, size: true },
        },
      },
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
        fileId: dto.fileId ?? null,
        notes: dto.notes,
        issuedAt,
        expiresAt,
        status: status ?? ComplianceStatus.PENDING,
      },
      update: {
        label: dto.label,
        fileUrl: dto.fileUrl,
        // `undefined` = champ non transmis, on ne touche pas au fichier existant.
        ...(dto.fileId !== undefined ? { fileId: dto.fileId || null } : {}),
        notes: dto.notes,
        issuedAt,
        expiresAt,
        status,
      },
    });
  }

  /**
   * DÉPÔT PAR L'INTÉRESSÉ LUI-MÊME.
   *
   * La règle est simple et ne souffre pas d'exception : **la personne fournit,
   * l'établissement valide**. Un intervenant peut déposer sa carte d'identité,
   * son diplôme, son bulletin n°3 — il ne peut pas décréter que sa pièce est
   * en règle. Le statut est donc forcé à « en attente », quoi que la requête
   * demande.
   *
   * Sans cette contrainte, la route ouvrirait une porte franche : n'importe
   * quel membre pourrait marquer son propre casier judiciaire comme valide
   * sans jamais rien téléverser, et le tableau de conformité de la structure
   * afficherait un vert qui ne veut plus rien dire.
   */
  async deposerSonDocument(accountId: string, userId: string, dto: UpsertComplianceDto) {
    return this.upsertDocument(accountId, userId, {
      ...dto,
      status: ComplianceStatus.PENDING,
    });
  }

  // --- ADMIN plateforme -----------------------------------------------------

  /**
   * Complétude agrégée de TOUS les comptes établissements (back-office ADMIN).
   *
   * La version précédente appelait, pour CHAQUE établissement, une synthèse qui
   * chargeait tous ses membres et toutes leurs pièces. Sur mille comptes, cela
   * faisait deux mille requêtes lancées en parallèle — de quoi saturer la base
   * depuis un simple écran de back-office. Trois requêtes désormais, quel que
   * soit le nombre de comptes affichés.
   */
  async summaryForAllEstablishments(filtres: { page?: number; perPage?: number } = {}) {
    const page = Math.max(1, Math.trunc(Number(filtres.page) || 1));
    const perPage = Math.min(200, Math.max(1, Math.trunc(Number(filtres.perPage) || 50)));

    const [accounts, totalAccounts] = await Promise.all([
      this.prisma.account.findMany({
        where: { type: 'ESTABLISHMENT' },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
        select: { id: true, name: true, slug: true, city: true },
      }),
      this.prisma.account.count({ where: { type: 'ESTABLISHMENT' } }),
    ]);

    const accountIds = accounts.map((a) => a.id);
    if (accountIds.length === 0) {
      return { requiredTypes: this.requiredTypes, totalAccounts, page, perPage, accounts: [] };
    }

    const [membres, docs] = await Promise.all([
      this.prisma.membership.findMany({
        where: { accountId: { in: accountIds }, status: MembershipStatus.ACTIVE },
        select: { accountId: true, userId: true },
      }),
      this.prisma.complianceDocument.findMany({
        where: { accountId: { in: accountIds } },
        select: { accountId: true, userId: true, type: true, status: true, expiresAt: true, issuedAt: true },
      }),
    ]);

    // Les pièces, rangées par compte puis par personne.
    const parCompte = new Map<string, Map<string, typeof docs>>();
    for (const d of docs) {
      const personnes = parCompte.get(d.accountId) ?? new Map();
      const liste = personnes.get(d.userId) ?? [];
      liste.push(d);
      personnes.set(d.userId, liste);
      parCompte.set(d.accountId, personnes);
    }

    const rows = accounts.map((account) => {
      const utilisateurs = membres.filter((m) => m.accountId === account.id);
      const personnes = parCompte.get(account.id) ?? new Map();
      const completudes = utilisateurs.map((u) =>
        this.computeCompleteness(personnes.get(u.userId) ?? []),
      );
      const memberCount = completudes.length;
      return {
        account,
        memberCount,
        pctAvg: memberCount
          ? Math.round(completudes.reduce((acc, c) => acc + c.pct, 0) / memberCount)
          : 0,
        expiringSoon: completudes.reduce((acc, c) => acc + c.expiringSoon, 0),
        missing: completudes.reduce((acc, c) => acc + c.missing, 0),
        fullyCompliant: completudes.filter((c) => c.pct === 100).length,
      };
    });

    return { requiredTypes: this.requiredTypes, totalAccounts, page, perPage, accounts: rows };
  }

  // --- Helpers de sérialisation --------------------------------------------

  private serialize(
    doc: {
      id: string;
      type: ComplianceDocType;
      label: string | null;
      status: ComplianceStatus;
      fileUrl: string | null;
      fileId?: string | null;
      file?: { id: string; originalName: string; mimeType: string; size: number } | null;
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
      /** Fichier réellement déposé, servi par l'API après contrôle des droits. */
      fichier: doc.file
        ? {
            id: doc.file.id,
            nom: doc.file.originalName,
            type: doc.file.mimeType,
            taille: doc.file.size,
            url: `/files/${doc.file.id}`,
          }
        : null,
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
      fichier: null as { id: string; nom: string; type: string; taille: number; url: string } | null,
      issuedAt: null as Date | null,
      expiresAt: null as Date | null,
      notes: null,
      required,
      expiringSoon: false,
      updatedAt: null as Date | null,
    };
  }
}
