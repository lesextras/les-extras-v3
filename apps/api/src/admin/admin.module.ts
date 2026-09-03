import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConformiteModule } from '../conformite/conformite.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [NotificationsModule, ConformiteModule, MailModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
