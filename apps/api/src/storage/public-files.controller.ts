import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FilesService } from './files.service';

/**
 * Lecture PUBLIQUE des illustrations d'actualités, sans authentification.
 * Volontairement séparé de FilesController : ce contrôleur n'a aucun garde, il
 * ne doit donc servir qu'une seule famille de fichiers, et le service le vérifie.
 */
@Controller('public/images')
export class PublicFilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':id')
  async lire(@Param('id') id: string, @Res({ passthrough: false }) res: Response) {
    const { flux, type, taille } = await this.files.lirePublic(id);
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', String(taille));
    // Image immuable : on autorise un cache long côté navigateur et CDN.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    flux.pipe(res);
  }
}
