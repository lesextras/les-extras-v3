import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, CreditsService],
  // Exporté pour l'assistant : chaque génération LEX consomme un crédit.
  exports: [CreditsService],
})
export class BillingModule {}
