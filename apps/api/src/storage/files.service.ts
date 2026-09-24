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
import { REGLES, TAILLE_MAX_MEDIA, typeReel, nomSur } from './file-rules';
import { AdresseRefusee, telechargerAdressePublique, type Telechargement } from '../common/reseau-sur';

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
        'Le format de ce fichier n’a pas pu être reconnu. Formats acceptés selon le document : PDF, Word, JPEG, PNG, WEBP.',
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
  /**
   * Familles servies SANS authentification. La liste est fermée et elle le
   * reste : une pièce de conformité ne doit jamais sortir sans contrôle.
   *
   * Les deux qui y figurent illustrent des pages publiques — un article de
   * l'Édublog, une fiche du catalogue d'ateliers. Elles sont vues par des
   * visiteurs non connectés par définition ; les servir derrière un jeton
   * reviendrait à publier une page dont les images répondent 401.
   */
  private static readonly FAMILLES_PUBLIQUES: ReadonlySet<FileKind> = new Set([
    FileKind.ARTICLE,
    FileKind.SERVICE,
    // La médiathèque d'une formation : l'apprenant ouvre son cours avec un
    // jeton, sans compte, et le lecteur vidéo du navigateur ne sait pas
    // présenter d'en-tête d'authentification. La clé de stockage n'est jamais
    // exposée et l'identifiant n'est pas devinable.
    FileKind.MEDIA,
  ]);

  /** Lecture PUBLIQUE d'une illustration, réservée aux familles ci-dessus. */
  async lirePublic(fileId: string) {
    const asset = await this.prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!asset || !FilesService.FAMILLES_PUBLIQUES.has(asset.kind)) {
      throw new NotFoundException('Image introuvable.');
    }
    const flux = await this.storage.lire(asset.storageKey);
    return { flux, nom: asset.originalName, type: asset.mimeType, taille: asset.size };
  }

  /**
   * LA FICHE D'UN MÉDIA PUBLIC, sans son contenu.
   *
   * Le contrôleur en a besoin avant de lire quoi que ce soit : il doit
   * connaître la taille du fichier pour répondre à une demande d'intervalle,
   * et sa clé de stockage pour aller chercher la tranche demandée.
   */
  async fichePublicMedia(fileId: string) {
    const asset = await this.prisma.fileAsset.findUnique({ where: { id: fileId } });
    if (!asset || asset.kind !== FileKind.MEDIA) {
      throw new NotFoundException('Média introuvable.');
    }
    return {
      cle: asset.storageKey,
      nom: asset.originalName,
      type: asset.mimeType,
      taille: asset.size,
    };
  }

  /** Une tranche d'octets d'un média public — pour le déplacement du curseur. */
  async lireTranche(cle: string, debut: number, longueur: number): Promise<Readable> {
    return this.storage.lirePartiel(cle, debut, longueur);
  }

  /** Le média entier, quand aucun intervalle n'est demandé. */
  async lireEntier(cle: string): Promise<Readable> {
    return this.storage.lire(cle);
  }

  /**
   * RAPATRIER UN MÉDIA DEPUIS SON ADRESSE.
   *
   * Sert à une seule chose, mais elle compte : reprendre chez soi les vidéos
   * et les documents d'une formation encore hébergés chez un prestataire
   * qu'on s'apprête à quitter. Le fichier est téléchargé par le serveur, puis
   * déposé comme n'importe quel média — mêmes règles de format et de taille.
   *
   * L'adresse est fournie par un membre du compte, jamais par un visiteur, et
   * seuls http(s) sont acceptés : on ne va pas lire un fichier local du
   * serveur parce qu'on nous l'a demandé.
   */
  async importerMedia(params: {
    url: string;
    nom?: string | null;
    userId: string;
    accountId: string;
  }): Promise<FichierResume> {
    // ⚠ Jamais `fetch` directement ici : voir `common/reseau-sur.ts` (SSRF,
    // corrigé le 24/09/2026). Le plafond est celui d'un média déposé à la main.
    let charge: Telechargement;
    try {
      charge = await telechargerAdressePublique(params.url, { maxOctets: TAILLE_MAX_MEDIA, delaiMs: 120_000 });
    } catch (e) {
      if (e instanceof AdresseRefusee) throw new BadRequestException(e.message);
      throw new BadRequestException(
        `Le fichier n'a pas pu être récupéré : ${(e as Error).message.slice(0, 120)}`,
      );
    }
    const cible = charge.url;
    const octets = charge.octets;
    const nom =
      params.nom?.trim() ||
      decodeURIComponent(cible.pathname.split('/').pop() || '') ||
      'media';

    return this.deposer({
      fichier: {
        originalname: nom,
        mimetype: charge.type.split(';')[0]?.trim() || '',
        size: octets.length,
        buffer: octets,
      },
      famille: FileKind.MEDIA,
      userId: params.userId,
      accountId: params.accountId,
    });
  }

  /** Les médias déposés par une académie, du plus récent au plus ancien. */
  async listerMedias(accountId: string) {
    const assets = await this.prisma.fileAsset.findMany({
      where: { accountId, kind: FileKind.MEDIA },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return assets.map((a) => ({
      id: a.id,
      nom: a.originalName,
      type: a.mimeType,
      taille: a.size,
      deposeLe: a.createdAt,
      url: `/public/medias/${a.id}`,
    }));
  }

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
    asset: { id: string; kind: FileKind; accountId: string | null; uploaderId: string | null },
    userId: string,
    roleGlobal: GlobalRole,
  ): Promise<boolean> {
    if (roleGlobal === GlobalRole.ADMIN) return true;
    if (asset.uploaderId && asset.uploaderId === userId) return true;

    if (asset.kind === FileKind.MISSION || asset.kind === FileKind.AVATAR) {
      return true;
    }

    // Un devis signé se lit des deux côtés du devis, client comme intervenant
    // — jamais depuis le seul compte qui l'a déposé.
    if (asset.kind === FileKind.QUOTE) {
      const devis = await this.prisma.quote.findFirst({
        where: { signedFileId: asset.id },
        select: { clientAccountId: true, providerAccountId: true },
      });
      if (!devis) return false;
      const partie = await this.prisma.membership.findFirst({
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
          accountId: { in: [devis.clientAccountId, devis.providerAccountId] },
        },
        select: { id: true },
      });
      return Boolean(partie);
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
      // Un média de formation se lit sans compte : on rend tout de suite
      // l'adresse publique, celle qu'on collera dans une leçon.
      // Adresse relative à l'API, comme pour les autres familles : c'est la
      // couche web qui la préfixe de son proxy.
      url:
        asset.kind === FileKind.MEDIA
          ? `/public/medias/${asset.id}`
          : `/files/${asset.id}`,
    };
  }
}
