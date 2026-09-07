import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ETAPES_ACADEMIE, VERSION_CHEMIN_ACADEMIE, trouverEtapeAcademie } from './chemin';

/**
 * LA FACE PUBLIQUE DE « PILOTER MON ACADÉMIE ».
 *
 * Le chemin se lit sans compte : c'est lui qui donne envie d'en ouvrir un.
 * Aucune donnée d'organisme ici — seulement le référentiel, le même pour tout
 * le monde, écrit en dur dans le code.
 */
@Controller('public/academie')
export class AcademiePublicController {
  @Get('chemin')
  chemin() {
    return {
      version: VERSION_CHEMIN_ACADEMIE,
      total: ETAPES_ACADEMIE.length,
      etapes: ETAPES_ACADEMIE,
    };
  }

  @Get('chemin/:slug')
  etape(@Param('slug') slug: string) {
    const etape = trouverEtapeAcademie(slug);
    if (!etape) throw new NotFoundException("Cette étape n'existe pas.");
    const index = ETAPES_ACADEMIE.indexOf(etape);
    return {
      etape,
      total: ETAPES_ACADEMIE.length,
      precedente: index > 0 ? resume(index - 1) : null,
      suivante: index < ETAPES_ACADEMIE.length - 1 ? resume(index + 1) : null,
    };
  }
}

function resume(i: number) {
  const e = ETAPES_ACADEMIE[i];
  return { numero: e.numero, slug: e.slug, titre: e.titre };
}
