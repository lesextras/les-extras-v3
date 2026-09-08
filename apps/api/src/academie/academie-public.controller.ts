import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ETAPES_ACADEMIE, VERSION_CHEMIN_ACADEMIE, trouverEtapeAcademie } from './chemin';
import { RepertoiresFormationService } from './repertoires';

/**
 * LA FACE PUBLIQUE DE « PILOTER MON ACADÉMIE ».
 *
 * Le chemin se lit sans compte : c'est lui qui donne envie d'en ouvrir un.
 * Aucune donnée d'organisme ici — seulement le référentiel, le même pour tout
 * le monde, écrit en dur dans le code.
 */
@Controller('public/academie')
export class AcademiePublicController {
  constructor(private readonly repertoires: RepertoiresFormationService) {}

  /**
   * CHERCHER SON ORGANISME DANS LES RÉPERTOIRES PUBLICS.
   *
   * Comme pour l'association : on ne demande pas de recopier ce que l'État
   * publie déjà. SIRENE donne le nom, le SIREN, le SIRET et l'adresse ; la
   * liste publique des organismes de formation y ajoute le numéro de
   * déclaration d'activité et l'état de la certification.
   */
  @Get('recherche')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async recherche(@Query('q') q?: string) {
    const terme = (q ?? '').trim();
    if (terme.length < 3) throw new BadRequestException('Écris au moins trois lettres.');
    return { organismes: await this.repertoires.rechercher(terme) };
  }

  /** La fiche complète d'un organisme, à partir de son SIREN. */
  @Get('organisme/:siren')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async organisme(@Param('siren') siren: string) {
    return this.repertoires.fiche(siren);
  }

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
