import { Module } from '@nestjs/common';
import { BoutiqueService } from './boutique.service';
import { BoutiqueController } from './boutique.controller';
import { BoutiquePublicController } from './boutique-public.controller';

/**
 * LA BOUTIQUE DE L'ASSOCIATION.
 *
 * Le contrôleur public est déclaré en premier : ses routes sont fixes, elles
 * ne doivent jamais être interceptées par un paramètre du contrôleur privé.
 */
@Module({
  controllers: [BoutiquePublicController, BoutiqueController],
  providers: [BoutiqueService],
  exports: [BoutiqueService],
})
export class BoutiqueModule {}
