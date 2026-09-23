import { Module } from '@nestjs/common';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';
import { ConformiteScheduler } from './conformite.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaudeService } from '../assistant/claude.service';
import { MistralService } from '../assistant/mistral.service';
import { MoteurService } from '../assistant/moteur.service';
import { ExtractionService } from '../assistant/extraction.service';
import { PreControleService } from './pre-controle.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ConformiteController],
  // MoteurService (et ses deux moteurs) et ExtractionService sont instanciés ici plutôt qu'importés
  // d'AssistantModule : ce module-là tire Billing, École, Boutique… et le
  // cycle d'imports faisait tomber l'API au démarrage (23/09/2026).
  providers: [
    ConformiteService,
    ConformiteScheduler,
    PreControleService,
    MoteurService,
    ClaudeService,
    MistralService,
    ExtractionService,
  ],
  exports: [ConformiteService],
})
export class ConformiteModule {}
