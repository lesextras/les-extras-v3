import { Module } from '@nestjs/common';
import { CommunityModule } from '../community/community.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionsScheduler } from './missions.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    CommunityModule,
    NotificationsModule,
    MatchingModule,
    // Active le moteur de tâches planifiées de NestJS. Il est déclaré ici
    // (et non dans AppModule) car c'est le seul module qui expose aujourd'hui
    // une tâche planifiée ; l'explorateur de @nestjs/schedule balaie de toute
    // façon l'ensemble des providers de l'application.
    ScheduleModule.forRoot(),
  ],
  controllers: [MissionsController],
  providers: [MissionsService, MissionsScheduler],
  exports: [MissionsService],
})
export class MissionsModule {}
