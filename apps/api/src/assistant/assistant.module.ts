import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { PublicChatController, PublicLexDemoController } from './public-chat.controller';
import { AssistantService } from './assistant.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { RegistrePseudoService } from './registre-pseudo.service';
import { ClaudeService } from './claude.service';
import { MistralService } from './mistral.service';
import { MoteurService } from './moteur.service';
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
    RegistrePseudoService,
    AssistantService,
    PseudonymiseurService,
    ClaudeService,
    MistralService,
    MoteurService,
    {
      // LEX PASSE PAR LE MÊME MOTEUR QUE LE RESTE DE LA MAISON (08/09/2026).
      //
      // Avant : « Claude dès que sa clé est posée, Mistral sinon ». Le défaut
      // saute dès que le compte Anthropic n'a plus de crédit : la clé est
      // toujours là, donc Claude est toujours « disponible », donc LEX appelle
      // un moteur qui répond « credit balance too low » — et le repli Mistral
      // n'est jamais tenté, puisqu'on n'a jamais échoué à choisir, seulement à
      // appeler.
      //
      // MoteurService, lui, essaie DANS L'ORDRE et repasse au suivant quand un
      // moteur refuse : Gemini, puis Mistral, puis Claude. Les deux premiers
      // ont une offre gratuite ; il suffit d'une seule clé pour que LEX marche.
      provide: MOTEUR_LEX,
      useFactory: (moteur: MoteurService) => moteur,
      inject: [MoteurService],
    },
    TramesMaisonService,
    ExtractionService,
    ExportService,
  ],
  // ClaudeService, ExtractionService et MOTEUR_LEX sortent pour le pré-contrôle
  // des pièces (ConformiteModule) : même moteur, même lecture, pas de doublon.
  exports: [
    AssistantService,
    PseudonymiseurService,
    ExportService,
    ClaudeService,
    ExtractionService,
    MOTEUR_LEX,
  ],
})
export class AssistantModule {}
