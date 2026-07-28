import { Module } from '@nestjs/common';
import { CommunityModule } from '../community/community.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    CommunityModule,
    NotificationsModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
