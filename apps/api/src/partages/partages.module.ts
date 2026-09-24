import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { MailModule } from '../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PartagesController } from './partages.controller';
import { PartagesService } from './partages.service';

@Module({
  imports: [AgendaModule, MailModule, NotificationsModule],
  controllers: [PartagesController],
  providers: [PartagesService],
})
export class PartagesModule {}
