import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { HebdoScheduler } from './hebdo.scheduler';
import { ActivationScheduler } from './activation.scheduler';
import { MailModule } from '../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [CommunityController],
  providers: [CommunityService, HebdoScheduler, ActivationScheduler],
  exports: [CommunityService],
})
export class CommunityModule {}
