import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { FilesService } from './files.service';

/** Types réellement servis : une image d'actualité n'est jamais autre chose. */
const TYPES_AUTORISES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Lecture PUBLIQUE des illustrations d'actualités, sans authentification.
 * Volontairement séparé de FilesController : ce contrôleur n'a aucun garde, il
 * ne doit donc servir qu'une seule famille de fichiers. Trois barrières :
 * le service refuse tout ce qui n'est pas `FileKind.ARTICLE`, le type MIME est
 * revalidé ici, et le débit est plafonné pour décourager l'énumération.
 */
@Controller('public/images')
export class PublicFilesController {
  constructor(private readonly files: FilesService) {}

  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  @Get(':id')
  async lire(@Param('id') id: string, @Res({ passthrough: false }) res: Response) {
    const { flux, type, taille } = await this.files.lirePublic(id);
    if (!TYPES_AUTORISES.has(type)) throw new NotFoundException('Image introuvable.');
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', String(taille));
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Image immuable : on autorise un cache long côté navigateur et CDN.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    flux.pipe(res);
  }
}
