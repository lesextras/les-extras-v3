import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { AttestationsService } from './attestations.service';
import {
  AnnulerAttestationDto,
  CommanderAttestationDto,
} from './dto/attestation.dto';

/**
 * L'ATTESTATION DE SUIVI — la commande est PUBLIQUE, la délivrance est
 * réservée à l'administration.
 *
 * ⚠ LA COMMANDE N'A PAS DE GARDE, ET C'EST VOULU. Les parcours gratuits se
 * suivent hors de la plateforme, sans compte : exiger une connexion pour
 * acheter le document qui atteste du parcours qu'on vient de finir ferait
 * abandonner presque tout le monde. Le plafond de débit remplace la garde —
 * même réglage que les autres formulaires ouverts du site.
 */
@Controller('attestations')
export class AttestationsController {
  constructor(private readonly attestations: AttestationsService) {}

  /** POST /attestations — ouvre le paiement. Public. */
  @Throttle({ default: { limit: 8, ttl: 3_600_000 } })
  @Post()
  commander(@Body() dto: CommanderAttestationDto) {
    return this.attestations.commander(dto);
  }

  /**
   * GET /attestations/admin — la file des commandes.
   *
   * ⚠ LE SEGMENT « admin » EST DANS LE CHEMIN plutôt que dans le contrôleur
   * d'administration, pour que la règle de cette ressource — publique à la
   * commande, fermée au reste — se lise dans un seul fichier. Nest garde la
   * PREMIÈRE route déclarée quand deux se ressemblent, sans le dire : un
   * `@Get(':id')` posé au-dessus avalerait celle-ci.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  lister() {
    return this.attestations.lister();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/:id/delivrer')
  delivrer(@Param('id') id: string) {
    return this.attestations.delivrer(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/:id/annuler')
  annuler(@Param('id') id: string, @Body() dto: AnnulerAttestationDto) {
    return this.attestations.annuler(id, dto?.motif);
  }
}
