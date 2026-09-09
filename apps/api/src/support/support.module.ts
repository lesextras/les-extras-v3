import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportAdminController } from './support-admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Le contrôleur d'administration est déclaré en premier : ses routes sont
 * préfixées `admin/assistance` et ne doivent jamais être interceptées par le
 * `:id` du contrôleur des personnes.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [SupportAdminController, SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
