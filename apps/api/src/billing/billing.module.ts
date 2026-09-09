import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { EcoleModule } from '../ecole/ecole.module';

@Module({
  // L'école est importée pour une seule raison : quand le webhook confirme
  // l'achat d'une formation, c'est elle qui sait écrire le message d'accès,
  // aux couleurs de l'organisme. Aucune dépendance en sens inverse.
  imports: [EcoleModule],
  controllers: [BillingController],
  providers: [BillingService, CreditsService],
  // Exporté pour l'assistant : chaque génération LEX consomme un crédit.
  exports: [CreditsService],
})
export class BillingModule {}
