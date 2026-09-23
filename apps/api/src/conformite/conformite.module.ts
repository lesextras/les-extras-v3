import { Module } from '@nestjs/common';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';
import { ConformiteScheduler } from './conformite.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaudeService } from '../assistant/claude.service';
import { ExtractionService } from '../assistant/extraction.service';
import { PreControleService } from './pre-controle.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ConformiteController],
  // ClaudeService et ExtractionService sont instanciés ici plutôt qu'importés
  // d'AssistantModule : ce module-là tire Billing, École, Boutique… et le
  // cycle d'imports faisait tomber l'API au démarrage (23/09/2026).
  providers: [
    ConformiteService,
    ConformiteScheduler,
    PreControleService,
    ClaudeService,
    ExtractionService,
  ],
  exports: [ConformiteService],
})
export class ConformiteModule {}
