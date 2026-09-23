import { Module } from '@nestjs/common';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';
import { ConformiteScheduler } from './conformite.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssistantModule } from '../assistant/assistant.module';
import { PreControleService } from './pre-controle.service';

@Module({
  // AssistantModule : le pré-contrôle des pièces lit avec les mêmes moteurs que LEX.
  imports: [NotificationsModule, AssistantModule],
  controllers: [ConformiteController],
  providers: [ConformiteService, ConformiteScheduler, PreControleService],
  exports: [ConformiteService],
})
export class ConformiteModule {}
