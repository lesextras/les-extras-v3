import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AssociationService } from './association.service';

/**
 * PILOTER MON ASSOCIATION : LES ROUTES PUBLIQUES.
 *
 * Tout ce qui est ici est gratuit et sans compte : la vérification d'une
 * association, le chemin étape par étape, la carte des outils, le
 * référentiel des pièces. C'est l'offre qui fait connaître l'outil.
 */
@Controller('public/association')
export class AssociationPublicController {
  constructor(private readonly service: AssociationService) {}

  /** Recherche par nom, SIREN, SIRET ou RNA. */
  @Get('recherche')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  rechercher(@Query('q') q: string) {
    return this.service.rechercher(q ?? '');
  }

  /** Fiche d'identité + classeur déduit + complétude par dispositif. */
  @Get('fiche/:siren')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  fiche(@Param('siren') siren: string) {
    return this.service.fiche(siren);
  }

  @Get('referentiel/pieces')
  referentiel() {
    return this.service.referentiel();
  }

  @Get('chemin')
  chemin() {
    return this.service.chemin();
  }

  @Get('chemin/:etape')
  etape(@Param('etape') etape: string) {
    return this.service.etape(etape);
  }

  @Get('outils')
  outils() {
    return this.service.outils();
  }
}
