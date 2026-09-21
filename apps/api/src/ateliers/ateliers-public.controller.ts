import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AteliersService } from './ateliers.service';
import { PayerAtelierDto } from './dto/ateliers.dto';

/**
 * PAYER UN ATELIER SANS COMPTE.
 *
 * L'origine est lue dans l'en-tête plutôt que reçue du corps : l'adresse de
 * retour après paiement ne doit pas pouvoir être choisie par celui qui appelle.
 *
 * ⚠ LES DEUX ROUTES SONT PLAFONNÉES, ET C'EST LE SEUL MODULE PUBLIC D'ÉCRITURE
 * QUI NE L'ÉTAIT PAS (relevé par l'audit du 16/09/2026). Ce qui se paie ici ne
 * demande ni compte ni session : sans plafond, `payer` ouvre autant de sessions
 * Stripe qu'on veut depuis n'importe où — des frais chez le prestataire, des
 * réservations fantômes dans les listes de l'intervenant, et un écran
 * d'administration illisible. `confirmer` est plus délicate encore : elle prend
 * un identifiant de session en paramètre d'URL, donc sans plafond elle se prête
 * au balayage.
 *
 * Les valeurs sont volontairement larges (10 paiements et 30 confirmations par
 * heure) : un plafond qui gênerait une famille qui s'y reprend à trois fois
 * coûterait plus cher que l'abus qu'il évite. Le retour de Stripe, lui, passe
 * par le webhook signé, pas par ces routes.
 */
@Controller('public/ateliers')
export class AteliersPublicController {
  private static readonly ORIGINE_PAR_DEFAUT = 'https://les-extras.fr';

  constructor(private readonly ateliers: AteliersService) {}

  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post(':serviceId/payer')
  payer(
    @Param('serviceId') serviceId: string,
    @Body() dto: PayerAtelierDto,
    @Headers('origin') origine?: string,
  ) {
    return this.ateliers.payer(serviceId, dto, this.origineSure(origine));
  }

  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
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
