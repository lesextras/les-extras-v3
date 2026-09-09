import { Module } from '@nestjs/common';
import { AteliersService } from './ateliers.service';
import { AteliersController } from './ateliers.controller';
import { AteliersPublicController } from './ateliers-public.controller';

/**
 * LE PAIEMENT EN LIGNE DES ATELIERS.
 *
 * Le contrôleur public est déclaré en premier : ses routes sont fixes et ne
 * doivent jamais être interceptées par un paramètre du contrôleur privé.
 */
@Module({
  controllers: [AteliersPublicController, AteliersController],
  providers: [AteliersService],
  exports: [AteliersService],
})
export class AteliersModule {}
