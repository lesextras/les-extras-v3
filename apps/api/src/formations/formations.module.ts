import { Module } from '@nestjs/common';
import { FormationsController } from './formations.controller';
import { FormationsService } from './formations.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FormationsController],
  providers: [FormationsService],
  exports: [FormationsService],
})
export class FormationsModule {}
