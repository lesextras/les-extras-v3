import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { AccountRole, FileKind, GlobalRole, MembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { StorageService } from './storage.service';
import { REGLES, typeReel, nomSur } from './file-rules';

/** Fichier reçu par multer (mémoire). Type minimal, pour éviter @types/multer. */
export interface FichierRecu {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Vue publique d'un fichier : jamais la clé de stockage. */
export interface FichierResume {
  id: string;
  nom: string;
  type: string;
  taille: number;
  famille: FileKind;
  deposeLe: Date;
  /** Adresse de téléchargement, servie par l'API après contrôle des droits. */
  url: string;
}

/** Rôles d'un compte autorisés à consulter les pièces de conformité. */
const ROLES_CONFORMITE: AccountRole[] = [
  AccountRole.OWNER,
  AccountRole.ADMIN,
  AccountRole.MANAGER,
];

/**
 * DÉPÔT DE DOCUMENTS — règles métier et contrôle d'accès.
 *
 * Principe directeur : un fichier n'est jamais accessible par son adresse.
 * Chaque téléchargement rejoue le contrôle des droits, et les pièces du
 * coffre-fort laissent une trace dans le journal d'audit — on doit pouvoir
 * dire qui a consulté le casier judiciaire d'un intervenant, et quand.
 */
@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────────────────── Dépôt ──

  async deposer(params: {
    fichier: FichierRecu;
    famille: FileKind;
    userId: string;
    accountId?: string | null;
  }): Promise<FichierResume> {
    const { fichier, famille, userId, accountId } = params;
    const regle = REGLES[famille];
    if (!regle) {
      throw new BadRequestException('Famille de document inconnue.');
    }

    if (!fichier?.buffer?.length) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    if (fichier.size > regle.tailleMax) {
      const maxMo = Math.round(regle.tailleMax / (1024 * 1024));
      throw new PayloadTooLargeException(
        `Ce fichier dépasse la taille autorisée pour une ${regle.libelle} (${maxMo} Mo maximum).`,
      );
    }

    // Le type réel prime sur ce que déclare le navigateur.
    const type = typeReel(fichier.buffer, fichier.mimetype);
    if (!type) {
      throw new BadRequestException(
        'Le format de ce fichier n’a pas pu être reconnu. Formats acceptés : PDF, JPEG, PNG, WEBP.',
      );
    }
    if (!regle.types.includes(type)) {
      throw new BadRequestException(
        `Ce format n’est pas accepté pour une ${regle.libelle}.`,
      );
    }

    const nom = nomSur(fichier.originalname);
    const cle = this.storage.construireCle(famille, nom);
    const empreinte = createHash('sha256').update(fichier.buffer).digest('hex');

    await this.storage.deposer(cle, fichier.buffer, type);

    const asset = await this.prisma.fileAsset.create({
      data: {
        storageKey: cle,
        originalName: nom,
        mimeType: type,
        size: fichier.size,
        checksum: empreinte,
        kind: famille,
        uploaderId: userId,
        accountId: accountId ?? null,
      },
    });

    if (famille === FileKind.COMPLIANCE) {
      await this.audit.log({
        actorId: userId,
        accountId: accountId ?? null,
        action: 'document.depose',
        entityType: 'FileAsset',
        entityId: asset.id,
        summary: `Pièce de conformité « ${nom} » déposée.`,
        metadata: { type, taille: fichier.size },
      });
    }

    return this.resumer(asset);
  }

  // ─────────────────────────────────────────────── Téléchargement ──

  /**
   * Vérifie les droits puis renvoie le flux du fichier.
   * Toute consultation d'une pièce de conformité est journalisée.
   */
  async telecharger(
    fileId: string,
    userId: string,
    roleGlobal: GlobalRole,
  ): Promise<{ flux: Readable; nom: string; type: string; taille: number }> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
    });
    if (!asset) throw new NotFoundException('Document introuvable.');

    const autorise = await this.peutConsulter(asset, userId, roleGlobal);
    if (!autorise) {
      throw new ForbiddenException(
        'Ce document ne relève pas de votre périmètre.',
      );
    }

    if (asset.kind === FileKind.COMPLIANCE && asset.uploaderId !== userId) {
      await this.audit.log({
        actorId: userId,
        accountId: asset.accountId,
        action: 'document.consulte',
        entityType: 'FileAsset',
        entityId: asset.id,
        summary: `Pièce de conformité « ${asset.originalName} » consultée.`,
      });
    }

    const flux = await this.storage.lire(asset.storageKey);
    return {
      flux,
      nom: asset.originalName,
      type: asset.mimeType,
      taille: asset.size,
    };
  }

  /**
   * Qui peut voir quoi.
   *
   * - Administrateur de la plateforme : tout, par nécessité de modération.
   * - La personne qui a déposé : toujours son propre fichier.
   * - Coffre-fort : uniquement les responsables du compte qui suit le dossier
   *   (propriétaire, administrateur, responsable de service). Un simple salarié
   *   n'a pas à voir le casier judiciaire d'un collègue.
   * - Formation : les membres actifs du compte concerné.
   * - Mission et photo de profil : tout utilisateur connecté. Ce sont des
   *   contenus destinés à circuler (fiche de poste lue par les candidats,
   *   photo affichée dans les listes).
   */
  private async peutConsulter(
    asset: { kind: FileKind; accountId: string | null; uploaderId: string | null },
    userId: string,
    roleGlobal: GlobalRole,
  ): Promise<boolean> {
    if (roleGlobal === GlobalRole.ADMIN) return true;
    if (asset.uploaderId && asset.uploaderId === userId) return true;

    if (asset.kind === FileKind.MISSION || asset.kind === FileKind.AVATAR) {
      return true;
    }

    if (!asset.accountId) return false;

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        accountId: asset.accountId,
        status: MembershipStatus.ACTIVE,
      },
      select: { role: true },
    });
    if (!membership) return false;

    if (asset.kind === FileKind.COMPLIANCE) {
      return ROLES_CONFORMITE.includes(membership.role);
    }
    return true; // FORMATION : tout membre actif du compte.
  }

  // ───────────────────────────────────────────────── Suppression ──

  /** Supprime un fichier : d'abord la ligne, puis l'objet dans le dépôt. */
  async supprimer(
    fileId: string,
    userId: string,
    roleGlobal: GlobalRole,
  ): Promise<{ supprime: true }> {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
    });
    if (!asset) throw new NotFoundException('Document introuvable.');

    const proprietaire = asset.uploaderId === userId;
    const admin = roleGlobal === GlobalRole.ADMIN;
    let responsable = false;
    if (!proprietaire && !admin && asset.accountId) {
      const m = await this.prisma.membership.findFirst({
        where: {
          userId,
          accountId: asset.accountId,
          status: MembershipStatus.ACTIVE,
          role: { in: ROLES_CONFORMITE },
        },
        select: { id: true },
      });
      responsable = !!m;
    }
    if (!proprietaire && !admin && !responsable) {
      throw new ForbiddenException(
        'Vous ne pouvez pas supprimer ce document.',
      );
    }

    await this.prisma.fileAsset.delete({ where: { id: fileId } });
    await this.storage.supprimer(asset.storageKey);

    await this.audit.log({
      actorId: userId,
      accountId: asset.accountId,
      action: 'document.supprime',
      entityType: 'FileAsset',
      entityId: fileId,
      summary: `Document « ${asset.originalName} » supprimé.`,
      metadata: { famille: asset.kind },
    });

    return { supprime: true };
  }

  /**
   * Efface tous les fichiers d'une personne — lignes en base ET objets dans le
   * dépôt. Appelé par la procédure d'effacement RGPD.
   */
  async effacerPourUtilisateur(userId: string): Promise<number> {
    const assets = await this.prisma.fileAsset.findMany({
      where: { uploaderId: userId },
      select: { id: true, storageKey: true },
    });
    if (assets.length === 0) return 0;

    await this.prisma.fileAsset.deleteMany({
      where: { id: { in: assets.map((a) => a.id) } },
    });
    await this.storage.supprimerPlusieurs(assets.map((a) => a.storageKey));
    return assets.length;
  }

  // ──────────────────────────────────────────────────── Utilitaires ──

  private resumer(asset: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    kind: FileKind;
    createdAt: Date;
  }): FichierResume {
    return {
      id: asset.id,
      nom: asset.originalName,
      type: asset.mimeType,
      taille: asset.size,
      famille: asset.kind,
      deposeLe: asset.createdAt,
      url: `/files/${asset.id}`,
    };
  }
}
