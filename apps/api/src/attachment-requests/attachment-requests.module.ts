import { Module } from '@nestjs/common';
import { MailModule } from '../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AttachmentRequestsService } from './attachment-requests.service';
import { AttachmentRequestsController } from './attachment-requests.controller';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [AttachmentRequestsController],
  providers: [AttachmentRequestsService],
  exports: [AttachmentRequestsService],
})
export class AttachmentRequestsModule {}
