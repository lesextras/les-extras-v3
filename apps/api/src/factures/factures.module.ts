import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { ExtractionService } from '../assistant/extraction.service';
import { MoteurService } from '../assistant/moteur.service';
import { ClaudeService } from '../assistant/claude.service';
import { MistralService } from '../assistant/mistral.service';
import { FacturesController } from './factures.controller';
import { FacturesService } from './factures.service';
import { EnveloppesService } from './enveloppes.service';
import { FournisseursService } from './fournisseurs.service';
import { RelevesService } from './releves.service';
import { FraisService } from './frais.service';
import { BilanService } from './bilan.service';
import { DevisService } from './devis.service';
import { TresorerieService } from './tresorerie.service';
import { SessionsService } from './sessions.service';
import { IngestionService } from './ingestion.service';

/** MES FACTURES : l'outil premium des deux espaces de Pilote. */
@Module({
  imports: [BillingModule],
  controllers: [FacturesController],
  providers: [FacturesService, EnveloppesService, FournisseursService, RelevesService, FraisService, BilanService, DevisService, TresorerieService, SessionsService, IngestionService, ExtractionService, MoteurService, ClaudeService, MistralService],
})
export class FacturesModule {}
