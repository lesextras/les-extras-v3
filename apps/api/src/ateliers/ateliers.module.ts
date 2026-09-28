import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
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
  // AuthModule : le paiement d'un atelier ouvre le compte de l'acheteur.
  imports: [AuthModule],
  controllers: [AteliersPublicController, AteliersController],
  providers: [AteliersService],
  exports: [AteliersService],
})
export class AteliersModule {}
