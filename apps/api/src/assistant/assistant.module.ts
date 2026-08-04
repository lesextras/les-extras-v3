import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { PublicChatController, PublicLexDemoController } from './public-chat.controller';
import { AssistantService } from './assistant.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { MistralService } from './mistral.service';
import { TramesMaisonService } from './trames-maison.service';
import { ExtractionService } from './extraction.service';
import { ExportService } from './export.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  // BillingModule fournit CreditsService : un crédit par génération LEX.
  imports: [BillingModule],
  controllers: [AssistantController, PublicChatController, PublicLexDemoController],
  providers: [
    AssistantService,
    PseudonymiseurService,
    MistralService,
    TramesMaisonService,
    ExtractionService,
    ExportService,
  ],
  exports: [AssistantService, PseudonymiseurService, ExportService],
})
export class AssistantModule {}
