import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { HebdoScheduler } from './hebdo.scheduler';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [CommunityController],
  providers: [CommunityService, HebdoScheduler],
  exports: [CommunityService],
})
export class CommunityModule {}
