import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConformiteModule } from '../conformite/conformite.module';
import { MailModule } from '../common/mail/mail.module';
import { ComptesScheduler } from './comptes.scheduler';

@Module({
  imports: [NotificationsModule, ConformiteModule, MailModule],
  controllers: [AdminController],
  // ⚠ `ComptesScheduler` est le SEUL endroit du dépôt où un compte est
  // réellement détruit, et il ne le fait qu'après le délai de trois mois. La
  // route « Supprimer » ne fait plus que programmer l'échéance.
  providers: [AdminService, ComptesScheduler],
  exports: [AdminService],
})
export class AdminModule {}
