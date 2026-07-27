import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionsScheduler } from './missions.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    NotificationsModule,
    MatchingModule,
  ],
  controllers: [MissionsController],
  providers: [MissionsService, MissionsScheduler],
  exports: [MissionsService],
})
export class MissionsModule {}
