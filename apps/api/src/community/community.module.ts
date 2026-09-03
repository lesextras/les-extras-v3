import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { HebdoScheduler } from './hebdo.scheduler';
import { ActivationScheduler } from './activation.scheduler';
import { TunnelScheduler } from './tunnel.scheduler';
import { EnqueteScheduler } from './enquete.scheduler';
import { MailModule } from '../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [CommunityController],
  providers: [
    CommunityService,
    HebdoScheduler,
    ActivationScheduler,
    TunnelScheduler,
    EnqueteScheduler,
  ],
  exports: [CommunityService],
})
export class CommunityModule {}
