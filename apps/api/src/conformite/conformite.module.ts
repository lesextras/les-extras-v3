import { Module } from '@nestjs/common';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';
import { ConformiteScheduler } from './conformite.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ConformiteController],
  providers: [ConformiteService, ConformiteScheduler],
  exports: [ConformiteService],
})
export class ConformiteModule {}
