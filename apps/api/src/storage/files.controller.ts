import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { FileKind } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAccountGuard } from '../common/guards/optional-account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestUser, RequestAccount } from '../common/types/request-context';
import { FilesService, FichierRecu } from './files.service';
import { TAILLE_MAX_GLOBALE, TAILLE_MAX_MEDIA } from './file-rules';

/**
 * DÉPÔT ET TÉLÉCHARGEMENT DE DOCUMENTS.
 *
 * Aucune adresse publique n'est exposée : tout passe par ces routes, protégées
 * par l'authentification, et les droits sont revérifiés à chaque appel.
 *
 * Le compte actif (en-tête x-account-id) est facultatif ici : un intervenant
 * indépendant dépose ses pièces sans compte d'établissement actif. Quand il est
 * présent, il rattache le fichier au périmètre du compte.
 */
@Controller('files')
@UseGuards(JwtAuthGuard, OptionalAccountGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /**
   * DÉPÔT D'UN MÉDIA DE FORMATION — vidéo, audio, document d'une leçon.
   *
   * Route séparée du dépôt ordinaire, et déclarée avant lui : elle seule
   * accepte les gros fichiers. Mélanger les deux reviendrait à laisser
   * n'importe quel dépôt charger cent cinquante mégaoctets en mémoire avant
   * d'être refusé.
   *
   * Un compte actif est exigé ici : un média appartient à une académie.
   */
  @Post('media')
  @Throttle({ default: { limit: 20, ttl: 300_000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_MEDIA, files: 1 } }),
  )
  async deposerMedia(
    @UploadedFile() fichier: FichierRecu,
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account?: RequestAccount,
  ) {
    if (!account?.id) {
      throw new BadRequestException(
        'Choisis l’académie concernée avant de déposer une vidéo.',
      );
    }
    return this.files.deposer({
      fichier,
      famille: FileKind.MEDIA,
      userId: user.id,
      accountId: account.id,
    });
  }

  /** La médiathèque de l'académie active. */
  @Get('medias')
  async medias(@CurrentAccount() account?: RequestAccount) {
    if (!account?.id) return [];
    return this.files.listerMedias(account.id);
  }

  /**
   * Dépose un document. Champ de formulaire : `file`. Le tampon reste en
   * mémoire (les fichiers sont petits) et part aussitôt vers le dépôt.
   */
  @Post(':famille')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }),
  )
  async deposer(
    @Param('famille') famille: string,
    @UploadedFile() fichier: FichierRecu,
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account?: RequestAccount,
  ) {
    const cle = famille?.toUpperCase();
    if (cle === FileKind.MEDIA) {
      throw new BadRequestException(
        'Une vidéo de formation se dépose sur sa propre route (/files/media).',
      );
    }
    if (!cle || !(cle in FileKind)) {
      throw new BadRequestException(
        'Famille de document inconnue. Attendu : compliance, mission, avatar, formation, article ou service.',
      );
    }
    return this.files.deposer({
      fichier,
      famille: cle as FileKind,
      userId: user.id,
      accountId: account?.id ?? null,
    });
  }

  /** Renvoie le fichier lui-même, après contrôle des droits. */
  @Get(':id')
  async telecharger(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { flux, nom, type, taille } = await this.files.telecharger(
      id,
      user.id,
      user.role,
    );
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', String(taille));
    // inline : les PDF et images s'ouvrent dans l'onglet plutôt que de forcer
    // un téléchargement. Le nom est encodé pour supporter les accents.
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(nom)}`,
    );
    // Ces documents ne doivent jamais être mis en cache par un intermédiaire.
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    flux.pipe(res);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.files.supprimer(id, user.id, user.role);
  }
}
