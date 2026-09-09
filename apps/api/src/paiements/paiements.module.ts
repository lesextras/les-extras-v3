import { Global, Module } from '@nestjs/common';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectController } from './stripe-connect.controller';

/**
 * LE BRANCHEMENT D'ENCAISSEMENT, PARTAGÉ.
 *
 * Global à dessein : l'école et la boutique s'en servent toutes les deux pour
 * savoir où doit aller l'argent d'une vente, sans avoir à s'importer l'une
 * l'autre.
 */
@Global()
@Module({
  controllers: [StripeConnectController],
  providers: [StripeConnectService],
  exports: [StripeConnectService],
})
export class PaiementsModule {}
