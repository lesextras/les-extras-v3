import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { AteliersService } from './ateliers.service';
import { PayerAtelierDto } from './dto/ateliers.dto';

/**
 * PAYER UN ATELIER SANS COMPTE.
 *
 * L'origine est lue dans l'en-tête plutôt que reçue du corps : l'adresse de
 * retour après paiement ne doit pas pouvoir être choisie par celui qui appelle.
 */
@Controller('public/ateliers')
export class AteliersPublicController {
  private static readonly ORIGINE_PAR_DEFAUT = 'https://les-extras.fr';

  constructor(private readonly ateliers: AteliersService) {}

  @Post(':serviceId/payer')
  payer(
    @Param('serviceId') serviceId: string,
    @Body() dto: PayerAtelierDto,
    @Headers('origin') origine?: string,
  ) {
    return this.ateliers.payer(serviceId, dto, this.origineSure(origine));
  }

  @Post(':serviceId/confirmer/:sessionId')
  confirmer(
    @Param('serviceId') serviceId: string,
    @Param('sessionId') sessionId: string,
    @Headers('origin') origine?: string,
  ) {
    return this.ateliers.confirmer(serviceId, sessionId, this.origineSure(origine));
  }

  /**
   * On n'accepte qu'une adresse à nous. Un en-tête d'origine se falsifie ;
   * s'en servir tel quel enverrait l'acheteur, après paiement, sur la page de
   * quelqu'un d'autre.
   */
  private origineSure(origine?: string): string {
    if (!origine) return AteliersPublicController.ORIGINE_PAR_DEFAUT;
    try {
      const hote = new URL(origine).hostname;
      const permis =
        hote === 'les-extras.fr' ||
        hote.endsWith('.les-extras.fr') ||
        hote === 'localhost' ||
        hote === '127.0.0.1';
      return permis ? origine : AteliersPublicController.ORIGINE_PAR_DEFAUT;
    } catch {
      return AteliersPublicController.ORIGINE_PAR_DEFAUT;
    }
  }
}
