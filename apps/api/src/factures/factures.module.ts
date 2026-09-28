import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { ExtractionService } from '../assistant/extraction.service';
import { MoteurService } from '../assistant/moteur.service';
import { ClaudeService } from '../assistant/claude.service';
import { MistralService } from '../assistant/mistral.service';
import { FacturesController } from './factures.controller';
import { FacturesService } from './factures.service';

/** MES FACTURES : l'outil premium des deux espaces de Pilote. */
@Module({
  imports: [BillingModule],
  controllers: [FacturesController],
  providers: [FacturesService, ExtractionService, MoteurService, ClaudeService, MistralService],
})
export class FacturesModule {}
