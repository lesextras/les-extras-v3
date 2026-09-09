import { Controller, Get, Headers, NotFoundException, Param, Res } from '@nestjs/common';
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

/** Types réellement servis par la médiathèque. Liste fermée, elle aussi. */
const TYPES_MEDIA = new Set([
  'video/mp4',
  'audio/mpeg',
  'audio/mp4',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * LA MÉDIATHÈQUE D'UNE FORMATION, en lecture publique.
 *
 * Une leçon se suit avec un jeton personnel, pas avec un compte : le lecteur
 * vidéo du navigateur ne sait pas présenter d'en-tête d'authentification. Le
 * fichier est donc servi sans contrôle, comme l'illustration d'un article —
 * avec les mêmes garde-fous : la famille est vérifiée en base, le type MIME
 * est revalidé ici, la clé de stockage n'est jamais exposée, et l'identifiant
 * n'est pas devinable.
 *
 * La différence avec une image : une vidéo se lit par tranches. Le navigateur
 * demande un intervalle d'octets (« Range »), et sans réponse 206 la barre de
 * progression reste inerte — on peut regarder la vidéo, pas s'y déplacer.
 */
@Controller('public/medias')
export class PublicMediasController {
  constructor(private readonly files: FilesService) {}

  @Throttle({ default: { limit: 600, ttl: 60_000 } })
  @Get(':id')
  async lire(
    @Param('id') id: string,
    @Headers('range') range: string | undefined,
    @Res({ passthrough: false }) res: Response,
  ) {
    const media = await this.files.fichePublicMedia(id);
    if (!TYPES_MEDIA.has(media.type)) throw new NotFoundException('Média introuvable.');

    res.setHeader('Content-Type', media.type);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');
    // Le contenu d'un identifiant donné ne change jamais : cache long.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(media.nom)}`,
    );

    const demande = decouperRange(range, media.taille);
    if (demande === 'invalide') {
      res.status(416);
      res.setHeader('Content-Range', `bytes */${media.taille}`);
      res.end();
      return;
    }

    if (!demande) {
      res.setHeader('Content-Length', String(media.taille));
      const flux = await this.files.lireEntier(media.cle);
      flux.pipe(res);
      return;
    }

    const { debut, fin } = demande;
    const longueur = fin - debut + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${debut}-${fin}/${media.taille}`);
    res.setHeader('Content-Length', String(longueur));
    const flux = await this.files.lireTranche(media.cle, debut, longueur);
    flux.pipe(res);
  }
}

/**
 * Lit un en-tête « Range » simple : `bytes=debut-fin`, les deux bornes
 * facultatives. Renvoie `null` quand il n'y en a pas (on sert tout),
 * `'invalide'` quand la demande sort du fichier (on répond 416).
 *
 * Les demandes à intervalles multiples ne sont pas gérées : aucun lecteur
 * vidéo courant n'en émet, et les traiter demanderait une réponse multipart.
 */
function decouperRange(
  range: string | undefined,
  taille: number,
): { debut: number; fin: number } | null | 'invalide' {
  if (!range) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m) return null;
  const [, g, d] = m;
  if (g === '' && d === '') return null;

  let debut: number;
  let fin: number;
  if (g === '') {
    // « bytes=-500 » : les cinq cents derniers octets.
    const combien = Number(d);
    if (!Number.isFinite(combien) || combien <= 0) return 'invalide';
    debut = Math.max(0, taille - combien);
    fin = taille - 1;
  } else {
    debut = Number(g);
    fin = d === '' ? taille - 1 : Number(d);
  }
  if (!Number.isFinite(debut) || !Number.isFinite(fin)) return 'invalide';
  if (debut < 0 || debut >= taille || fin < debut) return 'invalide';
  if (fin > taille - 1) fin = taille - 1;
  return { debut, fin };
}
