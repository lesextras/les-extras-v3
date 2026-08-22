import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { PublicChatController, PublicLexDemoController } from './public-chat.controller';
import { AssistantService } from './assistant.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { ClaudeService } from './claude.service';
import { MistralService } from './mistral.service';
import { MOTEUR_LEX } from './moteur-lex';
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
    ClaudeService,
    MistralService,
    {
      // Claude dès que sa clé est posée ; Mistral sinon. Le repli garde la
      // plateforme utilisable si l'on décide de revenir en arrière : il suffit
      // de retirer ANTHROPIC_API_KEY, sans toucher au code.
      provide: MOTEUR_LEX,
      useFactory: (claude: ClaudeService, mistral: MistralService) =>
        claude.disponible ? claude : mistral,
      inject: [ClaudeService, MistralService],
    },
    TramesMaisonService,
    ExtractionService,
    ExportService,
  ],
  exports: [AssistantService, PseudonymiseurService, ExportService],
})
export class AssistantModule {}
